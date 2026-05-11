'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Types ──────────────────────────────────────────────────────
type Currency = 'EUR' | 'USD';

// ── Amount Presets ─────────────────────────────────────────────
const presets = [10, 25, 50, 100, 250, 500];

// ── Format helpers ─────────────────────────────────────────────
function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'EUR' ? 'pt-PT' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

// ── Success Screen ─────────────────────────────────────────────
function SuccessScreen({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
    >
      <motion.div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
      >
        <CheckCircle2 className="size-10 sm:size-12 text-white" strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Pagamento Concluido!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto mb-8">
          O seu pagamento foi processado com sucesso. Recebera a confirmacao por email em breve.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={onReset}
          variant="outline"
          className="h-11 px-8 rounded-lg gap-2 text-sm font-medium border-border"
        >
          <RefreshCw className="size-4" />
          Novo Pagamento
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ── Cancelled Screen ───────────────────────────────────────────
function CancelledScreen({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
    >
      <motion.div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
      >
        <XCircle className="size-10 sm:size-12 text-white" strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Pagamento Cancelado
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto mb-8">
          O seu pagamento foi cancelado. Nenhuma cobranca foi efetuada.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button
          onClick={onReset}
          variant="outline"
          className="h-11 px-8 rounded-lg gap-2 text-sm font-medium border-border"
        >
          <RefreshCw className="size-4" />
          Tentar Novamente
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ── Payment Form ───────────────────────────────────────────────
function PaymentForm({ onSubmit }: { onSubmit: (amount: number, currency: Currency) => void }) {
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [amountStr, setAmountStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amount = parseAmount(amountStr);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (amount < 1) {
        setError('O montante minimo e 1');
        return;
      }
      if (amount > 10000) {
        setError('O montante maximo e 10.000');
        return;
      }

      onSubmit(amount, currency);
    },
    [amount, currency, onSubmit]
  );

  const selectCurrency = (c: Currency) => {
    setCurrency(c);
    setError(null);
  };

  const selectPreset = (preset: number) => {
    setAmountStr(String(preset));
    setError(null);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currency}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Currency selector */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2.5">
              Moeda
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(['EUR', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectCurrency(c)}
                  className={`h-12 rounded-xl border-2 text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${
                    currency === c
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-border bg-white text-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="text-lg">{c === 'EUR' ? '\u20AC' : '$'}</span>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2.5">
              Montante
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground pointer-events-none">
                {currency === 'EUR' ? '\u20AC' : '$'}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="h-14 pl-10 pr-4 text-lg font-semibold rounded-xl border-border bg-white focus:border-primary focus:ring-primary/20"
                autoComplete="off"
              />
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-150 ${
                    amount === preset
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  {formatCurrency(preset, currency)}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-3"
            >
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={amount < 1}
            className="w-full h-14 sm:h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-xl gap-3 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all duration-200"
          >
            Avancar para Pagamento
            <ArrowRight className="size-5" />
          </Button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Shield className="size-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              Pagamento seguro e encriptado com SSL
            </p>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Inner Page (uses useSearchParams) ──────────────────────────
function PageInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check return status
  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  const handleReset = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleSubmit = useCallback(async (amount: number, currency: Currency) => {
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/checkout/create-onramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAmount: Math.round(amount * 100), // Convert to cents
          sourceCurrency: currency.toLowerCase(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error || 'Erro ao iniciar o pagamento. Tente novamente.';
        setApiError(msg);
        setLoading(false);
        return;
      }

      if (json.success && json.data?.redirectUrl) {
        window.location.href = json.data.redirectUrl;
        return;
      }

      setApiError('Erro ao iniciar o pagamento. Tente novamente.');
      setLoading(false);
    } catch {
      setApiError('Erro de ligacao. Verifique a sua internet e tente novamente.');
      setLoading(false);
    }
  }, []);

  // ── Render: Success ──────────────────────────────────────
  if (isSuccess) {
    return (
      <PageWrapper>
        <SuccessScreen onReset={handleReset} />
      </PageWrapper>
    );
  }

  // ── Render: Cancelled ────────────────────────────────────
  if (isCancelled) {
    return (
      <PageWrapper>
        <CancelledScreen onReset={handleReset} />
      </PageWrapper>
    );
  }

  // ── Render: Default (Form) ──────────────────────────────
  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">
            Pagamento Seguro
          </h1>
          <p className="text-sm text-muted-foreground">
            Insira o montante e moeda para prosseguir
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                A preparar o seu pagamento seguro...
              </p>
            </div>
          ) : (
            <PaymentForm onSubmit={handleSubmit} />
          )}
        </div>

        {/* API Error */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <p className="text-sm text-red-700 text-center">{apiError}</p>
          </motion.div>
        )}
      </motion.div>
    </PageWrapper>
  );
}

// ── Page Wrapper (shared layout) ──────────────────────────────
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50/80 to-white">
      {/* Header */}
      <header className="w-full">
        <div className="max-w-lg mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          <motion.div
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Atlas Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-lg shadow-primary/15 ring-2 ring-white mb-4">
              <Image
                src="/logo-atlas.jpg"
                alt="Atlas Payments"
                width={96}
                height={96}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Atlas
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Payments
            </p>
          </motion.div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>

      {/* Sticky Footer */}
      <footer className="mt-auto">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-5 sm:py-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-3.5" />
            <span>
              Powered by <span className="font-semibold text-foreground">Atlas</span>
            </span>
            <span className="text-border">&middot;</span>
            <span>Checkout seguro com encriptacao SSL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Page Component ─────────────────────────────────────────────
export default function Home() {
  return (
    <Suspense
      fallback={
        <PageWrapper>
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        </PageWrapper>
      }
    >
      <PageInner />
    </Suspense>
  );
}
