import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/stripe';
import { v4 as uuidv4 } from 'uuid';

// POST /api/merchant/register - Register a new merchant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeName, storeRef, logoUrl, webhookUrl, adminKey } = body;

    // Simple admin key check (in production, use proper auth)
    const adminApiKey = process.env.ADMIN_API_KEY;
    if (adminApiKey && adminKey !== adminApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'auth_invalid' },
        { status: 401 }
      );
    }

    if (!storeName || !storeRef) {
      return NextResponse.json(
        { error: 'Store name and store reference are required', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Check if ref already exists
    const existing = await db.merchant.findFirst({
      where: { ref: storeRef },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Store reference already in use', code: 'duplicate_ref' },
        { status: 409 }
      );
    }

    // Generate API key
    const apiKey = `ak_live_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const merchant = await db.merchant.create({
      data: {
        ref: storeRef,
        name: storeName,
        logoUrl: logoUrl || null,
        webhookUrl: webhookUrl || null,
        apiKey,
        isActive: true,
      },
    });

    await logAudit('merchant_registered', undefined, {
      merchantId: merchant.id,
      storeRef: merchant.ref,
      storeName: merchant.name,
    });

    return NextResponse.json({
      success: true,
      data: {
        merchantId: merchant.id,
        storeRef: merchant.ref,
        storeName: merchant.name,
        apiKey,
        message: 'Store your API key securely. It will not be shown again.',
      },
    });
  } catch (error) {
    console.error('Merchant register error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
