import { NextRequest, NextResponse } from 'next/server';

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

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Payment service is not configured', code: 'config_error' },
        { status: 503 }
      );
    }

    const { db } = await import('@/lib/db');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-04-30.basil',
    });

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

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId || session.paymentIntentId || '');

    if (pi.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not succeeded', code: 'payment_not_complete', paymentStatus: pi.status },
        { status: 400 }
      );
    }

    if (pi.amount !== session.amount) {
      return NextResponse.json(
        { error: 'Payment amount mismatch', code: 'amount_mismatch' },
        { status: 400 }
      );
    }

    await db.checkoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentIntentId: pi.id,
      },
    });

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
