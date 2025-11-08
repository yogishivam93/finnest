// src/components/AddAssetModal.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void; // call after insert so parent can reload
};

export default function AddAssetModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("BANK");
  const [country, setCountry] = useState("Australia");
  const [currency, setCurrency] = useState("AUD");
  const [value, setValue] = useState<number | string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError("Please sign in first.");
      return;
    }
    if (!name) {
      setError("Name is required.");
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("assets").insert({
      name,
      type,
      country,
      currency,
      current_value:
        typeof value === "string" ? Number(value || 0) : Number(value || 0),
      notes,
      owner_id: userId, // IMPORTANT: matches your column
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    // reset + close
    setName("");
    setType("BANK");
    setCountry("Australia");
    setCurrency("AUD");
    setValue("");
    setNotes("");
    onClose();
    onCreated?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => (!saving ? onClose() : null)}
      />
      {/* modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Add Asset</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="Savings Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>BANK</option>
                <option>INVESTMENT</option>
                <option>CRYPTO</option>
                <option>PROPERTY</option>
                <option>OTHER</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="Australia"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="AUD"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Current Value</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2"
              rows={3}
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
