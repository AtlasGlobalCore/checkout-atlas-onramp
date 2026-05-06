import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/stripe';
import { v4 as uuidv4 } from 'uuid';

// POST /api/checkout/create - Merchant creates a new checkout session
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required', code: 'auth_missing' },
        { status: 401 }
      );
    }

    const merchant = await db.merchant.findFirst({
      where: { apiKey, isActive: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid API key or merchant not active', code: 'auth_invalid' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const requiredFields = ['productName', 'amount', 'currency'];
    const missing = requiredFields.filter(f => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}`, code: 'validation_error' },
        { status: 400 }
      );
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number (in cents)', code: 'validation_error' },
        { status: 400 }
      );
    }

    if (!['EUR', 'USD'].includes(body.currency?.toUpperCase())) {
      return NextResponse.json(
        { error: 'Currency must be EUR or USD', code: 'validation_error' },
        { status: 400 }
      );
    }

    const orderRef = body.orderRef || uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

    const existing = await db.checkoutSession.findFirst({
      where: { ref: orderRef, merchantId: merchant.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Order reference already exists', code: 'duplicate_ref' },
        { status: 409 }
      );
    }

    const expiresIn = body.expiresInHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresIn);

    const session = await db.checkoutSession.create({
      data: {
        ref: orderRef,
        merchantRef: body.merchantRef || null,
        merchantId: merchant.id,
        productName: body.productName,
        productDesc: body.productDesc || null,
        amount: Math.round(body.amount),
        currency: body.currency.toUpperCase(),
        locale: body.locale || 'pt',
        status: 'pending',
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const checkoutUrl = `${baseUrl}/${encodeURIComponent(merchant.ref || merchant.id)}/${encodeURIComponent(session.ref)}`;

    await logAudit('checkout_created', session.id, {
      merchantId: merchant.id,
      amount: session.amount,
      currency: session.currency,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        orderRef: session.ref,
        checkoutUrl,
        status: session.status,
        expiresAt: session.expiresAt?.toISOString(),
        amount: session.amount,
        currency: session.currency,
      },
    });
  } catch (error) {
    console.error('Checkout create error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
