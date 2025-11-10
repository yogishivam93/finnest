"use client";

import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { supabase } from "@/lib/supabase";

type AssetRow = { type: string | null; current_value: number | null };

const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#06b6d4",
];

export default function AssetsByCategoryChart() {
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("type,current_value");
      if (error) setErr(error.message);
      else setRows(data ?? []);
    })();
  }, []);

  const data = useMemo(() => {
    if (!rows.length) {
      // fallback so you see the chart even before DB is filled
      return [
        { name: "Property", value: 900000 },
        { name: "Bank", value: 505000 },
        { name: "Investment", value: 205000 },
      ];
    }
    const grouped = new Map<string, number>();
    for (const r of rows) {
      const key = r.type ?? "Uncategorised";
      grouped.set(key, (grouped.get(key) ?? 0) + (r.current_value ?? 0));
    }
    return Array.from(grouped, ([name, value]) => ({ name, value }));
  }, [rows]);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 text-sm font-medium">Assets by Category</div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Legend verticalAlign="bottom" height={24} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
