"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyProvider";

type Insight = { title: string; body: string; tone?: string };

export default function InsightsPanel() {
  const { convert, currency } = useCurrency();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const { data: a } = await supabase
        .from("assets")
        .select("type,currency,current_value");
      const payload = {
        assets: (a ?? []).map((r: any) => ({
          type: r?.type ?? null,
          currency: r?.currency ?? null,
          current_value: convert(Number(r?.current_value) || 0, r?.currency),
        })),
        currency,
      };
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setInsights(Array.isArray(json?.insights) ? json.insights : []);
    } catch (e: any) {
      setError(e?.message || "Failed to generate insights");
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("insights-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const toneBadge = (tone?: string) => {
    const t = (tone || "").toLowerCase();
    if (t.includes("positive")) return "text-emerald-700 border-emerald-200 bg-emerald-50";
    if (t.includes("attention")) return "text-red-700 border-red-200 bg-red-50";
    if (t.includes("suggestion")) return "text-amber-700 border-amber-200 bg-amber-50";
    return "text-blue-700 border-blue-200 bg-blue-50";
  };

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI-Powered Insights</h2>
        <button
          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <p className="-mt-1 mb-3 text-xs text-gray-500 dark:text-slate-400">
        Updated daily with AI analysis • <a href="#" className="underline hover:text-gray-700 dark:hover:text-slate-300">View all</a>
      </p>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : insights.length === 0 && !loading ? (
        <p className="text-sm text-gray-500">No insights yet.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((ins, i) => (
            <li key={i} className="rounded-lg border p-3 text-sm dark:border-slate-800">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-slate-100">{ins.title}</span>
                {ins.tone && (
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${toneBadge(ins.tone)}`}>{ins.tone}</span>
                )}
              </div>
              <p className="text-gray-600 dark:text-slate-300">{ins.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
