'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Search, Clock, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n/provider';

type ErrorType = 'expired' | 'not_found' | 'generic';

interface CheckoutErrorProps {
  type: ErrorType;
  onRetry?: () => void;
}

const errorConfig: Record<ErrorType, { icon: React.ElementType; titleKey: string; messageKey: string }> = {
  expired: {
    icon: Clock,
    titleKey: 'error.title',
    messageKey: 'error.session_expired',
  },
  not_found: {
    icon: Search,
    titleKey: 'error.title',
    messageKey: 'error.session_expired',
  },
  generic: {
    icon: AlertTriangle,
    titleKey: 'error.title',
    messageKey: 'error.generic',
  },
};

export default function CheckoutError({ type, onRetry }: CheckoutErrorProps) {
  const { t } = useI18n();
  const config = errorConfig[type] || errorConfig.generic;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 min-h-[60vh]">
      <motion.div
        className="text-center px-4 max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Error icon */}
        <motion.div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <Icon className="size-7 sm:size-9 text-muted-foreground" />
        </motion.div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {t(config.titleKey as Parameters<typeof t>[0])}
        </h1>

        {/* Message */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(config.messageKey as Parameters<typeof t>[0])}
        </p>

        {/* Retry button */}
        {onRetry && type !== 'expired' && type !== 'not_found' && (
          <motion.button
            onClick={onRetry}
            className="mt-8 inline-flex items-center gap-2 px-6 h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <RefreshCw className="size-4" />
            {t('btn.loading')}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
