"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadFxMap, convertAmount } from "@/lib/fx";

type CurrencyContextValue = {
  currency: string;
  setCurrency: (c: string) => void;
  fx: Record<string, number>;
  convert: (amount: number, from: string | null | undefined) => number;
  format: (amount: number) => string;
  loading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<string>("AUD");
  const [fx, setFx] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // restore preferred display currency
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("displayCurrency") : null;
      if (saved) setCurrency(saved);
    } catch {}

    let cancelled = false;
    async function run() {
      setLoading(true);
      const map = await loadFxMap().catch(() => ({}));
      if (!cancelled) {
        setFx(map);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // persist user choice
  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("displayCurrency", currency);
    } catch {}
  }, [currency]);

  const convert = (amount: number, from: string | null | undefined): number => {
    const amt = Number(amount) || 0;
    const src = (from || currency || "AUD").toUpperCase();
    const dst = currency.toUpperCase();
    if (src === dst) return amt;
    const out = convertAmount(amt, src, dst, fx);
    return out == null ? amt : out;
  };

  const format = (amount: number) => {
    try {
      return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount || 0);
    } catch {
      return `${currency} ${(amount || 0).toLocaleString()}`;
    }
  };

  const value = useMemo(
    () => ({ currency, setCurrency, fx, convert, format, loading }),
    [currency, fx, loading]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
