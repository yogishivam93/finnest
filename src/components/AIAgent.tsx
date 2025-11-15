// src/components/AIAgent.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Asset = {
  id: number;
  name: string | null;
  type: string | null;
  country: string | null;
  currency: string | null;
  current_value: number | null;
  owner_id: string | null;
};

export default function AIAgent() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const disclaimerCopy = "Informational summary only – not financial advice.";

  async function load() {
    try {
      setError(null);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) {
        setAssets([]);
        return;
      }

      const { data, error } = await supabase
        .from("assets")
        .select("id,name,type,country,currency,current_value,owner_id")
        .eq("owner_id", user.id);

      if (error) throw error;
      setAssets((data ?? []) as Asset[]);
    } catch (e: any) {
      setError(e?.message ?? "Could not load AI insights.");
    }
  }

  useEffect(() => {
    load();

    const chA = supabase
      .channel("ai-assets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chA);
    };
  }, []);

  const totalValue =
    assets.reduce((sum, a) => sum + Number(a.current_value || 0), 0) || 0;

  const counts: Record<string, number> = {};
  for (const a of assets) {
    const k = (a.type || "OTHER").toUpperCase();
    counts[k] = (counts[k] || 0) + 1;
  }
  const topType =
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">AI Portfolio Summary</h2>
      <p className="-mt-1 mb-3 text-xs text-gray-500">{disclaimerCopy}</p>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-gray-500">
          No assets found yet. Add assets to see insights.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm">
            You currently track <b>{assets.length}</b> assets across{" "}
            <b>{new Set(assets.map((a) => a.country || "Unknown")).size}</b>{" "}
            countries, totalling <b>${totalValue.toLocaleString()}</b>.
          </p>

          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
            🔎 Observation: Your largest category appears to be <b>{topType}</b>,
            representing the highest share of tracked assets. Note this is an
            informational view only and does not include investment guidance.
          </div>
        </>
      )}
    </section>
  );
}
