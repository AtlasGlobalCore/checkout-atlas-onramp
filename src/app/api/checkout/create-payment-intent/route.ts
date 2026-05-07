import { NextRequest, NextResponse } from 'next/server';

// POST /api/checkout/create-payment-intent
// Creates a Stripe Payment Intent for embedded checkout (card, GPay, Apple Pay, SEPA)
// NOTE: Phase 2 - This route requires Stripe API key to be configured (no demo fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

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

    // Import dynamically to avoid issues when Stripe is not installed
    const { db } = await import('@/lib/db');
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-04-30.basil',
    });

    // Find and validate session
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

    if (!['pending', 'collecting_data'].includes(session.status)) {
      return NextResponse.json(
        { error: 'Session is not ready for payment', code: 'invalid_state' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: session.amount,
      currency: session.currency.toLowerCase(),
      metadata: {
        sessionId: session.id,
        orderRef: session.ref,
        merchantId: session.merchantId,
        merchantRef: session.merchantRef || '',
        productName: session.productName,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: session.customerEmail || undefined,
      description: `${session.productName} - ${session.ref}`,
    });

    await db.checkoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'processing',
        paymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        mode: 'live',
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        amount: session.amount,
        currency: session.currency.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
