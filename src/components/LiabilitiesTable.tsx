"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Liability = {
  id: number;
  type: string | null;
  description: string | null;
  currency: string | null;
  current_value: number | null;
};

export default function LiabilitiesTable() {
  const [liabs, setLiabs] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState({
    type: "",
    description: "",
    currency: "AUD",
    current_value: "",
  });

  async function loadLiabilities() {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    const q = supabase
      .from("liabilities")
      .select("id,type,description,currency,current_value")
      .order("id", { ascending: false });

    const { data, error } = uid ? await q.eq("owner_id", uid) : await q;
    if (!error && data) setLiabs(data as Liability[]);
    setLoading(false);
  }

  async function addLiability() {
    if (!newRow.type || !newRow.current_value)
      return alert("Fill all required fields!");
    const { error } = await supabase.from("liabilities").insert([
      {
        type: newRow.type,
        description: newRow.description || null,
        currency: newRow.currency || null,
        current_value: Number(newRow.current_value),
      },
    ]);
    if (error) alert(error.message);
    else {
      setNewRow({ type: "", description: "", currency: "AUD", current_value: "" });
      loadLiabilities();
    }
  }

  async function deleteLiability(id: number) {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("liabilities").delete().eq("id", id);
    if (error) alert(error.message);
    else loadLiabilities();
  }

  useEffect(() => {
    loadLiabilities();

    const ch = supabase
      .channel("liabilities-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "liabilities" },
        () => {
          loadLiabilities();
          return null; // satisfy React types
        }
      );

    // ✅ subscribe WITHOUT .catch()
    ch.subscribe((_status) => {});

    // ✅ cleanup
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Liabilities</h2>
        <button
          onClick={addLiability}
          className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Input Row */}
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <input
          className="rounded-md border px-2 py-1 text-sm"
          placeholder="Type (Loan, Credit...)"
          value={newRow.type}
          onChange={(e) => setNewRow({ ...newRow, type: e.target.value })}
        />
        <input
          className="rounded-md border px-2 py-1 text-sm"
          placeholder="Description"
          value={newRow.description}
          onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
        />
        <input
          className="rounded-md border px-2 py-1 text-sm"
          placeholder="Currency"
          value={newRow.currency}
          onChange={(e) => setNewRow({ ...newRow, currency: e.target.value })}
        />
        <input
          type="number"
          className="rounded-md border px-2 py-1 text-sm"
          placeholder="Value"
          value={newRow.current_value}
          onChange={(e) => setNewRow({ ...newRow, current_value: e.target.value })}
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : liabs.length === 0 ? (
        <p className="text-sm text-gray-500">No liabilities yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-2">Type</th>
                <th className="p-2">Description</th>
                <th className="p-2">Currency</th>
                <th className="p-2">Value</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {liabs.map((l) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{l.type}</td>
                  <td className="p-2">{l.description}</td>
                  <td className="p-2">{l.currency}</td>
                  <td className="p-2">{l.current_value?.toLocaleString()}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => deleteLiability(l.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
