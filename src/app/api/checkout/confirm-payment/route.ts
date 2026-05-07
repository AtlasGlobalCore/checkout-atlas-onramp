import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit, forwardToCRM } from '@/lib/stripe';
import Stripe from 'stripe';

// POST /api/checkout/confirm-payment
// Called after successful payment on the frontend to update session status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, paymentIntentId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required', code: 'validation_error' },
        { status: 400 }
      );
    }

    const session = await db.checkoutSession.findUnique({
      where: { id: sessionId },
      include: { merchant: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found', code: 'not_found' },
        { status: 404 }
      );
    }

    // DEMO MODE: Handle demo payment confirmation
    if (!process.env.STRIPE_SECRET_KEY) {
      if (session.status === 'paid') {
        return NextResponse.json({
          success: true,
          data: { status: 'already_paid' },
        });
      }

      await db.checkoutSession.update({
        where: { id: sessionId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });

      await logAudit('payment_confirmed_demo', sessionId, {
        mode: 'demo',
        amount: session.amount,
        currency: session.currency,
      });

      // Forward to CRM (simulated in demo mode)
      try {
        await forwardToCRM(sessionId, {
          orderRef: session.ref,
          merchantRef: session.merchantRef,
          amount: session.amount,
          currency: session.currency,
          customerEmail: session.customerEmail,
          customerName: `${session.customerFirstName} ${session.customerLastName}`,
          status: 'paid',
          mode: 'demo',
        });
      } catch {
        // CRM forwarding failure should not block payment
      }

      return NextResponse.json({
        success: true,
        data: { status: 'paid', mode: 'demo' },
      });
    }

    // PRODUCTION: Verify Payment Intent with Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId || session.paymentIntentId || '');

    if (pi.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not succeeded', code: 'payment_not_complete', paymentStatus: pi.status },
        { status: 400 }
      );
    }

    // Verify amount matches
    if (pi.amount !== session.amount) {
      await logAudit('payment_amount_mismatch', sessionId, {
        expected: session.amount,
        received: pi.amount,
      });

      return NextResponse.json(
        { error: 'Payment amount mismatch', code: 'amount_mismatch' },
        { status: 400 }
      );
    }

    // Update session to paid
    await db.checkoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentIntentId: pi.id,
      },
    });

    await logAudit('payment_confirmed', sessionId, {
      paymentIntentId: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      paymentMethod: pi.payment_method_types?.join(','),
    });

    // Forward to CRM
    try {
      await forwardToCRM(sessionId, {
        orderRef: session.ref,
        merchantRef: session.merchantRef,
        amount: session.amount,
        currency: session.currency,
        customerEmail: session.customerEmail,
        customerName: `${session.customerFirstName} ${session.customerLastName}`,
        status: 'paid',
        paymentIntentId: pi.id,
        mode: 'live',
      });
    } catch {
      // CRM forwarding failure should not block payment
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'paid',
        mode: 'live',
        paymentIntentId: pi.id,
      },
    });
  } catch (error) {
    console.error('Confirm payment error:', error);

    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
