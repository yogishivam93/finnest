// src/components/FxRateModal.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { FxRate } from "@/types/fx";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: FxRate | null;   // if provided => edit mode
  onSaved?: () => void;      // reload callback
};

export default function FxRateModal({ open, onClose, initial, onSaved }: Props) {
  const isEdit = Boolean(initial?.id);
  const [base, setBase] = useState(initial?.base ?? "USD");
  const [quote, setQuote] = useState(initial?.quote ?? "AUD");
  const [rate, setRate] = useState<string>(initial?.rate?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBase(initial?.base ?? "USD");
      setQuote(initial?.quote ?? "AUD");
      setRate(initial?.rate != null ? String(initial.rate) : "");
      setError(null);
      setSaving(false);
    }
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const r = Number(rate);
    if (!base || !quote || !isFinite(r) || r <= 0) {
      setError("Please enter valid currencies and a positive rate.");
      return;
    }
    if (base.toUpperCase() === quote.toUpperCase()) {
      setError("Base and quote must be different.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && initial?.id != null) {
        const { error } = await supabase
          .from("fx_rates")
          .update({ base, quote, rate: r, updated_at: new Date().toISOString() })
          .eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fx_rates")
          .insert({ base, quote, rate: r, updated_at: new Date().toISOString() });
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => (!saving ? onClose() : null)} />
      {/* modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">{isEdit ? "Edit FX Rate" : "Add FX Rate"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Base (from)</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="USD"
                value={base}
                onChange={(e) => setBase(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Quote (to)</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="AUD"
                value={quote}
                onChange={(e) => setQuote(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Rate</label>
            <input
              type="number"
              step="0.0001"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="1.5000"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
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
              {saving ? "Saving…" : (isEdit ? "Save Changes" : "Add Rate")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
