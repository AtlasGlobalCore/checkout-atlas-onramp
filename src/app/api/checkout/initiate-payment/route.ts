import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createOnrampSession } from '@/lib/stripe';

// POST /api/checkout/initiate-payment
// Creates a Stripe onramp session for payment.
// REQUIREMENT: Pre-KYC L1 must be approved (preKycStatus === 'approved' or status === 'l1_approved').
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

    // ── Load session ────────────────────────────────────────
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

    // ── Pre-KYC L1 gate ─────────────────────────────────────
    if (session.preKycStatus !== 'approved' && session.status !== 'l1_approved') {
      // Audit the blocked attempt
      await db.auditLog.create({
        data: {
          sessionId,
          action: 'payment_blocked_prekyc_required',
          metadata: JSON.stringify({
            preKycStatus: session.preKycStatus,
            sessionStatus: session.status,
          }),
        },
      });

      return NextResponse.json(
        {
          error: 'Identity verification is required before payment.',
          code: 'prekyc_required',
          details: {
            preKycStatus: session.preKycStatus,
            rejectedReason: session.preKycL1RejectedReason,
          },
        },
        { status: 403 }
      );
    }

    // ── Session state validation ────────────────────────────
    const validStatuses = ['l1_approved', 'pending', 'collecting_data'];
    if (!validStatuses.includes(session.status)) {
      return NextResponse.json(
        { error: 'Session is not ready for payment', code: 'invalid_state' },
        { status: 400 }
      );
    }

    // ── Build Stripe Onramp session ─────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const returnUrl = `${baseUrl}/${encodeURIComponent(session.merchant.ref || session.merchant.id)}/${encodeURIComponent(session.ref)}?status=success`;
    const cancelUrl = `${baseUrl}/${encodeURIComponent(session.merchant.ref || session.merchant.id)}/${encodeURIComponent(session.ref)}?status=cancelled`;

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

    // ── Update session ──────────────────────────────────────
    await db.checkoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'processing',
        stripeSessionId: stripeSession.id,
        stripeClientSecret: stripeSession.client_secret,
        stripeRedirectUrl: stripeSession.redirect_url,
      },
    });

    await db.auditLog.create({
      data: {
        sessionId,
        action: 'stripe_onramp_created',
        metadata: JSON.stringify({
          stripeSessionId: stripeSession.id,
          amount: session.amount,
          currency: session.currency,
        }),
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
  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
