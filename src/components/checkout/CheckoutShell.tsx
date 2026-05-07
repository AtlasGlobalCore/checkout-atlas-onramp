'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useI18n, locales, localeNames, type Locale } from '@/i18n/provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CheckoutShellProps {
  storeName: string;
  storeLogoUrl?: string | null;
  children: ReactNode;
}

export default function CheckoutShell({
  storeName,
  storeLogoUrl,
  children,
}: CheckoutShellProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header area with language selector */}
      <div className="w-full">
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {storeLogoUrl ? (
              <img
                src={storeLogoUrl}
                alt={storeName}
                className="w-10 h-10 rounded-lg object-contain border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Lock className="size-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">{storeName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="size-3" />
                {t('app.secure')}
              </p>
            </div>
          </div>

          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger className="w-auto h-8 text-xs border-border bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {locales.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-xs">
                  {localeNames[loc]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>

      {/* Sticky Footer */}
      <footer className="mt-auto">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            <span>
              {t('footer.powered')} <span className="font-semibold text-foreground">SafePay</span>
            </span>
            <span className="text-border">&middot;</span>
            <span>{t('footer.secure')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
