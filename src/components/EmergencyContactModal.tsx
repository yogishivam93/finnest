"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUID } from "@/lib/auth";

type Contact = {
  id?: number;
  name: string;
  relation: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export default function EmergencyContactModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Contact | null;
  onSaved?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Contact>({
    name: "",
    relation: null,
    phone: null,
    email: null,
    address: null,
    notes: null,
  });

  if (!open) return null;

  async function onSubmit() {
    setSaving(true);
    try {
      const owner = await getCurrentUID();
      const payload: any = { ...form, owner_id: owner ?? null };
      if (initial?.id) {
        const { error } = await supabase.from("emergency_contacts").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("emergency_contacts").insert([payload]);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Failed to save contact");
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
      <div className="relative z-10 w-[min(96vw,680px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{initial?.id ? "Edit Contact" : "Add Contact"}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Add family/emergency contact</p>
          </div>
          <button className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Name">
              <input className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Input>
          </div>
          <Input label="Relation">
            <input className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={form.relation ?? ""} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} />
          </Input>
          <Input label="Phone">
            <input className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Input>
          <Input label="Email">
            <input className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Input>
          <div className="md:col-span-2">
            <Input label="Address">
              <input className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </Input>
          </div>
          <div className="md:col-span-2">
            <Input label="Notes">
              <textarea rows={3} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
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

