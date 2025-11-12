"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function AddLiabilityModal({ open, onClose, onSaved }: Props) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("AUD");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function save() {
    try {
      setSaving(true);
      setError(null);
      if (!type.trim() || !value.trim()) throw new Error("Type and value are required.");
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) throw new Error("You must be logged in.");

      // First try inserting with description; if the column doesn't exist in the schema, retry without it.
      let { error } = await supabase.from("liabilities").insert([
        {
          owner_id: uid,
          type,
          description: description || null,
          currency: currency || null,
          current_value: Number(value),
        } as any,
      ]);
      if (error && /description/i.test(error.message || "")) {
        const retry = await supabase.from("liabilities").insert([
          {
            owner_id: uid,
            type,
            currency: currency || null,
            current_value: Number(value),
          } as any,
        ]);
        error = retry.error as any;
      }
      if (error) throw error;
      setType("");
      setDescription("");
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
          <h3 className="text-lg font-semibold">Add Liability</h3>
          <button className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={onClose}>×</button>
        </div>

        {error && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Type</label>
            <input className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700" value={type} onChange={(e) => setType(e.target.value)} placeholder="Loan / Credit Card / Mortgage" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Description</label>
            <input className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Currency</label>
              <input className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="AUD" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Current Value</label>
              <input type="number" className="mt-1 w-full rounded-lg border px-2 py-1 text-sm bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700" value={value} onChange={(e) => setValue(e.target.value)} placeholder="5000" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-1 text-sm dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-60" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
