"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Banknote } from "lucide-react";

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

  const bestIndex = useMemo(() => {
    if (!providers.length) return -1;
    let bi = 0;
    for (let i = 1; i < providers.length; i++) if (providers[i].receive > providers[bi].receive) bi = i;
    return bi;
  }, [providers]);

  const lastUpdatedText = useMemo(() => {
    if (!lastRefreshed) return "";
    const diffMs = Date.now() - lastRefreshed.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins <= 0) return "Just now";
    if (mins === 1) return "1 min ago";
    return `${mins} mins ago`;
  }, [lastRefreshed]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-base font-medium text-gray-700 dark:text-slate-200">FX Rate Comparison</p>
        <span className="text-xs text-gray-500">Mid-market: {midRate ? midRate.toFixed(4) : "-"}</span>
      </div>
      <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Connected</span>
        <span aria-hidden>•</span>
        {loading ? <span>Refreshing…</span> : lastRefreshed ? <span>Last updated {lastUpdatedText}</span> : <span>Waiting for first update…</span>}
      </div>

      <div className="flex gap-2 text-sm">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 dark:text-slate-400">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value || 0))}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-slate-400">From</label>
          <select
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {["AUD", "USD", "INR", "EUR"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-slate-400">To</label>
          <select
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {["INR", "AUD", "USD", "EUR"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100 dark:bg-slate-800" />
                  <div>
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
                    <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="h-6 w-20 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : midRate === 0 ? (
          <div className="text-sm text-gray-500 dark:text-slate-400">
            Add some rates in <code>fx_rates</code> to see comparisons.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-lg border dark:divide-slate-800 dark:border-slate-800">
            {providers.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-slate-300">
                    <Banknote size={14} />
                  </span>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-slate-100">{p.name}</p>
                      {i === bestIndex && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">Best</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Rate: {p.rate.toFixed(4)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-slate-400">You receive</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
                    {new Intl.NumberFormat().format(Math.round(p.receive))} {quote}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
