"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUID } from "@/lib/auth";

type Doc = {
  id: string;
  name: string | null;
  path: string | null;
  content_type: string | null;
  created_at: string | null;
};

export default function PolicyDocumentsModal({
  open,
  policyId,
  onClose,
}: {
  open: boolean;
  policyId: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const uid = await getCurrentUID();
      const { data: allDocs } = await supabase
        .from("documents")
        .select("id,name,path,content_type,created_at")
        .order("created_at", { ascending: false })
        .eq("owner_id", uid ?? "");
      const { data: links } = await supabase
        .from("insurance_policy_documents")
        .select("document_id")
        .eq("policy_id", policyId);
      if (!cancelled) {
        setDocs((allDocs ?? []) as Doc[]);
        const s = new Set<string>();
        (links ?? []).forEach((l: any) => s.add(String(l.document_id)));
        setSelected(s);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, policyId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  async function onSave() {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("insurance_policy_documents")
        .select("document_id")
        .eq("policy_id", policyId);
      const current = new Set<string>((existing ?? []).map((e: any) => String(e.document_id)));
      const desired = selected;

      const toAdd: string[] = [];
      desired.forEach((id) => {
        if (!current.has(id)) toAdd.push(id);
      });
      const toRemove: string[] = [];
      current.forEach((id) => {
        if (!desired.has(id)) toRemove.push(id);
      });

      if (toAdd.length) {
        const payload = toAdd.map((document_id) => ({ policy_id: policyId, document_id }));
        const { error } = await supabase.from("insurance_policy_documents").insert(payload as any);
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase
          .from("insurance_policy_documents")
          .delete()
          .eq("policy_id", policyId)
          .in("document_id", toRemove as any);
        if (error) throw error;
      }
      onClose();
    } catch (e: any) {
      alert(e?.message || "Failed to update links");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[min(96vw,760px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">Link Documents</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Select documents to associate with this policy</p>
          </div>
          <button className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading...</div>
        ) : (
          <div className="max-h-[50vh] overflow-auto rounded-xl border border-gray-100 p-2 dark:border-slate-800">
            {docs.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-slate-400">No documents found.</div>
            ) : (
              <ul className="divide-y dark:divide-slate-800">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 p-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={selected.has(d.id)}
                        onChange={() => toggle(d.id)}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{d.name || d.path || d.id}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {(d.content_type || "").toLowerCase()} • {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

