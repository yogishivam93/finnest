"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ShareAssetModal from "@/components/ShareAssetModal";

type Row = {
  id: string;
  name?: string;
  type?: string;
  country?: string;
  currency?: string;
  current_value?: number;
  created_at?: string;
};

export default function CleanAssetCards() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFor, setShareFor] = useState<Row | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("assets")
        .select("id,name,type,country,currency,current_value,created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) console.error(error);
      if (isMounted) {
        setRows(data ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Recent Assets</h3>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
              <div className="mt-2 h-3 w-40 animate-pulse rounded bg-gray-100" />
              <div className="mt-1 h-3 w-28 animate-pulse rounded bg-gray-100" />
              <div className="mt-3 h-7 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No assets yet. Click <span className="font-medium">+ Add Asset</span> to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{a.name || a.type || "Asset"}</p>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  0% Complete
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>
                  {a.type ?? "—"} · {a.country ?? "—"} · {a.currency ?? "—"}
                </p>
                <p className="mt-1">
                  Current value:{" "}
                  <span className="font-semibold">
                    ${new Intl.NumberFormat().format(Number(a.current_value || 0))}
                  </span>
                </p>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                  onClick={() => router.push("/assets")}
                >
                  View
                </button>
                <button
                  className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50"
                  onClick={() => {
                    setShareFor(a);
                    setShareOpen(true);
                  }}
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShareAssetModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        assetName={shareFor?.name || shareFor?.type}
        shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/assets?id=${shareFor?.id ?? ""}`}
      />
    </section>
  );
}

