import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit, forwardToCRM } from '@/lib/stripe';
import Stripe from 'stripe';

// POST /api/webhooks/stripe - Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify webhook signature in production
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    if (webhookSecret) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-04-30.basil',
      });
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    } else {
      // Dev mode: parse without verification
      event = JSON.parse(payload);
    }

    await logAudit('webhook_received', undefined, {
      type: event.type,
      eventId: event.id,
    });

    // Handle Payment Intent events (primary flow)
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data?.object as Stripe.PaymentIntent;
        const sessionId = pi.metadata?.sessionId;

        if (sessionId && pi.metadata?.orderRef) {
          const updated = await db.checkoutSession.updateMany({
            where: {
              id: sessionId,
              status: { in: ['processing', 'pending'] },
            },
            data: {
              status: 'paid',
              paidAt: new Date(),
              paymentIntentId: pi.id,
            },
          });

          if (updated.count > 0) {
            await logAudit('webhook_payment_succeeded', sessionId, {
              paymentIntentId: pi.id,
              amount: pi.amount,
              currency: pi.currency,
            });

            // Forward to CRM
            const session = await db.checkoutSession.findUnique({
              where: { id: sessionId },
            });
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
                  source: 'webhook',
                });
              } catch {
                // CRM failure non-blocking
              }
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
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
        break;
      }

      case 'payment_intent.canceled': {
        const pi = event.data?.object as Stripe.PaymentIntent;
        const sessionId = pi.metadata?.sessionId;

        if (sessionId) {
          await db.checkoutSession.updateMany({
            where: { id: sessionId },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(),
            },
          });
          await logAudit('webhook_payment_cancelled', sessionId, {
            paymentIntentId: pi.id,
          });
        }
        break;
      }
    }

    // Handle Crypto Onramp events (legacy / Phase 2 treasury)
    switch (event.type) {
      case 'crypto.onramp_session.completed': {
        const onrampSession = event.data?.object;
        if (onrampSession?.id) {
          await db.checkoutSession.updateMany({
            where: { stripeSessionId: onrampSession.id },
            data: {
              status: 'paid',
              paidAt: new Date(),
            },
          });
          await logAudit('webhook_onramp_completed', undefined, {
            stripeSessionId: onrampSession.id,
          });
        }
        break;
      }

      case 'crypto.onramp_session.failed': {
        const onrampSession = event.data?.object;
        if (onrampSession?.id) {
          await db.checkoutSession.updateMany({
            where: { stripeSessionId: onrampSession.id },
            data: { status: 'failed' },
          });
        }
        break;
      }

      case 'crypto.onramp_session.cancelled': {
        const onrampSession = event.data?.object;
        if (onrampSession?.id) {
          await db.checkoutSession.updateMany({
            where: { stripeSessionId: onrampSession.id },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(),
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
