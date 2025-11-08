// src/components/AssetsTable.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AddAssetModal from "./AddAssetModal";

export type Asset = {
  id: string;
  name: string | null;
  type: string | null;
  country: string | null;
  currency: string | null;
  current_value: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  owner_id: string | null;
};

export default function AssetsTable() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    setEmail(user?.email ?? null);

    if (!user) {
      setAssets(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("assets")
      .select(
        "id,name,type,country,currency,current_value,notes,created_at,updated_at,owner_id"
      )
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      setAssets([]);
    } else {
      setAssets((data ?? []) as Asset[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();

    // realtime updates
    const channel = supabase
      .channel("assets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Loading assets…</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-700">
          Please <a className="underline" href="/login">sign in</a> to view and add assets.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Assets</h2>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            + Add Asset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Country</th>
                <th className="py-2 pr-4">Currency</th>
                <th className="py-2 pr-4">Current Value</th>
                <th className="py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {assets && assets.length > 0 ? (
                assets.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2 pr-4">{a.name ?? "—"}</td>
                    <td className="py-2 pr-4">{a.type ?? "—"}</td>
                    <td className="py-2 pr-4">{a.country ?? "—"}</td>
                    <td className="py-2 pr-4">{a.currency ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {a.current_value !== null
                        ? a.current_value.toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2">
                      {a.updated_at
                        ? new Date(a.updated_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t">
                  <td className="py-2 text-gray-500" colSpan={6}>
                    No assets yet — click “+ Add Asset”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddAssetModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => load()}
      />
    </>
  );
}
