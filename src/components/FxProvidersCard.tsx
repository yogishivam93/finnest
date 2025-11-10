// src/components/FxProvidersCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type RateRow = { base: string; quote: string; rate: number };

export default function FxProvidersCard() {
  const [rates, setRates] = useState<RateRow[]>([]);
  const [amount, setAmount] = useState<number>(1000);
  const [base, setBase] = useState("AUD");
  const [quote, setQuote] = useState("INR");
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("fx_rates").select("base,quote,rate");
    if (error) {
      console.error(error);
      setRates([]);
    } else {
      setRates(data ?? []);
    }
    setLoading(false);
    setLastRefreshed(new Date());
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("fx-providers-ui")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fx_rates" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const midRate = useMemo(() => {
    const row = rates.find((r) => r.base === base && r.quote === quote);
    return row?.rate ?? 0;
  }, [rates, base, quote]);

  const providers = useMemo(() => {
    // Mocked spreads relative to midRate
    const spread = [
      { name: "Wise", bps: 0.002 },
      { name: "XE", bps: 0.005 },
      { name: "BankX", bps: 0.01 },
      { name: "RemitFast", bps: 0.0035 },
    ];
    return spread.map((p) => {
      const rate = midRate * (1 - p.bps);
      return { ...p, rate, receive: amount * rate };
    });
  }, [midRate, amount]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">FX Rate Comparison</p>
        <span className="text-xs text-gray-500">Mid-market: {midRate ? midRate.toFixed(4) : "—"}</span>
      </div>
      <div className="mb-3 text-xs text-gray-500">
        Auto-refresh enabled. {loading ? (
          <span className="text-gray-700">Refreshing…</span>
        ) : lastRefreshed ? (
          <>Last updated {lastRefreshed.toLocaleTimeString()}</>
        ) : (
          <>Waiting for first update…</>
        )}
      </div>

      <div className="flex gap-2 text-sm">
        <div className="flex-1">
          <label className="block text-xs text-gray-500">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value || 0))}
            className="mt-1 w-full rounded-md border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">From</label>
          <select
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="mt-1 rounded-md border px-2 py-1 hover:bg-gray-50"
          >
            {["AUD", "USD", "INR", "EUR"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">To</label>
          <select
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            className="mt-1 rounded-md border px-2 py-1 hover:bg-gray-50"
          >
            {["INR", "AUD", "USD", "EUR"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : midRate === 0 ? (
          <div className="text-sm text-gray-500">
            Add some rates in <code>fx_rates</code> to see comparisons.
          </div>
        ) : (
          providers.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-gray-50">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">Rate: {p.rate.toFixed(4)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">You receive</p>
                <p className="text-base font-semibold">
                  {new Intl.NumberFormat().format(Math.round(p.receive))} {quote}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

