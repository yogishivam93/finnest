"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Pencil } from "lucide-react";
import AddAssetModal from "./AddAssetModal";
import EditAssetModal from "./EditAssetModal";
import { useCurrency } from "@/context/CurrencyProvider";

type Asset = {
  id: number;
  name: string | null;
  type: string | null;
  country: string | null;
  currency: string | null;
  current_value: number | null;
};

const typeOptions = ["ALL", "BANK", "INVESTMENT", "PROPERTY", "CRYPTO", "SUPER", "OTHER"];
const currencyOptions = ["ALL", "AUD", "USD", "INR", "EUR", "GBP", "NZD"];

export default function AssetsTable() {
  const { convert, format } = useCurrency();
  const [rows, setRows] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    const q = supabase
      .from("assets")
      .select("id,name,type,country,currency,current_value")
      .order("id", { ascending: false });

    const { data, error } = uid ? await q.eq("owner_id", uid) : await q;
    if (!error && data) setRows(data as Asset[]);
    setLoading(false);
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this asset?")) return;
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  useEffect(() => {
    load();

    const ch = supabase
      .channel("assets-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets" },
        () => {
          load();
          return null; // keep React types happy (void)
        }
      );

    ch.subscribe((_status) => {});

    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (typeFilter !== "ALL" && (r.type || "") !== typeFilter) return false;
      if (currencyFilter !== "ALL" && (r.currency || "") !== currencyFilter) return false;
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        const hay = `${r.name ?? ""} ${r.country ?? ""} ${r.type ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [rows, search, typeFilter, currencyFilter]);

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Assets</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="w-40 rounded-md border px-2 py-1 text-sm"
            placeholder="Search name/country"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            title="Filter by type"
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            title="Filter by currency"
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOpenAdd(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No assets match your filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-2">Name</th>
                <th className="p-2">Type</th>
                <th className="p-2">Country</th>
                <th className="p-2">Currency</th>
                <th className="p-2">Value (display)</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const display = format(convert(Number(r.current_value) || 0, r.currency));
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.type}</td>
                    <td className="p-2">{r.country}</td>
                    <td className="p-2">{r.currency}</td>
                    <td className="p-2">{display}</td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditAsset(r)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => remove(r.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddAssetModal open={openAdd} onClose={() => setOpenAdd(false)} onSaved={load} />
      <EditAssetModal
        open={!!editAsset}
        asset={editAsset}
        onClose={() => setEditAsset(null)}
        onSaved={load}
      />
    </section>
  );
}
