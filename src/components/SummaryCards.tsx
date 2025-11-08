// src/components/SummaryCards.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { loadFxMap, convertAmount } from "@/lib/fx";

type Row = {
  id: string;
  type: string | null;
  currency: string | null;
  current_value: number | null;
  updated_at: string | null;
  owner_id: string | null;
};

const TARGETS = ["AUD", "USD", "INR"] as const;
type Target = (typeof TARGETS)[number];

export default function SummaryCards() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [fx, setFx] = useState<Record<string, number>>({});
  const [target, setTarget] = useState<Target>("AUD");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    // 1) user
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) {
      setRows(null);
      setLoading(false);
      return;
    }

    // 2) assets
    const { data, error } = await supabase
      .from("assets")
      .select("id,type,currency,current_value,updated_at,owner_id")
      .eq("owner_id", user.id);

    if (!error && data) setRows(data as Row[]);
    else setRows([]);

    // 3) fx map
    const fxMap = await loadFxMap();
    setFx(fxMap);

    setLoading(false);
  }

  useEffect(() => {
    load();

    const chAssets = supabase
      .channel("assets-summary")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets" },
        () => load()
      )
      .subscribe();

    const chFx = supabase
      .channel("fx-summary")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fx_rates" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chAssets);
      supabase.removeChannel(chFx);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // raw rollups
  const byCcy = useMemo(() => {
    const m: Record<string, number> = {};
    (rows ?? []).forEach((r) => {
      const ccy = (r.currency ?? "").toUpperCase() || "—";
      const v = Number(r.current_value ?? 0);
      if (!isFinite(v)) return;
      m[ccy] = (m[ccy] || 0) + v;
    });
    return m;
  }, [rows]);

  // unified net worth in selected target currency
  const netWorth = useMemo(() => {
    let sum = 0;
    for (const [ccy, val] of Object.entries(byCcy)) {
      const conv = convertAmount(val, ccy, target, fx);
      if (conv !== null) sum += conv;
      else {
        // If we don't know this pair yet, just skip it (or you could add it to fx_rates)
        // console.warn(`No FX route for ${ccy}->${target}`);
      }
    }
    return sum;
  }, [byCcy, target, fx]);

  // other stats
  const { banks, totalAssets, lastUpdated } = useMemo(() => {
    let banks = 0;
    let total = 0;
    let maxUpdated: number | null = null;
    (rows ?? []).forEach((r) => {
      total += 1;
      if ((r.type ?? "").toUpperCase() === "BANK") banks += 1;
      if (r.updated_at) {
        const t = new Date(r.updated_at).getTime();
        if (!Number.isNaN(t)) maxUpdated = maxUpdated === null ? t : Math.max(maxUpdated, t);
      }
    });
    return {
      banks,
      totalAssets: total,
      lastUpdated: maxUpdated ? new Date(maxUpdated) : null,
    };
  }, [rows]);

  const cards = [
    {
      label: "Net Worth",
      value: loading ? "…" : `${netWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${target}`,
      right: (
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as Target)}
          className="rounded-lg border px-2 py-1 text-xs"
          aria-label="Currency selector"
        >
          {TARGETS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      ),
    },
    { label: "Accounts Linked (BANK)", value: loading ? "…" : String(banks) },
    { label: "Assets Tracked", value: loading ? "…" : String(totalAssets) },
    {
      label: "Last Updated",
      value: loading ? "…" : (lastUpdated ? lastUpdated.toLocaleDateString() : "—"),
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-500">{c.label}</p>
            {c.right ?? null}
          </div>
          <p className="mt-1 text-lg lg:text-2xl font-semibold">{c.value}</p>
        </div>
      ))}
    </section>
  );
}
