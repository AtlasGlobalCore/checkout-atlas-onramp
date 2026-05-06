'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, ShoppingBag, User, Hash, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/provider';
import { formatAmount } from '@/lib/format';
import type { CustomerFormData } from './CustomerForm';
import type { CheckoutData } from '@/app/[...slug]/page';
import type { TK } from '@/i18n/provider';

interface PaymentStepProps {
  data: CheckoutData;
  customer: CustomerFormData;
  onPay: () => Promise<void>;
  onBack: () => void;
}

export default function PaymentStep({ data, customer, onPay, onBack }: PaymentStepProps) {
  const { t, locale } = useI18n();
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async () => {
    setIsPaying(true);
    try {
      await onPay();
    } catch {
      setIsPaying(false);
    }
  };

  const amountStr = formatAmount(data.order.amount, data.order.currency, locale);
  const payLabel = t('btn.pay' as TK, { amount: amountStr });

  const countryKey = (code: string): TK =>
    `country.${code}` as TK;

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
          <span className="text-base font-bold text-foreground shrink-0">
            {amountStr}
          </span>
        </div>
      </div>

      {/* Customer data card */}
      <div className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{t('customer.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div>
            <span className="text-muted-foreground">{customer.firstName} {customer.lastName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{customer.email}</span>
          </div>
          {customer.phone && (
            <div>
              <span className="text-muted-foreground">{customer.phone}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">
              {customer.address1}
              {customer.address2 ? `, ${customer.address2}` : ''}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {customer.zip} {customer.city}
              {customer.state ? `, ${customer.state}` : ''}
            </span>
          </div>
          {customer.country && (
            <div>
              <span className="text-muted-foreground">
                {t(countryKey(customer.country))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Secure payment note */}
      <div className="flex items-start gap-2.5 px-1 py-3 mb-6">
        <Lock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('payment.secure_note')}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!isPaying && (
          <Button
            variant="outline"
            onClick={onBack}
            className="h-12 sm:h-11 w-full sm:w-auto rounded-lg gap-2 text-sm font-medium border-border hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            {t('btn.back')}
          </Button>
        )}
        <motion.div className="flex-1" whileTap={isPaying ? {} : { scale: 0.98 }}>
          <Button
            onClick={handlePay}
            disabled={isPaying}
            className="w-full h-12 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base font-semibold rounded-lg gap-2 shadow-md shadow-primary/20"
          >
            {isPaying ? (
              <>
                <Loader2 className="size-4 sm:size-5 animate-spin" />
                {t('payment.redirecting')}
              </>
            ) : (
              payLabel
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
