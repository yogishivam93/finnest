"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Advisor } from "@/types/advisor";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  advisor?: Advisor | null;
};

export default function AdvisorModal({ open, onClose, onSaved, advisor }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!advisor) {
      setName("");
      setEmail("");
      setCompany("");
      return;
    }
    setName(advisor.name ?? "");
    setEmail(advisor.email ?? "");
    setCompany(advisor.company ?? "");
  }, [advisor]);

  if (!open) return null;

  async function save() {
    try {
      setSaving(true);
      setError(null);
      const { data: u } = await supabase.auth.getUser();
      const owner_id = u?.user?.id ?? null;
      if (advisor?.id) {
        const { error } = await supabase
          .from("advisors")
          .update({ name, email, company })
          .eq("id", advisor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("advisors")
          .insert([{ name, email, company, owner_id }]);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save advisor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{advisor ? "Edit Advisor" : "Add Advisor"}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">Close</button>
        </div>
        {error && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="space-y-2">
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

