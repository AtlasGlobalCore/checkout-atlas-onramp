import { NextRequest, NextResponse } from 'next/server';

// POST /api/onramp/create
// Phase 1: Creates a Stripe Crypto Onramp session directly (no DB dependency)
// The onramp session handles KYC L1/L2, payment collection, and conversion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Montante invalido. O valor deve ser superior a 0.', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Minimum 1 EUR/USD in cents
    if (amount < 100) {
      return NextResponse.json(
        { error: 'Montante minimo de 1.00.', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Maximum 10,000 EUR/USD in cents
    if (amount > 1000000) {
      return NextResponse.json(
        { error: 'Montante maximo de 10,000.00.', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Validate currency
    if (!['EUR', 'USD'].includes(currency?.toUpperCase())) {
      return NextResponse.json(
        { error: 'Moeda invalida. Apenas EUR e USD sao suportadas.', code: 'validation_error' },
        { status: 400 }
      );
    }

    const validatedCurrency = currency.toUpperCase();
    const validatedAmount = Math.round(amount); // Ensure integer cents

    // Check Stripe configuration
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const walletAddress = process.env.ATLAS_TREASURY_WALLET;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Servico de pagamento nao configurado. Contacte o suporte.', code: 'config_error' },
        { status: 503 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Configuracao de destino invalida. Contacte o suporte.', code: 'config_error' },
        { status: 503 }
      );
    }

    // Build the return and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const returnUrl = `${baseUrl}/?status=success`;
    const cancelUrl = `${baseUrl}/?status=cancelled`;

    // Convert cents to decimal for Stripe API
    const sourceAmountDecimal = validatedAmount / 100;

    // Create Stripe Crypto Onramp Session
    // Reference: https://docs.stripe.com/crypto/onramp-create-session
    const formData = new URLSearchParams({
      source_amount: String(sourceAmountDecimal),
      source_currency: validatedCurrency.toLowerCase(),
      wallet_address: walletAddress,
      destination_currency: 'usdc',
      destination_network: 'ethereum',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    });

    const response = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-04-30.basil',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stripe onramp session creation failed:', response.status, errorText);

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Erro de autenticacao. Contacte o suporte.', code: 'auth_error' },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao inicializar o pagamento. Tente novamente.', code: 'stripe_error' },
        { status: 502 }
      );
    }

    const sessionData = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionData.id,
        redirectUrl: sessionData.redirect_url,
        status: sessionData.status,
      },
    });
  } catch (error) {
    console.error('Onramp create error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.', code: 'server_error' },
      { status: 500 }
    );
  }
}
