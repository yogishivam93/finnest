// src/components/SummaryCards.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  type: string | null;
  currency: string | null;
  current_value: number | null;
  updated_at: string | null;
  owner_id: string | null;
};

function formatCurrencyMap(totals: Record<string, number>) {
  const parts = Object.entries(totals).map(([ccy, v]) => {
    const val = Math.round(v * 100) / 100;
    // Rough formatting; if you like we can plug in Intl per currency later
    return `${val.toLocaleString()} ${ccy}`;
  });
  return parts.length ? parts.join("  •  ") : "—";
}

export default function SummaryCards() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) {
      setRows(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("assets")
      .select("id,type,currency,current_value,updated_at,owner_id")
      .eq("owner_id", user.id);

    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows(data as Row[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("assets-summary")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { totalsByCcy, bankCount, assetCount, lastUpdated } = useMemo(() => {
    const totals: Record<string, number> = {};
    let banks = 0;
    let count = 0;
    let maxUpdated: number | null = null;

    (rows ?? []).forEach((r) => {
      count += 1;
      if ((r.type ?? "").toUpperCase() === "BANK") banks += 1;

      const ccy = (r.currency ?? "").toUpperCase() || "—";
      const val = Number(r.current_value ?? 0);
      totals[ccy] = (totals[ccy] || 0) + (isFinite(val) ? val : 0);

      if (r.updated_at) {
        const t = new Date(r.updated_at).getTime();
        if (!Number.isNaN(t)) {
          maxUpdated = maxUpdated === null ? t : Math.max(maxUpdated, t);
        }
      }
    });

    return {
      totalsByCcy: totals,
      bankCount: banks,
      assetCount: count,
      lastUpdated: maxUpdated ? new Date(maxUpdated) : null,
    };
  }, [rows]);

  const netWorthText = formatCurrencyMap(totalsByCcy);

  const cards = [
    { label: "Net Worth", value: netWorthText },
    { label: "Accounts Linked (BANK)", value: String(bankCount) },
    { label: "Assets Tracked", value: String(assetCount) },
    {
      label: "Last Updated",
      value: lastUpdated ? lastUpdated.toLocaleDateString() : "—",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{c.label}</p>
          <p className="mt-1 text-lg lg:text-2xl font-semibold">
            {loading ? "…" : c.value}
          </p>
        </div>
      ))}
    </section>
  );
}
