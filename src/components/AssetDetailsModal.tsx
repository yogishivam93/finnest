"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyProvider";

type AssetRow = {
  id: number;
  name: string | null;
  type: string | null;
  institution?: string | null;
  country?: string | null;
  currency: string | null;
  current_value: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function AssetDetailsModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { format, convert } = useCurrency();
  const [row, setRow] = useState<AssetRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // editable fields
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [value, setValue] = useState<string>("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [sharedCount, setSharedCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("assets")
        .select("id,name,type,institution,country,currency,current_value,created_at,updated_at")
        .eq("id", id)
        .maybeSingle();
      if (!cancelled) {
        if (error) console.error(error);
        setRow((data as any) ?? null);
        setLoading(false);
      }
    }
    load();

    // shared count (best-effort)
    (async () => {
      try {
        const { data: shares } = await supabase.from("shares").select("asset_ids");
        let count = 0;
        (shares ?? []).forEach((rec: any) => {
          const ids: unknown = rec?.asset_ids;
          if (Array.isArray(ids) && ids.includes(id)) count += 1;
        });
        if (!cancelled) setSharedCount(count);
      } catch {
        if (!cancelled) setSharedCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!row) return;
    setName(row.name || "");
    setType(row.type || "");
    setValue(String(Number(row.current_value || 0)));
    // Best-effort: if these fields exist on the row (future-proof), seed them
    setDescription((row as any)?.description || "");
    setLocation((row as any)?.location || (row as any)?.details || "");
  }, [row]);

  function Field({ label, value }: { label: string; value?: string | number | null }) {
    return (
      <div className="flex items-center justify-between py-1 text-sm">
        <span className="text-gray-500 dark:text-slate-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-slate-100">{value ?? "-"}</span>
      </div>
    );
  }

  const display = row ? format(convert(Number(value || 0) || 0, row.currency)) : "";

  const typeOptions = useMemo(
    () => [
      { value: "BANK", label: "Bank" },
      { value: "INVESTMENT", label: "Investment" },
      { value: "SUPER", label: "Super" },
      { value: "PROPERTY", label: "Real Estate" },
      { value: "CRYPTO", label: "Crypto" },
      { value: "OTHER", label: "Other" },
    ],
    []
  );

  async function onSave() {
    if (!row) return;
    setSaving(true);
    try {
      const currVal = Number(value);
      const update: any = {
        name: name || null,
        type: type || null,
        current_value: Number.isFinite(currVal) ? currVal : 0,
      };
      const { error } = await supabase.from("assets").update(update).eq("id", row.id);
      if (error) throw error;
      setRow({ ...row, ...update });

      // Optional: description + location (will no-op if columns don't exist)
      try {
        const extra: any = {
          description: description ? description : null,
          location: location ? location : null,
        };
        const { error: extraErr } = await supabase.from("assets").update(extra).eq("id", row.id);
        if (extraErr) {
          // If columns missing, provide guidance but don't block main save
          console.warn("Description/location update skipped:", extraErr?.message);
        }
      } catch (e) {
        console.warn("Optional fields update failed", e);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[min(96vw,720px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">View & Edit Asset Details</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">View and update asset information</p>
          </div>
          <button
            className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
            <div className="h-4 w-56 animate-pulse rounded bg-gray-100 dark:bg-slate-800" />
          </div>
        ) : !row ? (
          <div className="text-sm text-gray-500 dark:text-slate-400">Asset not found.</div>
        ) : (
          <div>
            {/* Header card */}
            <div className="mb-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {name || row.type || `Asset #${row.id}`}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{type || row.type || "Asset"}</div>
                </div>
                {sharedCount > 0 ? (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">Shared</span>
                ) : null}
              </div>
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400">Asset Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400">Asset Type</label>
                <select
                  value={(type || "").toUpperCase()}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400">Estimated Value</label>
                <input
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{display}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400">Shared With</label>
                <input
                  disabled
                  value={sharedCount > 0 ? `${sharedCount} recipient${sharedCount === 1 ? "" : "s"}` : "Not shared"}
                  className="mt-1 w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                />
              </div>
            </div>

            {/* Meta */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Currency" value={row.currency || "-"} />
              <Field label="Updated" value={row.updated_at ? new Date(row.updated_at).toLocaleString() : row.created_at ? new Date(row.created_at).toLocaleString() : "-"} />
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 dark:text-slate-400">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes or description about this asset..."
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Location / Details */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 dark:text-slate-400">Location / Details</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., 123 Main Street, City, State"
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
