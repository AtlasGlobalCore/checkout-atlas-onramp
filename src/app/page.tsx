'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect root to a placeholder checkout or show an info page
    // The actual checkout URLs are /store-slug/order-ref
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Atlas Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Secure payment processing. Please use the checkout link provided by the merchant to complete your purchase.
        </p>
      </div>
    </div>
  );
}
