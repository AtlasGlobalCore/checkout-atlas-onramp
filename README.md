<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Stripe-Crypto_Onramp-635BFF?logo=stripe&logoColor=white" alt="Stripe Crypto Onramp" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Bun-Runtime-FBF116?logo=bun&logoColor=black" alt="Bun" />
</p>

<h1 align="center">Atlas Payments — Checkout</h1>

<p align="center">
  <strong>White-label payment checkout powered by Stripe Crypto Onramp</strong><br/>
  Multi-currency (EUR/USD) · Multi-language (PT/EN/ES/FR)<br/>
  Zero crypto exposure to end customers · Pre-KYC L1 compliant
</p>

<p align="center">
  <code>checkout.atlasglobal.digital</code>
</p>

---

## Overview

Atlas Payments Checkout is a production-ready **white-label payment solution** built on **Stripe Crypto Onramp** (`onramp_sessions`). The end customer sees a standard fiat payment experience — all crypto conversion (EUR/USD → USDC) happens invisibly on the backend.

### Key Principles

- **Invisible Crypto** — Customer pays in EUR or USD. USDC settlement to treasury wallet is fully transparent.
- **Stripe Crypto Onramp** — Uses `POST /v1/crypto/onramp_sessions` for fiat → crypto conversion.
- **Pre-KYC L1** — Declarative identity verification (email, name, country, declaration) before payment.
- **Mobile-First** — Responsive design, touch-optimized, iOS safe area support.
- **Audit Trail** — All actions logged to database with structured metadata.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ATLAS PAYMENTS CHECKOUT                        │
│                        checkout.atlasglobal.digital                  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  PHASE 1 — DIRECT CHECKOUT (/)                                │  │
│  │                                                               │  │
│  │  1. Select Currency (EUR/USD) + Enter Amount                  │  │
│  │  2. Click "Advance to Payment"                                │  │
│  │  3. Redirect → Stripe Crypto Onramp (hosted)                  │  │
│  │     - Stripe handles: KYC, payment method, fraud prevention    │  │
│  │     - Destination locked: USDC on Ethereum                    │  │
│  │     - Wallet locked: Atlas Treasury Wallet                    │  │
│  │  4. Return → Success / Cancelled screen                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  PHASE 2 — MERCHANT CHECKOUT (/:store/:ref)                   │  │
│  │                                                               │  │
│  │  1. Order Review (product, amount, reference)                 │  │
│  │  2. Customer Data + Pre-KYC L1 Declaration                    │  │
│  │  3. Payment (Stripe Payment Element or Onramp redirect)       │  │
│  │  4. Success → Webhook → CRM → Treasury                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  API ROUTES                                                    │  │
│  │                                                               │  │
│  │  POST /api/checkout/create-onramp  → Direct onramp (Phase 1)  │  │
│  │  POST /api/checkout/create         → Create session (Phase 2) │  │
│  │  GET  /api/checkout/load           → Load session (Phase 2)   │  │
│  │  POST /api/checkout/submit-customer → Submit KYC data (L1)    │  │
│  │  POST /api/checkout/initiate-payment → Start payment (L1 gate)│  │
│  │  POST /api/webhooks/stripe         → Stripe webhooks          │  │
│  │  POST /api/merchant/register       → Register merchant        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.x |
| **Runtime** | Bun | Latest |
| **Language** | TypeScript | 5.x |
| **UI** | React | 19.x |
| **Styling** | Tailwind CSS 4 | 4.x |
| **Components** | shadcn/ui (Radix) | — |
| **Animation** | Framer Motion | 12.x |
| **Database** | SQLite via Prisma | 6.x |
| **Payments** | Stripe Crypto Onramp | — |
| **i18n** | Custom React Context | PT/EN/ES/FR |
| **Icons** | Lucide React | — |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                              # Root layout (Atlas metadata)
│   ├── globals.css                             # Tailwind + theme variables
│   ├── page.tsx                                # ★ Direct checkout (Phase 1)
│   ├── [...slug]/
│   │   └── page.tsx                            # Merchant checkout (Phase 2)
│   └── api/
│       ├── checkout/
│       │   ├── create-onramp/route.ts          # ★ Direct onramp session (Phase 1)
│       │   ├── create/route.ts                 # Merchant creates session (Phase 2)
│       │   ├── load/route.ts                   # Public session loader
│       │   ├── submit-customer/route.ts        # Save customer + Pre-KYC L1
│       │   ├── initiate-payment/route.ts       # Create onramp (L1 gate)
│       │   ├── create-payment-intent/route.ts  # Stripe Payment Intent (Phase 2)
│       │   └── confirm-payment/route.ts        # Verify & confirm payment
│       ├── webhooks/
│       │   └── stripe/route.ts                 # Stripe webhook handler
│       └── merchant/
│           └── register/route.ts               # Merchant registration
├── components/
│   ├── checkout/
│   │   ├── CheckoutShell.tsx                   # Layout: header, footer, Atlas branding
│   │   ├── StepIndicator.tsx                   # 3-step animated progress
│   │   ├── OrderReview.tsx                     # Step 1: order summary
│   │   ├── CustomerForm.tsx                    # Step 2: KYC form + L1 declaration
│   │   ├── PaymentStep.tsx                     # Step 3: Stripe Payment Element
│   │   ├── StripePaymentForm.tsx               # Embedded Stripe payment form
│   │   ├── CheckoutSuccess.tsx                 # Success screen (confetti)
│   │   └── CheckoutError.tsx                   # Error screen
│   └── ui/                                     # shadcn/ui primitives
├── i18n/
│   ├── translations.ts                         # 4-locale dictionary (PT/EN/ES/FR)
│   └── provider.tsx                            # React Context i18n
└── lib/
    ├── db.ts                                   # Prisma singleton
    ├── stripe.ts                               # Stripe Onramp API + Audit + CRM
    ├── prekyc-l1.ts                            # Pre-KYC L1 declarative evaluation
    ├── format.ts                               # Currency/date formatters
    └── utils.ts                                # cn() utility
```

---

## Pre-KYC L1 (Declarative)

The Pre-KYC L1 service (`src/lib/prekyc-l1.ts`) is a **pure domain service** with zero provider coupling. It evaluates customer-declared data against minimal compliance rules:

| Rule | Field | Validation |
|------|-------|-----------|
| 1 | `email` | Valid email format (contains @, has TLD) |
| 2 | `firstName` | Non-empty after trim |
| 3 | `lastName` | Non-empty after trim |
| 4 | `country` | ISO 3166-1 alpha-2 in accepted set |
| 5 | `declarationAccepted` | Must be `true` |
| 6 | `declarationTextVersion` | Non-empty (version tracking) |

**Accepted countries**: PT, ES, FR, DE, IT, NL, BE, IE, LU, AT, GB, US, BR, CH

**Gate**: `/api/checkout/initiate-payment` blocks payment when L1 is not approved (`prekyc_required` error).

**Audit**: `prekyc_l1_approved` and `prekyc_l1_rejected` events are logged to the audit table.

---

## Phase 1 — Direct Checkout API

### `POST /api/checkout/create-onramp`

Creates a Stripe Crypto Onramp session directly from amount + currency. **No database required.**

```bash
curl -X POST https://checkout.atlasglobal.digital/api/checkout/create-onramp \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAmount": 3000,
    "sourceCurrency": "eur"
  }'
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cos_...",
    "redirectUrl": "https://checkout.stripe.com/...",
    "clientSecret": "cs_live_...",
    "status": "created"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceAmount` | number | Yes | Amount in **cents** (3000 = €30.00) |
| `sourceCurrency` | string | Yes | `eur` or `usd` (lowercase) |

---

## Phase 2 — Merchant API

### `POST /api/checkout/create`

**Authentication**: `Authorization: Bearer <api_key>` or `X-Api-Key` header.

```bash
curl -X POST https://checkout.atlasglobal.digital/api/checkout/create \
  -H "Authorization: Bearer ak_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Atlas Digital Services",
    "productDesc": "Monthly subscription - Premium plan",
    "amount": 3000,
    "currency": "EUR",
    "orderRef": "REF-2025-001",
    "locale": "pt",
    "expiresInHours": 24
  }'
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productName` | string | Yes | Product name displayed to customer |
| `productDesc` | string | No | Product description |
| `amount` | number | Yes | Amount in **cents** (3000 = €30.00) |
| `currency` | string | Yes | `EUR` or `USD` |
| `orderRef` | string | No | Merchant reference (auto-generated if omitted) |
| `locale` | string | No | Default language (`pt`/`en`/`es`/`fr`) |
| `expiresInHours` | number | No | Session TTL (default: 24) |

### Customer Flow (Phase 2)

1. `GET /:store/:ref` → Load session from DB → Show checkout page
2. `POST /api/checkout/submit-customer` → Save customer data + L1 evaluation
3. `POST /api/checkout/initiate-payment` → Create Stripe session (L1 gate)
4. Customer completes payment via Stripe
5. `POST /api/webhooks/stripe` → Update status → Forward to CRM

### Webhook Events

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Session → `paid`, forward to CRM |
| `payment_intent.payment_failed` | Session → `failed` |
| `payment_intent.canceled` | Session → `cancelled` |
| `crypto.onramp_session.completed` | Session → `paid` |
| `crypto.onramp_session.failed` | Session → `failed` |
| `crypto.onramp_session.cancelled` | Session → `cancelled` |

---

## Environment Variables

```bash
# ─── Database ─────────────────────────────────────────
DATABASE_URL="file:./db/custom.db"

# ─── Stripe (Required) ───────────────────────────────
STRIPE_SECRET_KEY="sk_live_..."                    # Stripe secret key
STRIPE_WEBHOOK_SECRET="whsec_..."                  # Webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."    # Stripe publishable key

# ─── Treasury ────────────────────────────────────────
ATLAS_TREASURY_WALLET="0x..."                      # Ethereum wallet (USDC receiver)

# ─── Atlas CRM (Phase 2 — optional) ─────────────────
ATLAS_CRM_WEBHOOK_URL="https://api.atlasglobal.digital/api/v1/crm/checkout"
ATLAS_API_KEY="..."

# ─── Admin ───────────────────────────────────────────
ADMIN_API_KEY="..."                                # For merchant registration

# ─── Application ────────────────────────────────────
NEXT_PUBLIC_BASE_URL="https://checkout.atlasglobal.digital"
```

---

## Getting Started (Local Development)

```bash
# 1. Clone
git clone https://github.com/AtlasGlobalCore/checkout-atlascore.git
cd checkout-atlascore

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Stripe keys and wallet address

# 4. Initialize database
bun run db:push

# 5. Start development server
bun run dev
```

The checkout page will be available at `http://localhost:3000`.

---

## Deploy to Production (GitHub → Vercel)

### Step 1: Push to GitHub

```bash
# Add all changes
git add .

# Commit
git commit -m "feat: Atlas Payments checkout v1.0"

# Push to GitHub
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click **"Add New" → "Project"**
3. Import the repository: `AtlasGlobalCore/checkout-atlascore`
4. Configure **Build Settings**:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build` (or `bun run build`)
   - **Output Directory**: `.next/standalone` (auto-detected)
5. Configure **Environment Variables** (add all from `.env.example`):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `ATLAS_TREASURY_WALLET`
   - `NEXT_PUBLIC_BASE_URL`
   - `DATABASE_URL` (use Vercel Postgres or Turso for production)
6. Click **"Deploy"**

### Step 3: Custom Domain

1. In Vercel dashboard, go to **Settings → Domains**
2. Add `checkout.atlasglobal.digital`
3. Configure DNS on your domain registrar:
   ```
   Type  Name    Value
   CNAME checkout  cname.vercel-dns.com
   ```
4. SSL certificate is automatically provisioned

### Step 4: Stripe Webhook

1. In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. URL: `https://checkout.atlasglobal.digital/api/webhooks/stripe`
4. Events to listen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `crypto.onramp_session.completed`
   - `crypto.onramp_session.failed`
   - `crypto.onramp_session.cancelled`
5. Copy the **Signing secret** → Add as `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 5: Production Database (Phase 2)

> **Note**: SQLite is for development only. For production, migrate to a managed database.

**Option A: Turso (SQLite-compatible)**
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create atlas-checkout

# Get connection URL
turso db show atlas-checkout --url

# Set env var in Vercel
DATABASE_URL="libsql://atlas-checkout-xxx.turso.io"
```

**Option B: Vercel Postgres**
1. In Vercel dashboard → **Storage → Create Database → Postgres**
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run `bun run db:push` to migrate

---

## Prisma Schema (Key Models)

### Merchant
Stores merchant configuration with API key authentication.

### CheckoutSession
Full checkout lifecycle: creation → data collection → L1 verification → payment → completion.
Tracks Pre-KYC L1 status, customer data, Stripe references, and CRM forwarding state.

### AuditLog
Immutable audit trail for all significant actions (session creation, L1 evaluation, payment events, CRM forwarding).

---

## License

Proprietary — Atlas Global Core. All rights reserved.
