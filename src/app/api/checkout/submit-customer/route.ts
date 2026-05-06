import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forwardToCRM, logAudit } from '@/lib/stripe';

// POST /api/checkout/submit-customer - Customer submits personal data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, email, phone, firstName, lastName, dob, country, address1, address2, city, zip, state } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!email || !firstName || !lastName || !country || !address1 || !city || !zip) {
      return NextResponse.json(
        { error: 'All required fields must be filled', code: 'validation_error' },
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

    if (session.status !== 'pending' && session.status !== 'collecting_data') {
      return NextResponse.json(
        { error: 'Session is not in a valid state for data submission', code: 'invalid_state' },
        { status: 400 }
      );
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session has expired', code: 'expired' },
        { status: 410 }
      );
    }

    // Update session with customer data
    const updatedSession = await db.checkoutSession.update({
      where: { id: sessionId },
      data: {
        customerEmail: email,
        customerPhone: phone || null,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerDob: dob || null,
        customerCountry: country,
        customerAddress1: address1,
        customerAddress2: address2 || null,
        customerCity: city,
        customerZip: zip,
        customerState: state || null,
        status: 'collecting_data',
      },
    });

    // Forward customer data to Atlas CRM (async, non-blocking)
    const customerData = {
      email, phone, firstName, lastName, dob, country,
      address1, address2, city, zip, state,
      storeName: session.merchant.name,
      storeRef: session.merchant.ref,
      orderRef: session.ref,
      merchantRef: session.merchantRef,
      product: session.productName,
      amount: session.amount,
      currency: session.currency,
    };

    forwardToCRM(sessionId, customerData).then(success => {
      if (success) {
        db.checkoutSession.update({
          where: { id: sessionId },
          data: { crmForwarded: true, crmForwardedAt: new Date() },
        }).catch(() => {});
      }
    }).catch(() => {});

    await logAudit('customer_data_submitted', sessionId, {
      email,
      country,
      firstName: firstName,
      lastName: lastName,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: updatedSession.id,
        status: updatedSession.status,
      },
    });
  } catch (error) {
    console.error('Customer submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'server_error' },
      { status: 500 }
    );
  }
}
