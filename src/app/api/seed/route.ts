import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/seed - Create demo merchant + checkout for testing
export async function POST() {
  try {
    let merchant = await db.merchant.findFirst({
      where: { ref: 'demo-store' },
    });

    if (!merchant) {
      merchant = await db.merchant.create({
        data: {
          ref: 'demo-store',
          name: 'TechStore Premium',
          apiKey: 'ak_live_demo_key_for_testing_only',
          isActive: true,
        },
      });
    }

    const session = await db.checkoutSession.create({
      data: {
        ref: 'DEMOPAY01',
        merchantRef: 'REF-2025-001',
        merchantId: merchant.id,
        productName: 'Atlas Pro Wireless Headphones',
        productDesc: 'Premium noise-cancelling headphones with 40h battery life',
        amount: 12999,
        currency: 'EUR',
        locale: 'pt',
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const session2 = await db.checkoutSession.create({
      data: {
        ref: 'DEMOPAY02',
        merchantRef: 'REF-2025-002',
        merchantId: merchant.id,
        productName: 'Smart Watch Ultra',
        productDesc: 'Advanced fitness tracking with GPS and heart rate monitor',
        amount: 29900,
        currency: 'USD',
        locale: 'en',
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    return NextResponse.json({
      success: true,
      message: 'Demo data created',
      merchant: {
        id: merchant.id,
        name: merchant.name,
        ref: merchant.ref,
      },
      checkoutSessions: [
        {
          url: `${baseUrl}/${merchant.ref}/${session.ref}`,
          product: session.productName,
          amount: session.amount,
          currency: session.currency,
        },
        {
          url: `${baseUrl}/${merchant.ref}/${session2.ref}`,
          product: session2.productName,
          amount: session2.amount,
          currency: session2.currency,
        },
      ],
      apiUsage: {
        createCheckout: 'POST /api/checkout/create',
        body: {
          productName: 'Product Name',
          amount: 4999,
          currency: 'EUR',
          orderRef: 'MY-ORDER-REF',
        },
        headers: {
          Authorization: 'Bearer ak_live_demo_key_for_testing_only',
        },
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
