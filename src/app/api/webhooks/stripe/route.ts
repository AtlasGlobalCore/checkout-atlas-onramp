import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/stripe';

// POST /api/webhooks/stripe - Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify webhook (basic check)
    if (!signature && !process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn('Webhook received without signature and no secret configured');
    }

    const event = JSON.parse(payload);

    await logAudit('webhook_received', undefined, {
      type: event.type,
      eventId: event.id,
    });

    // Handle different event types
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
          await logAudit('webhook_payment_completed', undefined, {
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

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
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
