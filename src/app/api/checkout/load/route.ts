import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/checkout/load?store=xxx&ref=xxx - Public: load checkout session for customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('store');
    const orderRef = searchParams.get('ref');

    if (!storeSlug || !orderRef) {
      return NextResponse.json(
        { error: 'Missing store or order reference', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Find merchant by ref or id
    const merchant = await db.merchant.findFirst({
      where: {
        OR: [
          { ref: storeSlug },
          { id: storeSlug },
        ],
        isActive: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Store not found', code: 'not_found' },
        { status: 404 }
      );
    }

    // Find checkout session
    const session = await db.checkoutSession.findFirst({
      where: {
        ref: orderRef,
        merchantId: merchant.id,
      },
      include: {
        merchant: {
          select: {
            name: true,
            logoUrl: true,
            ref: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Checkout session not found', code: 'not_found' },
        { status: 404 }
      );
    }

    // Check expiration
    if (session.expiresAt && session.expiresAt < new Date() && session.status === 'pending') {
      await db.checkoutSession.update({
        where: { id: session.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { error: 'This checkout session has expired', code: 'expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        ref: session.ref,
        merchantRef: session.merchantRef,
        store: {
          name: session.merchant.name,
          logoUrl: session.merchant.logoUrl,
          ref: session.merchant.ref,
        },
        order: {
          productName: session.productName,
          productDesc: session.productDesc,
          amount: session.amount,
          currency: session.currency,
        },
        status: session.status,
        locale: session.locale,
        expiresAt: session.expiresAt?.toISOString(),
        // Pre-filled customer data (if returning customer)
        customer: session.customerEmail ? {
          email: session.customerEmail,
          phone: session.customerPhone,
          firstName: session.customerFirstName,
          lastName: session.customerLastName,
          country: session.customerCountry,
          address1: session.customerAddress1,
          address2: session.customerAddress2,
          city: session.customerCity,
          zip: session.customerZip,
          state: session.customerState,
        } : null,
      },
    });
  } catch (error) {
    console.error('Checkout load error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
