import { NextRequest, NextResponse } from 'next/server';
import { createOnrampSession } from '@/lib/stripe';

// POST /api/checkout/initiate-payment - Create Stripe onramp session for payment
// NOTE: Phase 2 - This route uses the full onramp flow with DB session
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
    const merchantWallet = process.env.ATLAS_TREASURY_WALLET;

    if (!stripeKey || !merchantWallet) {
      return NextResponse.json(
        { error: 'Payment service is not configured', code: 'config_error' },
        { status: 503 }
      );
    }

    const { db } = await import('@/lib/db');

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
        customerEmail: session.customerEmail || undefined,
        customerPhone: session.customerPhone || undefined,
        customerName: session.customerFirstName && session.customerLastName
          ? `${session.customerFirstName} ${session.customerLastName}`
          : undefined,
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

      await db.checkoutSession.update({
        where: { id: sessionId },
        data: {
          status: 'processing',
          stripeSessionId: stripeSession.id,
          stripeClientSecret: stripeSession.client_secret,
          stripeRedirectUrl: stripeSession.redirect_url,
        },
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
