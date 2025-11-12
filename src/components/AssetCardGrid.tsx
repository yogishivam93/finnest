"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyProvider";
import ShareAssetsModal from "@/components/ShareAssetsModal";
import { getCurrentUID } from "@/lib/auth";
import { RotateCw, Landmark, TrendingUp, Shield, Home, Coins, Briefcase } from "lucide-react";

type Row = {
  id: number;
  name: string | null;
  type: string | null;
  institution?: string | null;
  currency: string | null;
  current_value: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type Props = {
  limit?: number | null;
  title?: string;
  onView?: (id: number) => void;
};

export default function AssetCardGrid({ limit = 6, title = "Your Assets", onView }: Props) {
  const router = useRouter();
  const { format, convert } = useCurrency();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sharedSet, setSharedSet] = useState<Set<number>>(new Set());
  const [sharedCounts, setSharedCounts] = useState<Record<number, number>>({});
  const [docCounts, setDocCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const uid = await getCurrentUID();
      let q = supabase
        .from("assets")
        .select("id,name,type,institution,currency,current_value,updated_at,created_at")
        .order("updated_at", { ascending: false })
        .order("id", { ascending: false });
      if (limit !== null && limit !== undefined) {
        q = q.limit(limit);
      }
      const { data } = uid ? await q.eq("owner_id", uid) : await q;
      if (!cancelled) {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      }

      // Best-effort: compute which assets are shared based on shares.asset_ids
      try {
        const { data: shares } = await supabase
          .from("shares")
          .select("asset_ids");
        const s = new Set<number>();
        const counts: Record<number, number> = {};
        (shares ?? []).forEach((rec: any) => {
          const ids: unknown = rec?.asset_ids;
          if (Array.isArray(ids)) {
            ids.forEach((id) => {
              if (typeof id === "number") {
                s.add(id);
                counts[id] = (counts[id] ?? 0) + 1;
              }
            });
          }
        });
        if (!cancelled) {
          setSharedSet(s);
          setSharedCounts(counts);
        }
      } catch {
        if (!cancelled) {
          setSharedSet(new Set());
          setSharedCounts({});
        }
      }

      // Documents count per asset (limited to the assets we show)
      try {
        const ids = (data ?? []).map((r: any) => r.id).filter(Boolean);
        if (ids.length > 0) {
          const { data: docs } = await supabase
            .from("documents")
            .select("asset_id")
            .in("asset_id", ids as any);
          const counts: Record<number, number> = {};
          (docs ?? []).forEach((d: any) => {
            const k = Number(d.asset_id);
            if (!Number.isNaN(k)) counts[k] = (counts[k] ?? 0) + 1;
          });
          if (!cancelled) setDocCounts(counts);
        } else if (!cancelled) {
          setDocCounts({});
        }
      } catch {
        if (!cancelled) setDocCounts({});
      }
    }
    load();
    const ch = supabase
      .channel("shares-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "shares" }, () => load())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  const cards = useMemo(() => rows.slice(0, 6), [rows]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
              <div className="mt-2 h-3 w-56 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
              <div className="mt-6 h-8 w-28 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No assets yet. Click <span className="font-medium">+ Add Asset</span> to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((a) => {
            const display = format(convert(Number(a.current_value) || 0, a.currency));
            const updated = a.updated_at || a.created_at;
            const isShared = sharedSet.has(a.id);
            const shareCount = sharedCounts[a.id] ?? 0;
            const valueLabel = ["BANK", "SUPER", "INVESTMENT"].includes((a.type || "").toUpperCase())
              ? "Current Balance"
              : "Estimated Value";
            const connected = !!a.institution && ["BANK", "SUPER", "INVESTMENT"].includes((a.type || "").toUpperCase());

            function timeAgo(ts?: string | null) {
              if (!ts) return null;
              const ms = Date.now() - new Date(ts).getTime();
              const mins = Math.max(0, Math.round(ms / 60000));
              if (mins < 1) return "just now";
              if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
              const hrs = Math.round(mins / 60);
              if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
              const days = Math.round(hrs / 24);
              return `${days} day${days === 1 ? "" : "s"} ago`;
            }
            return (
              <div key={a.id} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                      {(() => {
                        const t = (a.type || "").toUpperCase();
                        if (t === "BANK") return <Landmark size={16} />;
                        if (t === "INVESTMENT") return <TrendingUp size={16} />;
                        if (t === "SUPER") return <Shield size={16} />;
                        if (t === "PROPERTY") return <Home size={16} />;
                        if (t === "CRYPTO") return <Coins size={16} />;
                        return <Briefcase size={16} />;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{a.name || a.type || "Asset"}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{(a.type || "").toUpperCase()}</p>
                      {a.institution && (
                        <p className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600 dark:text-emerald-300">{a.institution}</span>
                          {updated && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                              <RotateCw size={12} /> Updated {timeAgo(updated)}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connected ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                        Connected
                      </span>
                    ) : null}
                    {isShared ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300">
                        Shared
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-slate-400">
                  <p>{valueLabel}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">{display}</p>
                  {updated && (
                    <p className="mt-1">Updated {new Date(updated).toLocaleString()}</p>
                  )}
                </div>
                <div className="my-3 h-px w-full bg-gray-100 dark:bg-slate-800" />

                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className={isShared ? "text-emerald-600" : "text-gray-500 dark:text-slate-400"}>
                    {isShared ? `Shared with ${shareCount}` : "Not shared"}
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">{isShared ? "100%" : "0%"}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-800">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                      isShared ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-700"
                    }`}
                    style={{ width: isShared ? "100%" : "0%" }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Documents: {docCounts[a.id] ? docCounts[a.id] : 0}</span>
                  <button
                    className="rounded-full border px-2 py-0.5 text-[11px] hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    onClick={() => router.push(`/documents?asset_id=${a.id}`)}
                  >
                    Manage
                  </button>
                </div>

                {/* Action buttons: ghost View + primary Share */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    className="h-9 w-full rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => (onView ? onView(a.id) : router.push(`/assets?id=${a.id}`))}
                  >
                    View
                  </button>
                  <button
                    className="h-9 w-full rounded-md bg-blue-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    onClick={() => {
                      setSelectedIds([a.id]);
                      setShareOpen(true);
                    }}
                  >
                    Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ShareAssetsModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        initialTab="beneficiary"
      />
    </section>
  );
}
