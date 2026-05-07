'use client';

import React, { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { I18nProvider } from '@/i18n/provider';
import type { Locale } from '@/i18n/translations';
import CheckoutShell from '@/components/checkout/CheckoutShell';
import StepIndicator from '@/components/checkout/StepIndicator';
import OrderReview from '@/components/checkout/OrderReview';
import CustomerForm, { type CustomerFormData } from '@/components/checkout/CustomerForm';
import PaymentStep from '@/components/checkout/PaymentStep';
import CheckoutSuccess from '@/components/checkout/CheckoutSuccess';
import CheckoutError from '@/components/checkout/CheckoutError';

// ── Types ──────────────────────────────────────────────────────
export interface CheckoutData {
  id: string;
  ref: string;
  merchantRef?: string;
  store: {
    name: string;
    logoUrl?: string | null;
    ref?: string;
  };
  order: {
    productName: string;
    productDesc?: string | null;
    amount: number;
    currency: string;
  };
  status: string;
  locale?: string | null;
  expiresAt?: string | null;
  customer: Partial<CustomerFormData> | null;
}

type AppState =
  | { phase: 'loading' }
  | { phase: 'error'; type: 'expired' | 'not_found' | 'generic' }
  | { phase: 'success'; ref: string; merchantRef?: string }
  | {
      phase: 'checkout';
      step: 1 | 2 | 3;
      data: CheckoutData;
      customer: CustomerFormData;
    };

// ── Loading Skeleton ───────────────────────────────────────────
function CheckoutLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary" />
            <div className="space-y-2">
              <div className="w-24 h-4 rounded bg-secondary" />
              <div className="w-20 h-3 rounded bg-secondary" />
            </div>
          </div>
          {/* Step indicator skeleton */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-secondary" />
                  <div className="w-12 h-3 rounded bg-secondary" />
                </div>
                {i < 3 && <div className="flex-1 h-0.5 mx-2 rounded bg-secondary" />}
              </React.Fragment>
            ))}
          </div>
          {/* Card skeleton */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] space-y-4">
            <div className="w-32 h-5 rounded bg-secondary" />
            <div className="h-4 w-3/4 rounded bg-secondary" />
            <div className="h-4 w-1/2 rounded bg-secondary" />
            <div className="border-t border-border pt-4">
              <div className="h-6 w-24 rounded bg-secondary" />
            </div>
          </div>
          {/* Button skeleton */}
          <div className="h-12 rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
  );
}

// ── Inner Page (uses useSearchParams) ──────────────────────────
function CheckoutPageInner({
  slug,
}: {
  slug: string[];
}) {
  const searchParams = useSearchParams();

  // Parse URL segments
  const storeSlug = slug[0] || '';
  const orderRef = slug[1] || '';
  const hasValidSlug = storeSlug !== '' && orderRef !== '';

  // Check URL params for success status
  const urlStatus = hasValidSlug ? searchParams.get('status') : null;
  const isSuccessRedirect = urlStatus === 'success';

  // Read locale cookie
  const getInitialLocale = useCallback((): Locale => {
    if (typeof document === 'undefined') return 'pt';
    const match = document.cookie.match(/atlas_locale=(pt|en|es|fr)/);
    return (match?.[1] as Locale) || 'pt';
  }, []);

  const [locale] = useState<Locale>(getInitialLocale);

  // Compute initial state based on URL params (no effect needed)
  const initialState: AppState = useMemo(() => {
    if (!hasValidSlug) {
      return { phase: 'error', type: 'not_found' as const };
    }
    if (isSuccessRedirect) {
      return { phase: 'success' as const, ref: orderRef, merchantRef: undefined };
    }
    return { phase: 'loading' as const };
  }, [hasValidSlug, isSuccessRedirect, orderRef]);

  const [state, setState] = useState<AppState>(initialState);
  const hasFetched = useRef(false);

  // Sync state when initial computed state changes (handles redirect back from payment)
  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  // Fetch checkout session only when in loading phase with valid slug
  useEffect(() => {
    if (state.phase !== 'loading' || !hasValidSlug || hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;

    async function loadCheckout() {
      try {
        const res = await fetch(
          `/api/checkout/load?store=${encodeURIComponent(storeSlug)}&ref=${encodeURIComponent(orderRef)}`
        );

        if (cancelled) return;

        if (!res.ok) {
          if (res.status === 410) {
            setState({ phase: 'error', type: 'expired' });
            return;
          }
          if (res.status === 404) {
            setState({ phase: 'error', type: 'not_found' });
            return;
          }
          setState({ phase: 'error', type: 'generic' });
          return;
        }

        const json = await res.json();

        if (cancelled) return;

        if (!json.success || !json.data) {
          setState({ phase: 'error', type: 'generic' });
          return;
        }

        const data: CheckoutData = json.data;

        // If already paid, show success
        if (data.status === 'paid') {
          setState({
            phase: 'success',
            ref: data.ref,
            merchantRef: data.merchantRef,
          });
          return;
        }

        setState({
          phase: 'checkout',
          step: 1,
          data,
          customer: {
            email: data.customer?.email || '',
            phone: data.customer?.phone || '',
            firstName: data.customer?.firstName || '',
            lastName: data.customer?.lastName || '',
            dob: data.customer?.dob || '',
            country: data.customer?.country || '',
            address1: data.customer?.address1 || '',
            address2: data.customer?.address2 || '',
            city: data.customer?.city || '',
            zip: data.customer?.zip || '',
            state: data.customer?.state || '',
          },
        });
      } catch {
        if (!cancelled) {
          setState({ phase: 'error', type: 'generic' });
        }
      }
    }

    loadCheckout();

    return () => {
      cancelled = true;
    };
  }, [state.phase, hasValidSlug, storeSlug, orderRef]);

  // ── Step handlers ──────────────────────────────────────────

  const handleOrderContinue = useCallback(() => {
    setState((prev) =>
      prev.phase === 'checkout' ? { ...prev, step: 2 } : prev
    );
  }, []);

  const handleCustomerBack = useCallback(() => {
    setState((prev) =>
      prev.phase === 'checkout' ? { ...prev, step: 1 } : prev
    );
  }, []);

  const handleCustomerSubmit = useCallback(async (customer: CustomerFormData) => {
    setState((prev) => {
      if (prev.phase !== 'checkout') return prev;
      const { data } = prev;

      fetch('/api/checkout/submit-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.id,
          ...customer,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Customer submit failed');
          return res.json();
        })
        .then(() => {
          setState((p) =>
            p.phase === 'checkout' ? { ...p, step: 3, customer } : p
          );
        })
        .catch(() => {
          // Stay on step 2, could show toast
        });

      return prev;
    });
  }, []);

  const handlePaymentBack = useCallback(() => {
    setState((prev) =>
      prev.phase === 'checkout' ? { ...prev, step: 2 } : prev
    );
  }, []);

  // New: handle payment success (no redirect needed)
  const handlePaymentSuccess = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'checkout') return prev;
      return {
        phase: 'success',
        ref: prev.data.ref,
        merchantRef: prev.data.merchantRef,
      };
    });
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // ── Render ────────────────────────────────────────────────

  if (state.phase === 'loading') {
    return (
      <I18nProvider initialLocale={locale}>
        <CheckoutLoading />
      </I18nProvider>
    );
  }

  if (state.phase === 'error') {
    return (
      <I18nProvider initialLocale={locale}>
        <CheckoutShell storeName="Atlas Checkout">
          <CheckoutError type={state.type} onRetry={handleRetry} />
        </CheckoutShell>
      </I18nProvider>
    );
  }

  if (state.phase === 'success') {
    return (
      <I18nProvider initialLocale={locale}>
        <CheckoutShell storeName="Atlas Checkout">
          <CheckoutSuccess
            orderRef={state.ref}
            merchantRef={state.merchantRef}
          />
        </CheckoutShell>
      </I18nProvider>
    );
  }

  // Checkout flow
  const { step, data, customer } = state;

  return (
    <I18nProvider initialLocale={(data.locale as Locale) || locale}>
      <CheckoutShell
        storeName={data.store.name}
        storeLogoUrl={data.store.logoUrl}
      >
        <StepIndicator currentStep={step} />
        <AnimatePresence mode="wait">
          {step === 1 && (
            <OrderReview
              key="step1"
              data={data}
              onContinue={handleOrderContinue}
            />
          )}
          {step === 2 && (
            <CustomerForm
              key="step2"
              initialData={customer}
              onSubmit={handleCustomerSubmit}
              onBack={handleCustomerBack}
            />
          )}
          {step === 3 && (
            <PaymentStep
              key="step3"
              data={data}
              customer={customer}
              onBack={handlePaymentBack}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </AnimatePresence>
      </CheckoutShell>
    </I18nProvider>
  );
}

// ── Page Component ─────────────────────────────────────────────
export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <PageResolver params={params} />
    </Suspense>
  );
}

function PageResolver({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const [slug, setSlug] = React.useState<string[]>([]);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    params.then((p) => setSlug(p.slug || []));
  }, [params]);

  if (slug.length === 0) {
    return <CheckoutLoading />;
  }

  return <CheckoutPageInner slug={slug} />;
}
