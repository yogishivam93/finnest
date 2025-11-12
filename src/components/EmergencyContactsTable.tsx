"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUID } from "@/lib/auth";
import EmergencyContactModal from "@/components/EmergencyContactModal";

type Row = {
  id: number;
  owner_id: string | null;
  name: string;
  relation: string | null;
  phone: string | null;
  email: string | null;
};

export default function EmergencyContactsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  async function load() {
    setLoading(true);
    const uid = await getCurrentUID();
    const q = supabase
      .from("emergency_contacts")
      .select("id,owner_id,name,relation,phone,email")
      .order("name", { ascending: true });
    const { data } = uid ? await q.eq("owner_id", uid) : await q;
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this contact?")) return;
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) alert(error.message);
    await load();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-slate-200">Emergency Contacts</h3>
        <button
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Add Contact
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">No contacts yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Relation</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0 dark:border-slate-800">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.relation || "-"}</td>
                  <td className="px-4 py-2">{r.phone || "-"}</td>
                  <td className="px-4 py-2">{r.email || "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => { setEditing(r); setOpen(true); }}>Edit</button>
                      <button className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => remove(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmergencyContactModal open={open} onClose={() => setOpen(false)} initial={editing as any} onSaved={load} />
    </section>
  );
}

