'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Hash,
  Loader2,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { loadStripe, StripeElementLocale } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/provider';
import { formatAmount } from '@/lib/format';
import StripePaymentForm from './StripePaymentForm';
import type { CustomerFormData } from './CustomerForm';
import type { CheckoutData } from '@/app/[...slug]/page';
import type { TK, Locale } from '@/i18n/provider';

// ── Types ──────────────────────────────────────────────────────
interface PaymentStepProps {
  data: CheckoutData;
  customer: CustomerFormData;
  onBack: () => void;
  onSuccess: () => void;
}

interface PaymentIntentResponse {
  success: boolean;
  data: {
    mode: 'demo' | 'live';
    clientSecret: string;
    publishableKey: string;
    amount: number;
    currency: string;
  };
}

// ── Stripe Locale mapping ──────────────────────────────────────
const stripeLocaleMap: Record<Locale, StripeElementLocale> = {
  pt: 'pt',
  en: 'en',
  es: 'es',
  fr: 'fr',
};

// ── Component ──────────────────────────────────────────────────
export default function PaymentStep({
  data,
  customer,
  onBack,
  onSuccess,
}: PaymentStepProps) {
  const { t, locale } = useI18n();
  const [paymentState, setPaymentState] = useState<'loading' | 'ready' | 'processing' | 'success' | 'error'>('loading');
  const [paymentIntentData, setPaymentIntentData] = useState<PaymentIntentResponse['data'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map locale to Stripe locale
  const stripeLocale = stripeLocaleMap[locale] || 'en';

  const amountStr = formatAmount(data.order.amount, data.order.currency, locale);

  // Load Stripe Payment Intent when component mounts
  useEffect(() => {
    let cancelled = false;

    async function loadPaymentIntent() {
      try {
        setPaymentState('loading');

        const res = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: data.id }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setErrorMessage(errorData.error || t('payment.load_error' as TK));
          setPaymentState('error');
          return;
        }

        const json: PaymentIntentResponse = await res.json();

        if (cancelled) return;

        if (json.success && json.data?.clientSecret) {
          setPaymentIntentData(json.data);
          setPaymentState('ready');
        } else {
          setErrorMessage(t('payment.load_error' as TK));
          setPaymentState('error');
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(t('payment.load_error' as TK));
          setPaymentState('error');
        }
      }
    }

    loadPaymentIntent();
    return () => { cancelled = true; };
  }, [data.id, t]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(async () => {
    setPaymentState('processing');

    try {
      const res = await fetch('/api/checkout/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.id,
          paymentIntentId: paymentIntentData?.mode === 'live' ? undefined : undefined,
        }),
      });

      if (res.ok) {
        setPaymentState('success');
        // Small delay for UX before showing success
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setErrorMessage(t('payment.confirm_error' as TK));
        setPaymentState('error');
      }
    } catch {
      setErrorMessage(t('payment.confirm_error' as TK));
      setPaymentState('error');
    }
  }, [data.id, paymentIntentData, onSuccess, t]);

  // Handle payment error
  const handlePaymentError = useCallback((message: string) => {
    setErrorMessage(message);
    setPaymentState('ready');
  }, []);

  // Retry loading
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    setPaymentState('loading');
    // Trigger re-render by toggling a state
    window.location.reload();
  }, []);

  // ── Render: Loading ──────────────────────────────────────
  if (paymentState === 'loading') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            {t('payment.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('payment.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary" />
              <span className="text-sm font-semibold">{data.order.productName}</span>
            </div>
            <span className="text-base font-bold">{amountStr}</span>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('payment.loading_form' as TK)}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Render: Error ────────────────────────────────────────
  if (paymentState === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            {t('payment.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('payment.subtitle')}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center gap-3">
          <AlertCircle className="size-8 text-red-500" />
          <p className="text-sm text-red-700 text-center">{errorMessage || t('payment.load_error' as TK)}</p>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
          >
            {t('btn.retry' as TK) || 'Tentar novamente'}
          </Button>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-11 w-full rounded-lg gap-2 text-sm font-medium border-border hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            {t('btn.back')}
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Render: Success (brief flash before parent handles) ──
  if (paymentState === 'success' || paymentState === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <Loader2 className="size-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">{t('payment.confirming' as TK)}</p>
      </motion.div>
    );
  }

  // ── Render: Payment form ─────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          {t('payment.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('payment.subtitle')}
        </p>
      </div>

      {/* Order summary card */}
      <div className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{t('order.title')}</h2>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-sm font-medium text-foreground truncate">
              {data.order.productName}
            </p>
            {data.merchantRef && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Hash className="size-3" />
                {data.merchantRef}
              </p>
            )}
          </div>
          <span className="text-lg font-bold text-foreground shrink-0">
            {amountStr}
          </span>
        </div>
      </div>

      {/* Customer data card (collapsed) */}
      <div className="bg-secondary/40 rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{t('customer.title')}</span>
        </div>
        <div className="text-sm text-foreground">
          <span className="font-medium">{customer.firstName} {customer.lastName}</span>
          <span className="text-muted-foreground mx-2">·</span>
          <span className="text-muted-foreground">{customer.email}</span>
        </div>
      </div>

      {/* Payment form */}
      <div className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            {paymentIntentData?.mode === 'demo' ? t('payment.method_demo' as TK) : t('payment.method' as TK)}
          </h2>
        </div>

        <AnimatePresence>
          {paymentIntentData && (
            <PaymentFormWrapper
              clientSecret={paymentIntentData.clientSecret}
              publishableKey={paymentIntentData.publishableKey}
              isDemo={paymentIntentData.mode === 'demo'}
              stripeLocale={stripeLocale}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Back button */}
      <div className="mt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-11 rounded-lg gap-2 text-sm font-medium border-border hover:bg-secondary"
        >
          <ArrowLeft className="size-4" />
          {t('btn.back')}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Inner wrapper: loads Stripe.js and renders PaymentElement ──
function PaymentFormWrapper({
  clientSecret,
  publishableKey,
  isDemo,
  stripeLocale,
  onPaymentSuccess,
  onPaymentError,
}: {
  clientSecret: string;
  publishableKey: string;
  isDemo: boolean;
  stripeLocale: StripeElementLocale;
  onPaymentSuccess: () => void;
  onPaymentError: (message: string) => void;
}) {
  // Load Stripe.js
  const stripePromise = useMemo(() => {
    if (isDemo) return Promise.resolve(null);
    if (!publishableKey || publishableKey === 'pk_demo') return Promise.resolve(null);
    return loadStripe(publishableKey);
  }, [publishableKey, isDemo]);

  // Demo mode: render without Stripe Elements
  if (isDemo) {
    return (
      <Elements stripe={null as unknown as ReturnType<typeof loadStripe>} options={{ clientSecret }}>
        <StripePaymentForm
          isDemo={true}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
        />
      </Elements>
    );
  }

  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="size-6 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            Stripe is not configured. Running in demo mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: stripeLocale,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#635bff',
            colorBackground: '#ffffff',
            colorText: '#3c4f69',
            colorDanger: '#df1b41',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSizeBase: '14px',
            borderRadius: '8px',
          },
          rules: {
            '.Input': {
              borderColor: '#e5e7eb',
              backgroundColor: '#f6f8fa',
            },
            '.Input:focus': {
              borderColor: '#635bff',
            },
          },
        },
      }}
    >
      <StripePaymentForm
        isDemo={false}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
}
