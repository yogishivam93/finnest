"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUID } from "@/lib/auth";
import InsuranceModal from "@/components/InsuranceModal";
import PolicyDocumentsModal from "@/components/PolicyDocumentsModal";

type Row = {
  id: number;
  owner_id: string | null;
  type: string | null;
  provider: string | null;
  policy_number: string | null;
  premium: number | null;
  deductible: number | null;
  end_date: string | null;
};

export default function InsuranceTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsFor, setDocsFor] = useState<number | null>(null);
  const [docCounts, setDocCounts] = useState<Record<number, number>>({});
  const [showOnlyDue, setShowOnlyDue] = useState(false);

  async function load() {
    setLoading(true);
    const uid = await getCurrentUID();
    const q = supabase
      .from("insurance_policies")
      .select("id,owner_id,type,provider,policy_number,premium,deductible,end_date")
      .order("end_date", { ascending: true })
      .order("id", { ascending: false });
    const { data } = uid ? await q.eq("owner_id", uid) : await q;
    setRows((data ?? []) as Row[]);
    try {
      const ids = (data ?? []).map((r: any) => r.id).filter(Boolean);
      if (ids.length) {
        const { data: links } = await supabase
          .from("insurance_policy_documents")
          .select("policy_id")
          .in("policy_id", ids as any);
        const counts: Record<number, number> = {};
        (links ?? []).forEach((l: any) => {
          const k = Number(l.policy_id);
          if (!Number.isNaN(k)) counts[k] = (counts[k] ?? 0) + 1;
        });
        setDocCounts(counts);
      } else setDocCounts({});
    } catch {
      setDocCounts({});
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this policy?")) return;
    const { error } = await supabase.from("insurance_policies").delete().eq("id", id);
    if (error) alert(error.message);
    await load();
  }

  function daysUntil(d?: string | null) {
    if (!d) return null;
    const today = new Date();
    const end = new Date(d);
    // Clear time to avoid TZ off-by-one
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffMs = end.getTime() - today.getTime();
    return Math.round(diffMs / 86400000); // days
  }

  const visibleRows = showOnlyDue
    ? rows.filter((r) => {
        const d = daysUntil(r.end_date);
        return d !== null && d <= 30; // due within 30 days or overdue
      })
    : rows;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-slate-200">Insurance</h3>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
            <input type="checkbox" className="accent-blue-600" checked={showOnlyDue} onChange={(e) => setShowOnlyDue(e.target.checked)} />
            Due in 30 days
          </label>
          <button
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + Add Policy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No insurance yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Provider</th>
                <th className="px-4 py-2">Policy #</th>
                <th className="px-4 py-2">Premium</th>
                <th className="px-4 py-2">Deductible</th>
                <th className="px-4 py-2">Renewal</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Docs</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => {
                const d = daysUntil(r.end_date);
                const status = d === null
                  ? { label: "—", className: "text-gray-500" }
                  : d < 0
                  ? { label: `Overdue ${Math.abs(d)}d`, className: "text-red-600" }
                  : d <= 7
                  ? { label: `${d}d`, className: "text-amber-600" }
                  : d <= 30
                  ? { label: `${d}d`, className: "text-emerald-600" }
                  : { label: `${d}d`, className: "text-gray-500" };
                return (
                <tr key={r.id} className="border-b last:border-b-0 dark:border-slate-800">
                  <td className="px-4 py-2">{r.type || "-"}</td>
                  <td className="px-4 py-2">{r.provider || "-"}</td>
                  <td className="px-4 py-2">{r.policy_number || "-"}</td>
                  <td className="px-4 py-2">{r.premium ? `$${new Intl.NumberFormat().format(r.premium)}` : "-"}</td>
                  <td className="px-4 py-2">{r.deductible ? `$${new Intl.NumberFormat().format(r.deductible)}` : "-"}</td>
                  <td className="px-4 py-2">{r.end_date ? new Date(r.end_date).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${
                      status.className.includes("red")
                        ? "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20"
                        : status.className.includes("amber")
                        ? "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20"
                        : status.className.includes("emerald")
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/20"
                        : "border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-800"
                    } ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-2">{docCounts[r.id] ? docCounts[r.id] : 0}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={() => {
                          setDocsFor(r.id);
                          setDocsOpen(true);
                        }}
                      >
                        Docs
                      </button>
                      <button
                        className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={() => {
                          setEditing(r);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={() => remove(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}

      <InsuranceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing as any}
        onSaved={load}
      />
      {docsFor !== null && (
        <PolicyDocumentsModal
          open={docsOpen}
          policyId={docsFor}
          onClose={() => {
            setDocsOpen(false);
            setDocsFor(null);
            load();
          }}
        />
      )}
    </section>
  );
}
