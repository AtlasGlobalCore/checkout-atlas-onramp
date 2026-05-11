import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { evaluateL1, DECLARATION_TEXT_VERSION, type PreKycL1Status } from '@/lib/prekyc-l1';

// POST /api/checkout/submit-customer
// Validates customer data, runs L1 declarative evaluation, persists result.
// Returns L1 status to the frontend so it can decide whether to allow payment.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      email,
      phone,
      firstName,
      lastName,
      dob,
      country,
      address1,
      address2,
      city,
      zip,
      state,
      declarationAccepted,
      declarationTextVersion,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required', code: 'validation_error' },
        { status: 400 }
      );
    }

    // Basic required-field guard (format-level, not L1 rules)
    if (!email || !firstName || !lastName || !country || !address1 || !city || !zip) {
      return NextResponse.json(
        { error: 'All required fields must be filled', code: 'validation_error' },
        { status: 400 }
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

    // ── L1 Declarative Evaluation ───────────────────────────
    const l1Result = evaluateL1({
      email,
      firstName,
      lastName,
      country,
      declarationAccepted,
      declarationTextVersion,
    });

    const approvedVersion = l1Result.approved
      ? (declarationTextVersion || DECLARATION_TEXT_VERSION)
      : null;

    // ── Persist customer data + L1 result ───────────────────
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

        // Pre-KYC L1 fields
        preKycStatus: l1Result.status,
        preKycL1RejectedReason: l1Result.approved ? null : JSON.stringify(l1Result.errors),
        preKycL1ApprovedAt: l1Result.approved ? new Date() : null,
        declarationAccepted: declarationAccepted === true,
        declarationTextVersion: approvedVersion,

        status: l1Result.approved ? 'l1_approved' : 'collecting_data',
      },
    });

    // ── Audit log ───────────────────────────────────────────
    const auditAction = l1Result.approved
      ? 'prekyc_l1_approved'
      : 'prekyc_l1_rejected';

    await db.auditLog.create({
      data: {
        sessionId,
        action: auditAction,
        metadata: JSON.stringify({
          email,
          country,
          firstName,
          lastName,
          declarationAccepted,
          declarationTextVersion,
          l1Errors: l1Result.errors,
        }),
      },
    });

    // ── Response ────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        sessionId: updatedSession.id,
        status: updatedSession.status,
        preKyc: {
          status: l1Result.status,
          errors: l1Result.approved ? [] : l1Result.errors,
        },
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
