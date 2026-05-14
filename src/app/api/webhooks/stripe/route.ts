import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit, forwardToCRM } from '@/lib/stripe';
import Stripe from 'stripe';

// POST /api/webhooks/stripe
// Strict mode: signature verification in production, idempotency via WebhookEvent table,
// structured status mapping for both Payment Intent and Crypto Onramp events.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // ── Strict mode: reject if secret missing in production ──
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('[STRIPE WEBHOOK] FATAL: Missing STRIPE_WEBHOOK_SECRET in production.');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    // ── Signature verification ────────────────────────────────
    let event: Stripe.Event;

    if (webhookSecret) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2026-04-22.dahlia',
      });
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (err) {
        console.error('[STRIPE WEBHOOK] Invalid signature:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // Dev mode: parse without verification
      event = JSON.parse(payload);
    }

    if (!event.id) {
      return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
    }

    // ── Idempotency check ────────────────────────────────────
    const existingEvent = await db.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent) {
      console.log(`[STRIPE WEBHOOK] Event ${event.id} already processed. Skipping.`);
      return NextResponse.json({ received: true, skipped: true });
    }

    // ── Audit: event received ────────────────────────────────
    await logAudit('webhook_received', undefined, {
      type: event.type,
      eventId: event.id,
    });

    // ── Handle Crypto Onramp events (primary flow) ────────────
    // Note: crypto.onramp_session.updated is not in Stripe SDK types but is a valid event
    if ((event as any).type === 'crypto.onramp_session.updated' || event.type === 'crypto.onramp_session.updated') {
      const onrampSession = (event as any).data?.object as any;
      const stripeSessionId = onrampSession?.id;
      const status = onrampSession?.status;

      if (stripeSessionId && status) {
        await logAudit('webhook_onramp_updated', undefined, { stripeSessionId, status });

        switch (status) {
          case 'fulfillment_complete': {
            const updated = await db.checkoutSession.updateMany({
              where: { stripeSessionId, status: { in: ['processing', 'pending', 'collecting_data', 'l1_approved'] } },
              data: { status: 'paid', paidAt: new Date() },
            });

            if (updated.count > 0) {
              // Forward to CRM on successful payment
              const session = await db.checkoutSession.findFirst({
                where: { stripeSessionId },
              });
              if (session) {
                try {
                  await forwardToCRM(session.id, {
                    orderRef: session.ref,
                    merchantRef: session.merchantRef,
                    amount: session.amount,
                    currency: session.currency,
                    customerEmail: session.customerEmail,
                    customerName: `${session.customerFirstName || ''} ${session.customerLastName || ''}`.trim(),
                    status: 'paid',
                    source: 'webhook_onramp',
                  });
                } catch {
                  // CRM failure non-blocking
                }
              }
            }
            break;
          }

          case 'rejected': {
            await db.checkoutSession.updateMany({
              where: { stripeSessionId },
              data: { status: 'failed' },
            });
            break;
          }

          case 'requires_payment':
          case 'fulfillment_processing': {
            await db.checkoutSession.updateMany({
              where: { stripeSessionId, status: { in: ['pending', 'collecting_data', 'l1_approved'] } },
              data: { status: 'processing' },
            });
            break;
          }

          case 'canceled': {
            await db.checkoutSession.updateMany({
              where: { stripeSessionId },
              data: { status: 'cancelled', cancelledAt: new Date() },
            });
            break;
          }

          default:
            console.warn(`[STRIPE WEBHOOK] Unmapped onramp status: ${status}`);
            break;
        }
      }
    }

    // ── Handle Payment Intent events (Phase 2 embedded flow) ──
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data?.object as Stripe.PaymentIntent;
      const sessionId = pi.metadata?.sessionId;

      if (sessionId && pi.metadata?.orderRef) {
        const updated = await db.checkoutSession.updateMany({
          where: { id: sessionId, status: { in: ['processing', 'pending'] } },
          data: { status: 'paid', paidAt: new Date(), paymentIntentId: pi.id },
        });

        if (updated.count > 0) {
          await logAudit('webhook_payment_succeeded', sessionId, {
            paymentIntentId: pi.id,
            amount: pi.amount,
            currency: pi.currency,
          });

          const session = await db.checkoutSession.findUnique({ where: { id: sessionId } });
          if (session) {
            try {
              await forwardToCRM(sessionId, {
                orderRef: session.ref,
                merchantRef: session.merchantRef,
                amount: session.amount,
                currency: session.currency,
                customerEmail: session.customerEmail,
                customerName: `${session.customerFirstName || ''} ${session.customerLastName || ''}`.trim(),
                status: 'paid',
                paymentIntentId: pi.id,
                source: 'webhook_payment',
              });
            } catch {
              // CRM failure non-blocking
            }
          }
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data?.object as Stripe.PaymentIntent;
      const sessionId = pi.metadata?.sessionId;
      if (sessionId) {
        await db.checkoutSession.updateMany({
          where: { id: sessionId },
          data: { status: 'failed' },
        });
        await logAudit('webhook_payment_failed', sessionId, {
          paymentIntentId: pi.id,
          lastPaymentError: pi.last_payment_error?.message,
        });
      }
    }

    if (event.type === 'payment_intent.canceled') {
      const pi = event.data?.object as Stripe.PaymentIntent;
      const sessionId = pi.metadata?.sessionId;
      if (sessionId) {
        await db.checkoutSession.updateMany({
          where: { id: sessionId },
          data: { status: 'cancelled', cancelledAt: new Date() },
        });
        await logAudit('webhook_payment_cancelled', sessionId, {
          paymentIntentId: pi.id,
        });
      }
    }

    // ── Persist processed event (idempotency record) ──────────
    await db.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        status: 'processed',
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Critical Failure:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
