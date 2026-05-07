'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/provider';
import { formatAmount } from '@/lib/format';
import type { CheckoutData } from '@/app/[...slug]/page';

interface OrderReviewProps {
  data: CheckoutData;
  onContinue: () => void;
}

export default function OrderReview({ data, onContinue }: OrderReviewProps) {
  const { t, locale } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          {t('order.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('app.subtitle')}
        </p>
      </div>

      {/* Order card */}
      <div
        className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
      >
        {/* Product info */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            {data.store.logoUrl ? (
              <img
                src={data.store.logoUrl}
                alt={data.store.name}
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <ShoppingBag className="size-5 sm:size-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-foreground leading-snug truncate">
              {data.order.productName}
            </h2>
            {data.order.productDesc && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {data.order.productDesc}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Amount + details */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('order.amount')}</span>
            <span className="text-lg sm:text-xl font-bold text-foreground">
              {formatAmount(data.order.amount, data.order.currency, locale)}
            </span>
          </div>

          {/* Merchant reference */}
          {data.merchantRef && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Hash className="size-3" />
                {t('order.ref')}
              </span>
              <span className="text-sm font-mono text-foreground bg-secondary px-2 py-0.5 rounded">
                {data.merchantRef}
              </span>
            </div>
          )}

          {/* Order reference */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Hash className="size-3" />
              ID
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              {data.ref.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <motion.div className="mt-6" whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onContinue}
          className="w-full h-12 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg gap-2"
        >
          {t('btn.continue')}
          <ArrowRight className="size-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
