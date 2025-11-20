"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUID } from "@/lib/auth";

type Policy = {
  id?: number;
  owner_id?: string | null;
  type: string | null;
  provider: string | null;
  policy_number: string | null;
  premium: number | null;
  deductible: number | null;
  start_date: string | null;
  end_date: string | null;
  contact: string | null;
  notes: string | null;
};

export default function InsuranceModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Policy | null;
  onSaved?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const DEFAULT_FORM: Policy = {
    type: null,
    provider: null,
    policy_number: null,
    premium: null,
    deductible: null,
    start_date: null,
    end_date: null,
    contact: null,
    notes: null,
  };

  const [form, setForm] = useState<Policy>(DEFAULT_FORM);
  const providerRef = useRef<HTMLInputElement | null>(null);
  const handleChange = (
    field: keyof Policy,
    value: string | number | null
  ) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...DEFAULT_FORM, ...initial } : DEFAULT_FORM);
    }
  }, [open, initial]);

  if (!open) return null;

  async function onSubmit() {
    setSaving(true);
    try {
      const owner = await getCurrentUID();
      const payload = { ...form, owner_id: owner ?? null } as any;
      if (initial?.id) {
        const { error } = await supabase.from("insurance_policies").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insurance_policies").insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  }

  function Input({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <label className="block">
        <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
        {children}
      </label>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[min(96vw,720px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{initial?.id ? "Edit Policy" : "Add Policy"}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Store key insurance details for your family</p>
          </div>
          <button className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Policy Type">
            <select
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.type ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {[
                "HOME",
                "VEHICLE",
                "LIFE",
                "HEALTH",
                "TRAVEL",
                "OTHER",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Input>
          <Input label="Provider">
            <input
              ref={providerRef}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.provider ?? ""}
              onChange={(e) => handleChange("provider", e.target.value)}
            />
          </Input>
          <Input label="Policy Number">
            <input
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.policy_number ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, policy_number: e.target.value }))}
            />
          </Input>
          <Input label="Premium (annual)">
            <input
              inputMode="decimal"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.premium ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, premium: e.target.value ? Number(e.target.value.replace(/[^0-9.]/g, "")) : null }))}
            />
          </Input>
          <Input label="Deductible/Excess">
            <input
              inputMode="decimal"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.deductible ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, deductible: e.target.value ? Number(e.target.value.replace(/[^0-9.]/g, "")) : null }))}
            />
          </Input>
          <Input label="Start Date">
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.start_date ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </Input>
          <Input label="End / Renewal Date">
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.end_date ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            />
          </Input>
          <div className="md:col-span-2">
            <Input label="Claims Contact">
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={form.contact ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              />
            </Input>
          </div>
          <div className="md:col-span-2">
            <Input label="Notes">
              <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Input>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
