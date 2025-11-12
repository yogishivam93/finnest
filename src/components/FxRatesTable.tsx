// src/components/FxRatesTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FxRate } from "@/types/fx";
import FxRateModal from "./FxRateModal";

export default function FxRatesTable() {
  const [rows, setRows] = useState<FxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FxRate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("fx_rates")
      .select("id, base, quote, rate, updated_at")
      .order("base", { ascending: true })
      .order("quote", { ascending: true });

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as FxRate[]);
    }
    setLoading(false);
    setLastRefreshed(new Date());
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("fx-rates-ui")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fx_rates" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: number | undefined) {
    if (!id) return;
    if (!confirm("Delete this FX rate?")) return;
    const { error } = await supabase.from("fx_rates").delete().eq("id", id);
    if (error) alert(error.message);
  }

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td className="py-3 text-gray-500 dark:text-slate-400" colSpan={5}>
            Loadingâ€¦
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="py-3 text-red-600" colSpan={5}>
            {error}
          </td>
        </tr>
      );
    }
    if (!rows.length) {
      return (
        <tr>
          <td className="py-3 text-gray-500 dark:text-slate-400" colSpan={5}>
            No rates yet. Click “+ Add Rate”.
          </td>
        </tr>
      );
    }
    return rows.map((r) => (
      <tr key={r.id} className="border-t dark:border-slate-800">
        <td className="py-2 pr-4 font-mono">{r.base}</td>
        <td className="py-2 pr-4 font-mono">{r.quote}</td>
        <td className="py-2 pr-4">{Number(r.rate).toLocaleString()}</td>
        <td className="py-2 pr-4">
          {r.updated_at ? new Date(r.updated_at).toLocaleString() : "â€”"}
        </td>
        <td className="py-2 flex gap-2">
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-700"
            onClick={() => {
              setEditing(r);
              setModalOpen(true);
            }}
          >
            Edit
          </button>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-700"
            onClick={() => handleDelete(r.id)}
          >
            Delete
          </button>
        </td>
      </tr>
    ));
  }, [rows, loading, error]);

  return (
    <>
      <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">FX Rates</h2>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-700"
          >
            + Add Rate
          </button>
        </div>
        <div className="mb-3 text-xs text-gray-500 dark:text-slate-400">
          Auto-refresh enabled. {loading ? (
            <span className="text-gray-700">Refreshingâ€¦</span>
          ) : lastRefreshed ? (
            <>Last updated {lastRefreshed.toLocaleTimeString()}</>
          ) : (
            <>Waiting for first updateâ€¦</>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600 dark:text-slate-300">
              <tr>
                <th className="py-2 pr-4">Base</th>
                <th className="py-2 pr-4">Quote</th>
                <th className="py-2 pr-4">Rate</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>{tableBody}</tbody>
          </table>
        </div>
      </section>

      <FxRateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={() => load()}
      />
    </>
  );
}



