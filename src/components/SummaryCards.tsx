// src/components/SummaryCards.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyProvider";
import CountUp from "@/components/CountUp";

type AssetRow = { current_value: number | null; currency: string | null };
type LiabRow = { amount: number | null };

type Totals = {
  assets: number;
  liabilities: number;
  netWorth: number;
};

export default function SummaryCards() {
  const { convert, format } = useCurrency();
  const [totals, setTotals] = useState<Totals>({ assets: 0, liabilities: 0, netWorth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      // Sum assets (converted to selected currency)
      const { data: assetsRows, error: aErr } = await supabase
        .from("assets")
        .select("current_value,currency");
      if (aErr) console.error(aErr);

      const assets = (assetsRows as AssetRow[] | null)?.reduce(
        (s, r) => s + convert(Number(r.current_value || 0), r.currency),
        0
      ) ?? 0;

      // Sum liabilities (kept as-is until currency column exists there)
      let liabilities = 0;
      const liabExists = await supabase
        .from("liabilities")
        .select("amount", { count: "exact", head: true });
      if (!liabExists.error) {
        const { data: liabRows } = await supabase.from("liabilities").select("amount");
        liabilities = (liabRows as LiabRow[] | null)?.reduce(
          (s, r) => s + Number(r.amount || 0),
          0
        ) ?? 0;
      }

      if (isMounted) {
        setTotals({ assets, liabilities, netWorth: assets - liabilities });
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [convert]);

  const cards = [
    { label: "Total Assets", value: totals.assets },
    { label: "Total Liabilities", value: totals.liabilities },
    { label: "Net Worth", value: totals.netWorth },
  ];

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-xs font-medium tracking-wide text-gray-500 dark:text-slate-400">{c.label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-md bg-gray-100 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-slate-100">
              <CountUp value={c.value} formatter={format} />
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Live total</p>
        </div>
      ))}
    </div>
  );
}

function number(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}
