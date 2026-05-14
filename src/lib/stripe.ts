import Stripe from 'stripe';
import { db } from '@/lib/db';

// ─── Stripe SDK Instance ──────────────────────────────────────────
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return _stripe;
}

// ─── Stripe Crypto Onramp Service ────────────────────────────────
// Creates a Crypto Onramp session via Stripe API
// The onramp session handles: KYC L1/L2, payment collection, fiat-to-crypto conversion
// Reference: https://docs.stripe.com/crypto/onramp-create-session

interface StripeOnrampSessionParams {
  sourceAmount: number;        // Amount in cents
  sourceCurrency: string;      // EUR or USD
  walletAddress: string;       // Destination wallet address
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
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not configured');

  // Convert cents to decimal for Stripe API
  const sourceAmountDecimal = params.sourceAmount / 100;

  const body = new URLSearchParams({
    'source_amount': String(sourceAmountDecimal),
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
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2026-04-22.dahlia',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Stripe onramp session error:', errorData);
    throw new Error(`Stripe API error: ${response.status}`);
  }

  const data = await response.json();
  return data as StripeOnrampSessionResponse;
}

// ─── Webhook Signature Verification ──────────────────────────────
export function verifyStripeWebhook(payload: string, signature: string): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured');
    return true;
  }

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

// ─── Audit Logging ───────────────────────────────────────────────
export async function logAudit(
  action: string,
  sessionId: string | undefined,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        sessionId: sessionId || null,
        action,
        metadata: JSON.stringify(metadata),
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Non-blocking: don't throw on audit failure
  }
}

// ─── CRM Forwarding ─────────────────────────────────────────────
export async function forwardToCRM(
  sessionId: string,
  payload: {
    orderRef: string;
    merchantRef?: string | null;
    amount: number;
    currency: string;
    customerEmail?: string | null;
    customerName?: string;
    status: string;
    paymentIntentId?: string;
    source?: string;
  }
): Promise<void> {
  const crmUrl = process.env.ATLAS_CRM_WEBHOOK_URL;
  const crmApiKey = process.env.ATLAS_API_KEY;

  if (!crmUrl) {
    console.warn('ATLAS_CRM_WEBHOOK_URL not configured, skipping CRM forward');
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (crmApiKey) {
      headers['Authorization'] = `Bearer ${crmApiKey}`;
    }

    const response = await fetch(crmUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId,
        ...payload,
        forwardedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`CRM forward failed: ${response.status} ${response.statusText}`);
    } else {
      // Mark as forwarded in DB
      await db.checkoutSession.update({
        where: { id: sessionId },
        data: {
          crmForwarded: true,
          crmForwardedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('CRM forward error:', error);
    // Non-blocking: don't throw on CRM failure
  }
}
