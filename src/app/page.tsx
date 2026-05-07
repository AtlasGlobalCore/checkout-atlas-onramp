'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ExternalLink, Globe, CreditCard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoSession {
  ref: string;
  storeRef: string;
  productName: string;
  amount: number;
  currency: string;
}

export default function Home() {
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch('/api/checkout/load?store=demo-store&ref=DEMOPAY01');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSessions([{
              ref: json.data.ref,
              storeRef: 'demo-store',
              productName: json.data.order.productName,
              amount: json.data.order.amount,
              currency: json.data.order.currency,
            }]);
          }
        }
        // Try second demo
        const res2 = await fetch('/api/checkout/load?store=demo-store&ref=DEMOPAY02');
        if (res2.ok) {
          const json2 = await res2.json();
          if (json2.success && json2.data) {
            setSessions(prev => [...prev, {
              ref: json2.data.ref,
              storeRef: 'demo-store',
              productName: json2.data.order.productName,
              amount: json2.data.order.amount,
              currency: json2.data.order.currency,
            }]);
          }
        }
      } catch {
        // Sessions might not exist yet
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const currencySymbol = (c: string) => c === 'EUR' ? '€' : '$';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Atlas Checkout
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Secure payment processing powered by Atlas. Please use a checkout link provided by the merchant.
          </p>
        </motion.div>

        {/* Demo Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Demo Checkout Sessions</h2>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 rounded-xl border border-border bg-secondary" />
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid gap-3">
              {sessions.map((session) => (
                <div
                  key={session.ref}
                  className="bg-white rounded-xl border border-border p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {session.productName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {session.ref}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {currencySymbol(session.currency)}{(session.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{session.currency} · Demo Mode</span>
                  </div>
                  <Button
                    onClick={() => window.location.href = `/${session.storeRef}/${session.ref}`}
                    className="w-full mt-3 h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg gap-2"
                  >
                    <ExternalLink className="size-3.5" />
                    Open Checkout
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-8 text-center">
              <CreditCard className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No demo sessions found. Seed the database first.
              </p>
              <Button
                onClick={async () => {
                  await fetch('/api/seed', { method: 'POST' });
                  window.location.reload();
                }}
                variant="outline"
                className="mt-4 h-9 text-sm"
              >
                Seed Database
              </Button>
            </div>
          )}
        </motion.div>

        {/* Tech info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/60">
            <Shield className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-foreground">Atlas</span> · Secure Checkout
            </span>
          </div>
        </motion.div>
      </main>

      {/* Sticky Footer */}
      <footer className="mt-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-3.5" />
            <span>
              Powered by <span className="font-semibold text-foreground">Atlas</span>
            </span>
            <span className="text-border">·</span>
            <span>Secure SSL-encrypted checkout</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
