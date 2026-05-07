import { NextResponse } from 'next/server';

// POST /api/seed - DISABLED
// Demo seeding has been removed in Phase 1.
// Checkout sessions are now created directly via Stripe Crypto Onramp API.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Demo seeding has been removed. Use the onramp API to create payment sessions.',
    },
    { status: 410 }
  );
}
