---
Task ID: 1
Agent: Main Agent
Task: Remove DEMO mode, integrate Stripe Crypto Onramp, rebrand to SafePay

Work Log:
- Analyzed all existing files: page.tsx, stripe.ts, PaymentStep.tsx, StripePaymentForm.tsx, CheckoutShell.tsx, all API routes, translations, prisma schema
- Rewrote `src/app/page.tsx` completely: new SafePay landing page with EUR/USD currency toggle, amount input with presets, "Proceed to Payment" button, success/cancel screens, mobile-first responsive design
- Created new `src/app/api/onramp/create/route.ts`: Direct Stripe Crypto Onramp session creation without DB dependency (Phase 1)
- Fixed `src/lib/stripe.ts`: Corrected auth header from Basic (wrong) to Bearer (correct), removed DB imports (logAudit, forwardToCRM)
- Updated `src/app/layout.tsx`: SafePay branding in metadata, title, description
- Removed demo mode from `src/app/api/checkout/create-payment-intent/route.ts`: No demo fallback, returns 503 if Stripe not configured
- Removed demo mode from `src/app/api/checkout/confirm-payment/route.ts`: Same approach
- Removed demo mode from `src/app/api/checkout/initiate-payment/route.ts`: Same approach
- Disabled `src/app/api/seed/route.ts`: Returns 410 Gone
- Updated `src/components/checkout/PaymentStep.tsx`: Removed isDemo prop, removed demo form rendering
- Updated `src/components/checkout/StripePaymentForm.tsx`: Removed isDemo prop, removed DemoPaymentForm component
- Updated `src/components/checkout/CheckoutShell.tsx`: Lock icon instead of Shield, SafePay instead of Atlas
- Updated `src/app/[...slug]/page.tsx`: SafePay Checkout instead of Atlas Checkout
- Cleaned up `src/i18n/translations.ts`: Removed demo_mode and method_demo keys from all 4 languages

Stage Summary:
- DEMO mode completely removed from the entire application
- Phase 1 frontend complete: SafePay form with EUR/USD → Stripe Crypto Onramp redirect
- Phase 2 API routes (create, load, submit-customer) preserved but not connected to homepage
- Stripe auth bug fixed (was using Basic auth with amount/currency, now uses Bearer with secret key)
- Branding updated from Atlas/Z to SafePay with lock icon throughout
- Mobile-optimized responsive design (sm:, md: breakpoints, touch targets)
- All lint checks passing
