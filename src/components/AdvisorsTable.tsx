"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Advisor } from "@/types/advisor";
import AdvisorModal from "@/components/AdvisorModal";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdvisorsTable() {
  const [rows, setRows] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Advisor | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      const q = supabase.from("advisors").select("id,name,email,company,created_at").order("name", { ascending: true });
      const { data, error } = uid ? await q.eq("owner_id", uid) : await q;
      if (error) throw error;
      setRows((data ?? []) as Advisor[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load advisors");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("advisors-ui")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "advisors" },
        () => load()
      );
    // Subscribe without returning a promise from the effect cleanup
    ch.subscribe(() => {});
    return () => {
      void supabase.removeChannel(ch);
    };
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this advisor?")) return;
    const { error } = await supabase.from("advisors").delete().eq("id", id);
    if (error) alert(error.message);
  }

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Advisors</h2>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Advisor
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No advisors yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Company</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">{r.company}</td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => { setEditing(r); setOpen(true); }}>
                        <Pencil size={16} />
                      </button>
                      <button className="text-red-500 hover:text-red-700" onClick={() => remove(r.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdvisorModal open={open} onClose={() => setOpen(false)} onSaved={load} advisor={editing} />
    </section>
  );
}
