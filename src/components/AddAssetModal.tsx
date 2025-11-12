"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ASSET_TYPES, type AssetType } from "@/types/asset";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function AddAssetModal({ open, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<AssetType>("BANK");
  const [country, setCountry] = useState("Australia");
  const [currency, setCurrency] = useState("AUD");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function save() {
    try {
      setSaving(true);
      setError(null);

      if (!name.trim() || !value.trim()) {
        throw new Error("Name and value are required.");
      }

      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) throw new Error("You must be logged in.");

      const { error } = await supabase.from("assets").insert([
        {
          owner_id: uid,
          name,
          institution: institution || null,
          type,
          country,
          currency,
          current_value: Number(value),
        },
      ]);
      if (error) throw error;

      // reset & close
      setName("");
      setInstitution("");
      setType("BANK");
      setCountry("Australia");
      setCurrency("AUD");
      setValue("");
      onClose();
      onSaved?.();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Asset</h3>
          <button
            className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            âœ•
          </button>
        </div>

        {error && (
          <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Name</label>
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Savings Account / ETFs / Term Deposit"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Type</label>
              <select
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
              >
                {ASSET_TYPES.map((t: AssetType) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Institution</label>
              <input
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-400"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Bank/Provider (optional)"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Country</label>
              <input
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-400"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Australia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Currency</label>
              <input
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-400"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="AUD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Current Value</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 placeholder-gray-400 dark:placeholder-slate-400"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="10000"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-1 text-sm dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Savingâ€¦" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}








