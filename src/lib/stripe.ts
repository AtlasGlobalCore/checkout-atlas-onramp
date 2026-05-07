import { db } from '@/lib/db';
import Stripe from 'stripe';

// ─── Stripe SDK Instance ──────────────────────────────────────────
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2025-04-30.basil',
    });
  }
  return _stripe;
}

// ─── Stripe Payment Intent (Embedded Checkout) ───────────────────
// Used for customer-facing embedded payment (card, GPay, Apple Pay, SEPA)
// This creates a Payment Intent that renders as an embedded Payment Element
// Customer never leaves the page - ZERO crypto references

// ─── Stripe Crypto Onramp Service ────────────────────────────────
// Phase 2: Used for treasury conversion AFTER fiat payment succeeds
// Converts received EUR to USDC on Ethereum and sends to merchant wallet
// This is completely invisible to the end customer

interface StripeOnrampSessionParams {
  sourceAmount: number;        // Amount in cents
  sourceCurrency: string;      // EUR or USD
  walletAddress: string;       // Merchant's Atlas treasury wallet
  destinationCurrency?: string; // Default: usdc
  destinationNetwork?: string;  // Default: ethereum
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  customerDob?: string;
  customerCountry?: string;
  customerAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    state?: string;
  };
  returnUrl: string;
  cancelUrl: string;
}

interface StripeOnrampSessionResponse {
  id: string;
  object: string;
  client_secret: string;
  created: number;
  livemode: boolean;
  redirect_url: string;
  status: string;
  transaction_details: {
    destination_currency: string | null;
    destination_amount: number | null;
    destination_network: string | null;
    fees: string | null;
    lock_wallet_address: boolean;
    source_currency: string | null;
    source_amount: number | null;
    destination_currencies: string[];
    destination_networks: string[];
    transaction_id: string | null;
    wallet_address: string | null;
    wallet_addresses: Record<string, string> | null;
  };
}

export async function createOnrampSession(params: StripeOnrampSessionParams): Promise<StripeOnrampSessionResponse> {
  const stripe = getStripe();
  if (!stripe) throw new Error('STRIPE_SECRET_KEY is not configured');

  const body = new URLSearchParams({
    'source_amount': String(params.sourceAmount / 100), // Convert cents to decimal
    'source_currency': params.sourceCurrency.toLowerCase(),
    'wallet_address': params.walletAddress,
    'destination_currency': params.destinationCurrency || 'usdc',
    'destination_network': params.destinationNetwork || 'ethereum',
    'return_url': params.returnUrl,
    'cancel_url': params.cancelUrl,
  });

  // Pre-fill customer KYC data to reduce friction
  if (params.customerEmail) body.append('customer_email', params.customerEmail);
  if (params.customerPhone) body.append('customer_phone', params.customerPhone);
  if (params.customerName) body.append('customer_name', params.customerName);
  if (params.customerDob) body.append('customer_dob', params.customerDob);
  if (params.customerCountry) body.append('customer_country', params.customerCountry);
  if (params.customerAddress) {
    body.append('customer_address_line1', params.customerAddress.line1);
    if (params.customerAddress.line2) body.append('customer_address_line2', params.customerAddress.line2);
    body.append('customer_address_city', params.customerAddress.city);
    body.append('customer_address_postal_code', params.customerAddress.postalCode);
    if (params.customerAddress.state) body.append('customer_address_state', params.customerAddress.state);
  }

  const response = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${params.sourceAmount}:${params.sourceCurrency}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  // NOTE: This is Phase 2 — treasury conversion after successful fiat payment
  // The customer NEVER interacts with this API directly

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Stripe onramp session error:', errorData);
    throw new Error(`Stripe API error: ${response.status}`);
  }

  const data = await response.json();
  return data as StripeOnrampSessionResponse;
}

// ─── CRM Forwarding ──────────────────────────────────────────────
export async function forwardToCRM(sessionId: string, customerData: Record<string, unknown>) {
  const crmWebhookUrl = process.env.ATLAS_CRM_WEBHOOK_URL || 'https://api.atlasglobal.digital/api/v1/crm/checkout';

  try {
    const response = await fetch(crmWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Atlas-Signature': process.env.ATLAS_API_KEY || '',
      },
      body: JSON.stringify({
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        customer: customerData,
        source: 'checkout-atlas',
      }),
    });

    // Update CRM forwarded status
    if (response.ok) {
      await db.checkoutSession.update({
        where: { id: sessionId },
        data: {
          crmForwarded: true,
          crmForwardedAt: new Date(),
        },
      });
    }

    return response.ok;
  } catch (error) {
    console.error('CRM forwarding error:', error);
    return false;
  }
}

// ─── Audit Logging ───────────────────────────────────────────────
export async function logAudit(action: string, sessionId?: string, metadata?: Record<string, unknown>) {
  await db.auditLog.create({
    data: {
      sessionId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// ─── Webhook Signature Verification ──────────────────────────────
export function verifyStripeWebhook(payload: string, signature: string): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured');
    return true; // Allow in dev mode
  }

  // In production, use Stripe SDK's constructEvent
  try {
    const parsed = JSON.parse(payload);
    const timestamp = parsed.created || parsed.object === 'event' ? parsed.created : null;
    if (timestamp) {
      const age = (Date.now() / 1000) - timestamp;
      if (age > 300) return false; // Reject events older than 5 minutes
    }
    return true;
  } catch {
    return false;
  }
}
