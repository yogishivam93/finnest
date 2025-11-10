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
};

type Props = {
  open: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSaved?: () => void;
};

const currencies = ["AUD", "USD", "INR", "EUR", "GBP", "NZD"];
const types = ["BANK", "INVESTMENT", "PROPERTY", "CRYPTO", "SUPER", "OTHER"];

export default function EditAssetModal({ open, asset, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [country, setCountry] = useState("Australia");
  const [currency, setCurrency] = useState("AUD");
  const [value, setValue] = useState<string>("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) return;
    setName(asset.name ?? "");
    setType(asset.type ?? "BANK");
    setCountry(asset.country ?? "Australia");
    setCurrency((asset.currency ?? "AUD").toUpperCase());
    setValue(String(asset.current_value ?? "0"));
  }, [asset]);

  if (!open || !asset) return null;

  async function save() {
    try {
      setSaving(true);
      setError(null);

      if (!name.trim() || !value.trim()) {
        throw new Error("Name and value are required.");
      }

      // Guard: asset can be null in props; ensure we have an id
      if (!asset) {
        throw new Error("No asset selected to update.");
      }
      const id = asset.id;

      const { error } = await supabase
        .from("assets")
        .update({
          name: name.trim(),
          type,
          country: country.trim(),
          currency: currency.toUpperCase(),
          current_value: Number(value),
        })
        .eq("id", id);

      if (error) throw error;
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to update asset.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Asset</h3>
          <button
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {error && (
          <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Savings Account / ETFs / Term Deposit"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600">Type</label>
              <select
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Country</label>
              <input
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Australia"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600">Currency</label>
              <select
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              >
                {currencies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Current Value</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="10000"
                min={0}
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-1 text-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
