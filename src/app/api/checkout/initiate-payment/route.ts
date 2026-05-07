import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createOnrampSession, logAudit } from '@/lib/stripe';

// POST /api/checkout/initiate-payment - Create Stripe onramp session for payment
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
    const merchantWallet = process.env.ATLAS_TREASURY_WALLET;

    // DEMO MODE: If Stripe is not configured, return a demo redirect
    if (!stripeKey || !merchantWallet) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const demoRedirectUrl = `${baseUrl}/${encodeURIComponent(session.merchant.ref || session.merchant.id)}/${encodeURIComponent(session.ref)}?status=success&demo=true`;

      await db.checkoutSession.update({
        where: { id: sessionId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          stripeRedirectUrl: demoRedirectUrl,
        },
      });

      await logAudit('payment_demo_completed', sessionId, {
        mode: 'demo',
        amount: session.amount,
        currency: session.currency,
      });

      return NextResponse.json({
        success: true,
        data: {
          mode: 'demo',
          redirectUrl: demoRedirectUrl,
          status: 'paid',
          message: 'Demo mode: Stripe not configured. Payment simulated successfully.',
        },
      });
    }

    // PRODUCTION: Create real Stripe onramp session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const returnUrl = `${baseUrl}/${encodeURIComponent(session.merchant.ref || session.merchant.id)}/${encodeURIComponent(session.ref)}?status=success`;
    const cancelUrl = `${baseUrl}/${encodeURIComponent(session.merchant.ref || session.merchant.id)}/${encodeURIComponent(session.ref)}?status=cancelled`;

    try {
      const stripeSession = await createOnrampSession({
        sourceAmount: session.amount,
        sourceCurrency: session.currency.toLowerCase(),
        walletAddress: merchantWallet,
        destinationCurrency: 'usdc',
        destinationNetwork: 'ethereum',
        customerEmail: session.customerEmail,
        customerPhone: session.customerPhone || undefined,
        customerName: `${session.customerFirstName} ${session.customerLastName}`,
        customerDob: session.customerDob || undefined,
        customerCountry: session.customerCountry || undefined,
        customerAddress: session.customerAddress1 ? {
          line1: session.customerAddress1,
          line2: session.customerAddress2 || undefined,
          city: session.customerCity || '',
          postalCode: session.customerZip || '',
          state: session.customerState || undefined,
        } : undefined,
        returnUrl,
        cancelUrl,
      });

      // Update session with Stripe data
      await db.checkoutSession.update({
        where: { id: sessionId },
        data: {
          status: 'processing',
          stripeSessionId: stripeSession.id,
          stripeClientSecret: stripeSession.client_secret,
          stripeRedirectUrl: stripeSession.redirect_url,
        },
      });

      await logAudit('stripe_session_created', sessionId, {
        stripeSessionId: stripeSession.id,
        amount: session.amount,
        currency: session.currency,
      });

      return NextResponse.json({
        success: true,
        data: {
          mode: 'live',
          redirectUrl: stripeSession.redirect_url,
          clientSecret: stripeSession.client_secret,
          stripeSessionId: stripeSession.id,
          status: 'processing',
        },
      });
    } catch (stripeError) {
      console.error('Stripe onramp session creation failed:', stripeError);

      await logAudit('stripe_session_failed', sessionId, {
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
      });

      return NextResponse.json(
        { error: 'Payment processing initialization failed. Please try again.', code: 'stripe_error' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
