// ─── Pre-KYC L1 Declarative Service ─────────────────────────────
// Pure domain service — zero provider coupling (no Stripe, no DB).
// Evaluates whether a customer's declared data satisfies L1 minimums.

/**
 * ISO 3166-1 alpha-2 codes accepted for L1.
 * Extend this set when new markets are enabled.
 */
const ACCEPTED_COUNTRIES = new Set([
  'PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'IE', 'LU', 'AT',
  'GB', 'US', 'BR', 'CH',
]);

/** Current active declaration text version — bump when text changes. */
export const DECLARATION_TEXT_VERSION = '1.0';

/** Valid L1 status values persisted in CheckoutSession. */
export type PreKycL1Status = 'pending' | 'approved' | 'rejected';

/** Result of evaluating a customer's L1 declarative data. */
export interface L1EvaluationResult {
  approved: boolean;
  status: PreKycL1Status;
  errors: string[];
}

/** Minimal input contract for L1 evaluation. */
export interface L1Input {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  declarationAccepted?: boolean | null;
  declarationTextVersion?: string | null;
}

// ── Pure evaluation function ──────────────────────────────────

/**
 * Evaluates whether the given input satisfies all L1 declarative rules.
 * Returns a result with `approved`, `status`, and human-readable `errors`.
 *
 * Rules:
 *  1. `email` must be valid (non-empty, contains @, has a TLD)
 *  2. `firstName` must be non-empty after trim
 *  3. `lastName` must be non-empty after trim
 *  4. `country` must be a 2-letter code in ACCEPTED_COUNTRIES
 *  5. `declarationAccepted` must be exactly `true`
 *  6. `declarationTextVersion` must be non-empty
 */
export function evaluateL1(input: L1Input): L1EvaluationResult {
  const errors: string[] = [];

  // Rule 1: email
  if (!input.email || !isValidEmail(input.email)) {
    errors.push('email_invalid');
  }

  // Rule 2: firstName
  if (!input.firstName || input.firstName.trim().length === 0) {
    errors.push('first_name_required');
  }

  // Rule 3: lastName
  if (!input.lastName || input.lastName.trim().length === 0) {
    errors.push('last_name_required');
  }

  // Rule 4: country
  if (!input.country || !isValidCountry(input.country)) {
    errors.push('country_invalid');
  }

  // Rule 5: declaration accepted
  if (input.declarationAccepted !== true) {
    errors.push('declaration_not_accepted');
  }

  // Rule 6: declaration version
  if (!input.declarationTextVersion || input.declarationTextVersion.trim().length === 0) {
    errors.push('declaration_version_missing');
  }

  const approved = errors.length === 0;

  return {
    approved,
    status: approved ? 'approved' : 'rejected',
    errors,
  };
}

// ── Lightweight validators (no external deps) ──────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

function isValidCountry(code: string): boolean {
  return /^[A-Z]{2}$/.test(code.trim().toUpperCase()) &&
    ACCEPTED_COUNTRIES.has(code.trim().toUpperCase());
}
