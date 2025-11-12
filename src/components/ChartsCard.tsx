"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Bar as RBar,
  BarChart as RBarChart,
  Line as RLine,
  LineChart as RLineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useCurrency } from "@/context/CurrencyProvider";
import CountUp from "@/components/CountUp";
import { PieChart as PieIcon, BarChart2, LineChart as LineIcon, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getCurrentUID } from "@/lib/auth";

type Asset = {
  id: string;
  type?: string | null;
  current_value: number | null;
  currency?: string | null;
};

type Liability = {
  id: string;
  current_value: number | null;
};

// Palettes: switch between "soft" and "brand" easily
const PALETTES = {
  soft: {
    assets: "#10b981", // emerald
    liabilities: "#ef4444", // red
    pie: [
      "#3b82f6", // blue
      "#22d3ee", // cyan
      "#a78bfa", // violet
      "#f59e0b", // amber
      "#34d399", // green
      "#60a5fa", // light blue
      "#f472b6", // pink
      "#93c5fd", // sky
    ],
  },
  brand: {
    assets: "#16a34a", // adjust with your brand green
    liabilities: "#dc2626", // adjust with your brand red
    pie: [
      "#0ea5e9",
      "#38bdf8",
      "#0284c7",
      "#60a5fa",
      "#8b5cf6",
      "#22c55e",
      "#f59e0b",
      "#f43f5e",
    ],
  },
} as const;

// Select the palette here ("soft" by default). Share your brand hex to switch to "brand".
const PALETTE = PALETTES.soft;
const COLORS = PALETTE.pie;
const COLOR_ASSETS = PALETTE.assets;
const COLOR_LIABS = PALETTE.liabilities;

export default function ChartsCard({ title }: { title?: string }) {
  const { convert, format } = useCurrency();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"pie" | "donut" | "bar" | "line">("pie");
  const [deltaA, setDeltaA] = useState<number | null>(null);
  const [deltaL, setDeltaL] = useState<number | null>(null);
  const [deltaN, setDeltaN] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("chartType") : null;
      if (saved === "pie" || saved === "donut" || saved === "bar" || saved === "line") setChartType(saved as any);
    } catch {}

    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const uid = await getCurrentUID();
      const aQ = supabase
        .from("assets")
        .select("id,type,current_value,currency");
      const lQ = supabase
        .from("liabilities")
        .select("id,current_value");
      const [{ data: a }, { data: l }] = await Promise.all([
        uid ? aQ.eq("owner_id", uid) : aQ,
        uid ? lQ.eq("owner_id", uid) : lQ,
      ]);
      if (!cancelled) {
        setAssets((a ?? []) as Asset[]);
        setLiabilities((l ?? []) as Liability[]);
        setLoading(false);
      }
    }
    fetchData();

    const ch = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "assets" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "liabilities" }, () => fetchData())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("chartType", chartType);
    } catch {}
  }, [chartType]);

  const totalsData = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + convert(Number(a.current_value) || 0, a.currency), 0) || 0;
    const totalLiabs = liabilities.reduce((sum, l) => sum + (Number(l.current_value) || 0), 0) || 0;
    return [
      { name: "Total Assets", value: totalAssets },
      { name: "Liabilities", value: totalLiabs },
    ];
  }, [assets, liabilities, convert]);

  const byCategory = useMemo(() => {
    const bucket = new Map<string, number>();
    for (const a of assets) {
      const key = (a.type ?? "Other").trim() || "Other";
      const val = convert(Number(a.current_value) || 0, a.currency);
      bucket.set(key, (bucket.get(key) ?? 0) + val);
    }
    const sorted = Array.from(bucket.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const MAX = 6;
    if (sorted.length <= MAX) return sorted;
    const head = sorted.slice(0, MAX - 1);
    const tailSum = sorted.slice(MAX - 1).reduce((s, r) => s + (Number(r.value) || 0), 0);
    return [...head, { name: "Other", value: tailSum }];
  }, [assets, convert]);

  const innerRadius = chartType === "donut" ? 70 : 0;
  const totalsSum = useMemo(() => totalsData.reduce((s, d) => s + (Number(d.value) || 0), 0), [totalsData]);
  const categorySum = useMemo(() => byCategory.reduce((s, d) => s + (Number(d.value) || 0), 0), [byCategory]);
  function pct(value: number, total: number) {
    const v = Number(value) || 0;
    const t = Number(total) || 0;
    if (!isFinite(v) || !isFinite(t) || t === 0) return "0%";
    return `${((v / t) * 100).toFixed(1)}%`;
  }
  const hasAnyData = (assets?.length || 0) > 0 || (liabilities?.length || 0) > 0;
  const axisTick = (v: number) => format(Number(v) || 0);
  const axisTickCompact = (v: number) =>
    new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(Number(v) || 0);
  const nameTick = (v: any) => {
    const s = String(v ?? "");
    return s.length > 14 ? s.slice(0, 12) + "…" : s;
  };
  const netWorth = Number(totalsData[0]?.value || 0) - Number(totalsData[1]?.value || 0);

  // Best-effort KPI deltas using local baseline (if present)
  useEffect(() => {
    try {
      const a = Number(totalsData[0]?.value || 0);
      const l = Number(totalsData[1]?.value || 0);
      const n = a - l;
      const raw = typeof window !== "undefined" ? localStorage.getItem("kpi_baseline") : null;
      const baseline = raw ? (JSON.parse(raw) as { assets: number; liabs: number }) : null;
      const prevA = baseline?.assets ?? 0;
      const prevL = baseline?.liabs ?? 0;
      const prevN = prevA - prevL;
      const ch = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);
      setDeltaA(ch(a, prevA));
      setDeltaL(ch(l, prevL));
      setDeltaN(ch(n, prevN));
      if (typeof window !== "undefined") {
        localStorage.setItem("kpi_baseline", JSON.stringify({ assets: a, liabs: l }));
      }
    } catch {}
  }, [totalsData]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-gray-800 dark:text-slate-100">{title ?? "Financial Overview"}</div>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Track your assets, liabilities, and net worth</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${
              chartType === "pie" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
            }`}
            onClick={() => setChartType("pie")}
            title="Pie"
            aria-label="Pie"
          >
            <PieIcon size={14} />
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${
              chartType === "donut" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
            }`}
            onClick={() => setChartType("donut")}
            title="Donut"
            aria-label="Donut"
          >
            <Activity size={14} />
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${
              chartType === "bar" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
            }`}
            onClick={() => setChartType("bar")}
            title="Bar"
            aria-label="Bar"
          >
            <BarChart2 size={14} />
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${
              chartType === "line" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"
            }`}
            onClick={() => setChartType("line")}
            title="Line"
            aria-label="Line"
          >
            <LineIcon size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Totals */}
        <div className="rounded-xl border border-gray-200 p-5 dark:border-slate-800">
          <div className="mb-3 text-center text-sm font-medium tracking-wide text-gray-700 dark:text-slate-200">Financial Overview</div>
          <div className="relative h-72 text-white dark:text-slate-900">
            {loading ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />
            ) : !hasAnyData ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl text-sm text-gray-500 dark:text-slate-400">No data yet</div>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <RBarChart data={totalsData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barSize={28} barCategoryGap={12}>
                  <defs>
                    <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[2]} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={COLORS[2]} stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickFormatter={nameTick as any} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={axisTickCompact} />
                  <Tooltip
                    formatter={(v: number, name) => [format(v), String(name)]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <RBar dataKey="value" fill="url(#barBlue)" radius={[4, 4, 0, 0]} />
                </RBarChart>
              ) : chartType === "line" ? (
                <RLineChart data={totalsData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="lineBlue" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={COLORS[2]} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={COLORS[2]} stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickFormatter={nameTick as any} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={axisTickCompact} />
                  <Tooltip formatter={(v: number) => format(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <RLine type="monotone" dataKey="value" stroke="url(#lineBlue)" strokeWidth={2} dot={{ r: 2 }} strokeLinecap="round" />
                </RLineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={totalsData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={innerRadius}
                    outerRadius={100}
                    paddingAngle={1}
                    minAngle={0}
                    startAngle={90}
                    endAngle={450}
                    labelLine={false}
                    cornerRadius={4}
                    stroke="currentColor"
                    strokeWidth={1}
                    label={({ value }) => {
                      const p = Number(value);
                      const percent = totalsSum ? (p / totalsSum) * 100 : 0;
                      return percent >= 8 ? `${percent.toFixed(0)}%` : "";
                    }}
                    isAnimationActive={!loading}
                    animationBegin={100}
                    animationDuration={850}
                    animationEasing="ease-out"
                  >
                    {totalsData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? COLOR_ASSETS : COLOR_LIABS} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name) => [format(v), `${name as string} • ${pct(Number(v), totalsSum)}`]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, marginTop: 6 }} verticalAlign="bottom" height={24} />
                </PieChart>
              )}
            </ResponsiveContainer>
            {chartType === "donut" && hasAnyData && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-slate-400">Net Worth</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    <CountUp value={netWorth} formatter={format} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="h-px w-full bg-gray-100 dark:bg-slate-800" />
            <div className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">Net Worth</div>
            <div className="text-center text-lg font-semibold text-gray-900 dark:text-slate-100">
              <CountUp value={netWorth} formatter={format} />
            </div>
          </div>
        </div>

        {/* By category */}
        <div className="rounded-xl border border-gray-200 p-5 dark:border-slate-800">
          <div className="mb-3 text-center text-sm font-medium tracking-wide text-gray-700 dark:text-slate-200">Asset Distribution by Type</div>
          <div className="relative h-72 text-white dark:text-slate-900">
            {loading ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />
            ) : byCategory.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl text-sm text-gray-500 dark:text-slate-400">No data yet</div>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <RBarChart data={byCategory} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barSize={28} barCategoryGap={12}>
                  <defs>
                    <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[3]} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={COLORS[3]} stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickFormatter={nameTick as any} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={axisTickCompact} />
                  <Tooltip formatter={(v: number) => format(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <RBar dataKey="value" fill="url(#barAmber)" radius={[4, 4, 0, 0]} />
                </RBarChart>
              ) : chartType === "line" ? (
                <RLineChart data={byCategory} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="lineAmber" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={COLORS[3]} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={COLORS[3]} stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickFormatter={nameTick as any} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={axisTick} />
                  <Tooltip formatter={(v: number) => format(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <RLine type="monotone" dataKey="value" stroke="url(#lineAmber)" strokeWidth={2} dot={{ r: 2 }} strokeLinecap="round" />
                </RLineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={innerRadius}
                    outerRadius={100}
                    paddingAngle={1}
                    minAngle={0}
                    startAngle={90}
                    endAngle={450}
                    labelLine={false}
                    cornerRadius={3}
                    stroke="currentColor"
                    strokeWidth={1}
                    label={({ value }) => {
                      const p = Number(value);
                      const percent = categorySum ? (p / categorySum) * 100 : 0;
                      return percent >= 8 ? `${percent.toFixed(0)}%` : "";
                    }}
                    isAnimationActive={!loading}
                    animationBegin={100}
                    animationDuration={850}
                    animationEasing="ease-out"
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name) => [format(v), `${name as string} • ${pct(Number(v), categorySum)}`]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, marginTop: 6 }} verticalAlign="bottom" height={24} />
                </PieChart>
              )}
            </ResponsiveContainer>
            {chartType === "donut" && byCategory.length > 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-slate-400">Total Assets</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    <CountUp value={categorySum} formatter={format} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-start justify-between text-xs">
              <div className="space-y-1">
                {byCategory.slice(0, 6).map((row, i) => (
                  <div key={row.name} className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{row.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-right space-y-1">
                {byCategory.slice(0, 6).map((row) => (
                  <div key={row.name} className="font-medium text-gray-900 dark:text-slate-100">
                    <CountUp value={row.value} formatter={format} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 h-px w-full bg-gray-100 dark:bg-slate-800" />
            <div className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">Total Assets</div>
            <div className="text-center text-lg font-semibold text-gray-900 dark:text-slate-100">
              <CountUp value={categorySum} formatter={format} />
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Assets */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-gray-500 dark:text-slate-400">Total Assets</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
            <CountUp value={Number(totalsData[0]?.value || 0)} formatter={format} />
          </div>
          <div className={`mt-1 flex items-center gap-1 text-xs ${deltaA && deltaA > 0 ? "text-emerald-600" : "text-gray-500 dark:text-slate-400"}`}>
            {deltaA && deltaA > 0 ? <ArrowUpRight size={14} /> : null}
            <span>{deltaA === null ? "" : `${Math.abs(deltaA).toFixed(1)}%`}</span>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-gray-500 dark:text-slate-400">Total Liabilities</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
            <CountUp value={Number(totalsData[1]?.value || 0)} formatter={format} />
          </div>
          <div className={`mt-1 flex items-center gap-1 text-xs ${deltaL && deltaL > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {deltaL && deltaL > 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
            <span>{deltaL === null ? "" : `${Math.abs(deltaL).toFixed(1)}%`}</span>
          </div>
        </div>

        {/* Net Worth */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-gray-500 dark:text-slate-400">Net Worth</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
            <CountUp value={netWorth} formatter={format} />
          </div>
          <div className={`mt-1 flex items-center gap-1 text-xs ${deltaN && deltaN > 0 ? "text-emerald-600" : deltaN && deltaN < 0 ? "text-red-600" : "text-gray-500 dark:text-slate-400"}`}>
            {deltaN && deltaN > 0 ? <ArrowUpRight size={14} /> : deltaN && deltaN < 0 ? <ArrowDownRight size={14} /> : null}
            <span>{deltaN === null ? "" : `${Math.abs(deltaN).toFixed(1)}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
