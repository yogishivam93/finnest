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
import { PieChart as PieIcon, BarChart2, LineChart as LineIcon, Activity } from "lucide-react";

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

const COLORS = [
  "#22c55e",
  "#ef4444",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#e11d48",
];

export default function ChartsCard({ title }: { title?: string }) {
  const { convert, format } = useCurrency();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"pie" | "donut" | "bar" | "line">("pie");

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("chartType") : null;
      if (saved === "pie" || saved === "donut" || saved === "bar" || saved === "line") setChartType(saved as any);
    } catch {}

    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const [{ data: a }, { data: l }] = await Promise.all([
        supabase.from("assets").select("id,type,current_value,currency"),
        supabase.from("liabilities").select("id,current_value"),
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
    return Array.from(bucket.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">{title ?? "Financial Overview"}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${chartType === "pie" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}
            onClick={() => setChartType("pie")}
            title="Pie"
            aria-label="Pie"
          >
            <PieIcon size={14} />
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${chartType === "donut" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}
            onClick={() => setChartType("donut")}
            title="Donut"
            aria-label="Donut"
          >
            <Activity size={14} />
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${chartType === "bar" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}
            onClick={() => setChartType("bar")}
            title="Bar"
            aria-label="Bar"
          >
            <BarChart2 size={14} />
          </button>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-md border px-2 py-1.5 text-xs ${chartType === "line" ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}
            onClick={() => setChartType("line")}
            title="Line"
            aria-label="Line"
          >
            <LineIcon size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-medium tracking-wide text-gray-500">Assets vs Liabilities</div>
          <div className="h-64">
            {loading ? <div className="h-full w-full animate-pulse rounded-xl bg-gray-100" /> : null}
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <RBarChart data={totalsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => format(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RBar dataKey="value" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                </RBarChart>
              ) : chartType === "line" ? (
                <RLineChart data={totalsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => format(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RLine type="monotone" dataKey="value" stroke={COLORS[2]} strokeWidth={2} dot={false} />
                </RLineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={totalsData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={innerRadius}
                    outerRadius={100}
                    paddingAngle={2}
                    isAnimationActive={!loading}
                    animationBegin={100}
                    animationDuration={850}
                    animationEasing="ease-out"
                  >
                    {totalsData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? COLORS[0] : COLORS[1]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => format(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {totalsData.map((row, i) => {
              const width = totalsSum ? Math.max(0, Math.min(100, ((Number(row.value) || 0) / totalsSum) * 100)) : 0;
              const color = i === 0 ? COLORS[0] : COLORS[1];
              return (
                <div key={row.name}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-gray-600">{row.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      <CountUp value={row.value} formatter={format} />
                      <span className="ml-2 text-xs font-normal text-gray-500">{pct(row.value, totalsSum)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100" role="progressbar" aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${loading ? 0 : width}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium tracking-wide text-gray-500">Assets by Category</div>
          <div className="h-64">
            {loading ? <div className="h-full w-full animate-pulse rounded-xl bg-gray-100" /> : null}
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <RBarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => format(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RBar dataKey="value" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                </RBarChart>
              ) : chartType === "line" ? (
                <RLineChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => format(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RLine type="monotone" dataKey="value" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                </RLineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={innerRadius}
                    outerRadius={100}
                    paddingAngle={2}
                    isAnimationActive={!loading}
                    animationBegin={100}
                    animationDuration={850}
                    animationEasing="ease-out"
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => format(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {byCategory.map((row, i) => {
              const total = categorySum || 0;
              const width = total ? Math.max(0, Math.min(100, ((Number(row.value) || 0) / total) * 100)) : 0;
              const color = COLORS[i % COLORS.length];
              return (
                <div key={row.name}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-gray-600">{row.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      <CountUp value={row.value} formatter={format} />
                      <span className="ml-2 text-xs font-normal text-gray-500">{pct(row.value, categorySum)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100" role="progressbar" aria-valuenow={width} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${loading ? 0 : width}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

