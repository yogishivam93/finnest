"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AssetPayload = {
  name: string;
  type: string;
  country: string;
  currency: string;
  current_value: number;
};

const currencies = ["AUD", "USD", "INR", "EUR", "GBP", "NZD"];
const assetTypes = ["PROPERTY", "BANK", "INVESTMENT", "CRYPTO", "OTHER"];

export default function AddAssetForm() {
  const router = useRouter();
  const [form, setForm] = useState<AssetPayload>({
    name: "",
    type: "BANK",
    country: "",
    currency: "AUD",
    current_value: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onChange<K extends keyof AssetPayload>(key: K, value: AssetPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // very light validation
    if (!form.name.trim()) return setError("Please enter a name.");
    if (!form.country.trim()) return setError("Please enter a country.");
    if (!form.currency) return setError("Please select a currency.");
    if (form.current_value < 0) return setError("Value cannot be negative.");

    setSubmitting(true);
    try {
      // optional: attach current user as owner_id if you use auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertErr } = await supabase.from("assets").insert([
        {
          name: form.name.trim(),
          type: form.type,
          country: form.country.trim(),
          currency: form.currency,
          current_value: form.current_value,
          owner_id: user?.id ?? null,
        },
      ]);

      if (insertErr) throw insertErr;

      // success → back to dashboard
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add asset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Asset name</label>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
          placeholder="e.g., Savings Account"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => onChange("type", e.target.value as AssetPayload["type"])}
          >
            {assetTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Country</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g., Australia"
            value={form.country}
            onChange={(e) => onChange("country", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Currency</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.currency}
            onChange={(e) => onChange("currency", e.target.value as AssetPayload["currency"])}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Current value</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            min={0}
            step="0.01"
            value={form.current_value}
            onChange={(e) => onChange("current_value", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save Asset"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
