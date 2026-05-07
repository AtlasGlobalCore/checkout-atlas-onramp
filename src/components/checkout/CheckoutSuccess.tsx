'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Hash } from 'lucide-react';
import { useI18n } from '@/i18n/provider';

interface CheckoutSuccessProps {
  orderRef: string;
  merchantRef?: string;
}

export default function CheckoutSuccess({ orderRef, merchantRef }: CheckoutSuccessProps) {
  const { t } = useI18n();
  const [showConfetti, setShowConfetti] = useState(true);

  // Hide confetti after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center py-12 sm:py-16 min-h-[60vh]">
      {/* CSS Confetti particles */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.8;
            const duration = 1.5 + Math.random() * 1.5;
            const color = ['#635bff', '#6941c6', '#a18cd1', '#0a2540', '#e5e7eb'][
              Math.floor(Math.random() * 5)
            ];
            const size = 4 + Math.random() * 6;
            return (
              <motion.div
                key={i}
                className="absolute rounded-sm"
                style={{
                  left: `${left}%`,
                  top: '-10px',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  opacity: 0.8,
                }}
                initial={{ y: 0, opacity: 0, rotate: 0 }}
                animate={{
                  y: [0, 300 + Math.random() * 200],
                  opacity: [0, 0.8, 0],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  x: [-30 + Math.random() * 60, -60 + Math.random() * 120],
                }}
                transition={{
                  duration,
                  delay,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Success icon */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: 0.2,
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: 2, ease: 'easeInOut', delay: 0.5 }}
        />
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 250 }}
          >
            <Check className="size-10 sm:size-12 text-white" strokeWidth={3} />
          </motion.div>
        </div>
      </motion.div>

      {/* Success text */}
      <motion.div
        className="text-center px-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {t('success.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm mx-auto">
          {t('success.subtitle')}
        </p>

        {/* Order reference */}
        <div className="bg-secondary rounded-xl p-4 inline-flex flex-col items-center gap-2 min-w-[240px]">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hash className="size-3" />
            {t('success.ref')}
          </div>
          <span className="text-sm font-mono font-semibold text-foreground">
            {merchantRef || orderRef}
          </span>
        </div>

        {/* Thank you message */}
        <motion.p
          className="mt-6 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {t('success.merchant')}
        </motion.p>
        <motion.p
          className="mt-1 text-base font-medium text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {t('success.thankyou')}
        </motion.p>
      </motion.div>
    </div>
  );
}
