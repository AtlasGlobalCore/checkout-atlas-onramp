import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/stripe';
import Stripe from 'stripe';

// POST /api/checkout/create-payment-intent
// Creates a Stripe Payment Intent for embedded checkout (card, GPay, Apple Pay, SEPA)
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

    if (!session.customerEmail || !session.customerFirstName || !session.customerLastName) {
      return NextResponse.json(
        { error: 'Customer data is required before payment', code: 'missing_data' },
        { status: 400 }
      );
    }

    // Check if STRIPE is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // DEMO MODE: If Stripe is not configured, return a demo client secret
    if (!stripeKey) {
      const demoClientSecret = `demo_${session.id}_${Date.now()}`;

      await db.checkoutSession.update({
        where: { id: sessionId },
        data: {
          status: 'processing',
          paymentIntentId: `demo_pi_${session.ref}`,
          stripeClientSecret: demoClientSecret,
        },
      });

      await logAudit('payment_intent_created_demo', sessionId, {
        mode: 'demo',
        amount: session.amount,
        currency: session.currency,
      });

      return NextResponse.json({
        success: true,
        data: {
          mode: 'demo',
          clientSecret: demoClientSecret,
          publishableKey: 'pk_demo',
          amount: session.amount,
          currency: session.currency.toLowerCase(),
        },
      });
    }

    // PRODUCTION: Create real Stripe Payment Intent
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-04-30.basil',
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: session.amount, // Already in cents
      currency: session.currency.toLowerCase(),
      metadata: {
        sessionId: session.id,
        orderRef: session.ref,
        merchantId: session.merchantId,
        merchantRef: session.merchantRef || '',
        productName: session.productName,
      },
      // Enable all payment methods automatically (card, GPay, Apple Pay, SEPA, etc.)
      automatic_payment_methods: {
        enabled: true,
      },
      // Pre-fill customer email for Stripe
      receipt_email: session.customerEmail,
      description: `${session.productName} - ${session.ref}`,
    });

    // Update session with Payment Intent data
    await db.checkoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'processing',
        paymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    await logAudit('payment_intent_created', sessionId, {
      paymentIntentId: paymentIntent.id,
      amount: session.amount,
      currency: session.currency,
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
