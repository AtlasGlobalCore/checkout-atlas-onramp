import { NextRequest, NextResponse } from 'next/server';

// POST /api/checkout/create-onramp
// Phase 1: Creates a Stripe Crypto Onramp session directly from amount + currency.
// No database session needed — the onramp handles everything (KYC, payment, settlement).
// Returns a redirect URL for the customer to complete payment.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceAmount, sourceCurrency } = body;

    // ── Validation ──────────────────────────────────────────────
    if (!sourceAmount || !sourceCurrency) {
      return NextResponse.json(
        { error: 'sourceAmount and sourceCurrency are required', code: 'validation_error' },
        { status: 400 }
      );
    }

    if (!['eur', 'usd'].includes(sourceCurrency.toLowerCase())) {
      return NextResponse.json(
        { error: 'sourceCurrency must be "eur" or "usd"', code: 'validation_error' },
        { status: 400 }
      );
    }

    if (typeof sourceAmount !== 'number' || sourceAmount < 100) {
      // sourceAmount in cents, min 1.00
      return NextResponse.json(
        { error: 'sourceAmount must be at least 100 (€1.00)', code: 'validation_error' },
        { status: 400 }
      );
    }

    if (sourceAmount > 1000000) {
      // max 10,000.00
      return NextResponse.json(
        { error: 'sourceAmount exceeds maximum of 1000000 (€10,000.00)', code: 'validation_error' },
        { status: 400 }
      );
    }

    // ── Stripe Configuration ────────────────────────────────────
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const merchantWallet = process.env.ATLAS_TREASURY_WALLET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.', code: 'config_error' },
        { status: 503 }
      );
    }

    if (!merchantWallet) {
      return NextResponse.json(
        { error: 'Treasury wallet not configured. Please set ATLAS_TREASURY_WALLET.', code: 'config_error' },
        { status: 503 }
      );
    }

    // ── Build onramp session request ────────────────────────────
    // All crypto parameters are pre-locked and masked from the customer.
    const decimalAmount = (sourceAmount / 100).toFixed(2);
    const bodyParams = new URLSearchParams();

    // Core payment parameters
    bodyParams.append('source_amount', decimalAmount);
    bodyParams.append('source_currency', sourceCurrency.toLowerCase());

    // MASKING: Lock destination to USDC on Ethereum ONLY
    bodyParams.append('destination_currencies[0]', 'usdc');
    bodyParams.append('destination_networks[0]', 'ethereum');

    // MASKING: Lock wallet address (customer never sees/provides a crypto wallet)
    bodyParams.append('lock_wallet_address', 'true');
    bodyParams.append('wallet_addresses[ethereum]', merchantWallet);

    // Settlement speed
    bodyParams.append('settlement_speed', 'instant');

    // Redirect URLs (for when onramp completes)
    bodyParams.append('return_url', `${baseUrl}/?status=success`);
    bodyParams.append('cancel_url', `${baseUrl}/?status=cancelled`);

    // ── Call Stripe API ─────────────────────────────────────────
    const response = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stripe onramp session error:', errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Erro de autenticacao. Contacte o suporte.', code: 'auth_error' },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create payment session. Please try again.', code: 'stripe_error' },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        sessionId: data.id,
        redirectUrl: data.redirect_url,
        clientSecret: data.client_secret,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('Create onramp error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
