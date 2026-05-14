'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import type { TK } from '@/i18n/provider';

interface StripePaymentFormProps {
  onPaymentSuccess: () => void;
  onPaymentError: (message: string) => void;
}

export default function StripePaymentForm({
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useI18n();

  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!elements) return;

    const element = elements.getElement(PaymentElement) as any;
    if (!element) return;

    const handleReady = () => setIsLoading(false);
    const handleError = () => setIsLoading(false);
    const timeout = setTimeout(() => setIsLoading(false), 3000);

    element.on('ready', handleReady);
    element.on('loaderror', handleError);

    return () => {
      element.off('ready', handleReady);
      element.off('loaderror', handleError);
      clearTimeout(timeout);
    };
  }, [elements]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || null);
        onPaymentError(error.message || t('payment.card_error' as TK));
      } else {
        setMessage(t('payment.generic_error' as TK));
        onPaymentError(t('payment.generic_error' as TK));
      }
    } else {
      onPaymentSuccess();
    }

    setIsProcessing(false);
  }, [stripe, elements, onPaymentSuccess, onPaymentError, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('payment.loading_form' as TK)}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'sepa_debit'],
          }}
        />
      </div>

      {message && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      )}

      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="size-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{t('payment.secure_note' as TK)}</p>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isProcessing || !stripe}
          className="w-full h-12 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base font-semibold rounded-lg gap-2 shadow-md shadow-primary/20 disabled:opacity-60"
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 sm:size-5 animate-spin" />
              {t('payment.processing')}
            </>
          ) : (
            <>
              <CreditCard className="size-4 sm:size-5" />
              {t('payment.pay_now')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
