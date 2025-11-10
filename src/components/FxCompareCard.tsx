"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "INR", "SGD"];

type FxRate = {
  id: string;
  base: string;
  quote: string;
  rate: number;
  updated_at: string;
};

export default function FxCompareCard() {
  const [base, setBase] = useState("AUD");
  const [quote, setQuote] = useState("USD");
  const [rates, setRates] = useState<FxRate[]>([]);

  useEffect(() => {
    async function fetchRates() {
      const { data } = await supabase
        .from("fx_rates")
        .select("*")
        .eq("base", base)
        .eq("quote", quote)
        .order("rate", { ascending: true });

      setRates(data || []);
    }

    if (base && quote && base !== quote) {
      fetchRates();
    }
  }, [base, quote]);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-medium text-gray-900">FX Rate Comparison</h3>
      
      <div className="mb-6 flex items-center gap-4">
        <select
          value={base}
          onChange={(e) => setBase(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr} value={curr}>
              {curr}
            </option>
          ))}
        </select>
        <span className="text-gray-500">→</span>
        <select
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr} value={curr}>
              {curr}
            </option>
          ))}
        </select>
      </div>

      {base === quote ? (
        <p className="text-sm text-gray-500">Please select different currencies</p>
      ) : rates.length > 0 ? (
        <div className="space-y-3">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div className="text-sm">
                <span className="font-medium">1 {base}</span>
                <span className="mx-2">=</span>
                <span className="font-medium">{rate.rate.toFixed(4)} {quote}</span>
              </div>
              <div className="text-xs text-gray-500">
                Updated {new Date(rate.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No rates available for this pair</p>
      )}
    </div>
  );
}
