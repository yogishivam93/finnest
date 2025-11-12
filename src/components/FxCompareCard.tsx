"use client";

import { useEffect, useState } from "react";

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "INR", "SGD", "NZD", "CAD", "JPY"];

type CompareRow = {
  provider: string;
  label: string;
  rate: number | null;
  timestamp?: string | null;
  source?: string;
};

export default function FxCompareCard() {
  const [base, setBase] = useState("AUD");
  const [quote, setQuote] = useState("USD");
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!base || !quote || base === quote) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/fx/compare?base=${base}&quote=${quote}`, { cache: "no-store" });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed to load rates");
        if (!cancelled) setRows(j.results as CompareRow[]);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load rates");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [base, quote]);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-slate-100">FX Rate Comparison</h3>

      <div className="mb-4 flex items-center gap-3">
        <select
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-gray-500">→</span>
        <select
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {base === quote ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Please select different currencies.</p>
      ) : loading ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">Loading rates…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : rows.length ? (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.provider} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.label}</span>
                {r.source ? (
                  <a className="text-xs text-blue-600 hover:underline" href={r.source} target="_blank" rel="noreferrer">source</a>
                ) : null}
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {r.rate != null ? (
                    <>
                      1 {base} = {r.rate.toFixed(4)} {quote}
                    </>
                  ) : (
                    <span className="text-gray-500">unavailable</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {r.timestamp ? new Date(r.timestamp).toLocaleString() : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-slate-400">No rates available for this pair.</p>
      )}
    </div>
  );
}

