// src/app/assets/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AssetCardGrid from "@/components/AssetCardGrid";
import AssetDetailsModal from "@/components/AssetDetailsModal";
import RequireAuth from "@/components/RequireAuth";

export default function AssetsPage() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <Suspense fallback={<div className="rounded-2xl border p-6 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">Loading…</div>}>
          <AssetsClient />
        </Suspense>
      </div>
    </RequireAuth>
  );
}

function AssetsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const idFromQuery = useMemo(() => {
    const raw = search?.get("id");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? (n as number) : null;
  }, [search]);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (idFromQuery !== null) setSelectedId(idFromQuery);
  }, [idFromQuery]);

  const openWithQuery = useCallback(
    (id: number) => {
      setSelectedId(id);
      const params = new URLSearchParams(search?.toString());
      params.set("id", String(id));
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, search]
  );

  const closeModal = useCallback(() => {
    setSelectedId(null);
    const params = new URLSearchParams(search?.toString());
    params.delete("id");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, search]);

  return (
    <>
      <AssetCardGrid limit={null} title="Your Assets" onView={openWithQuery} />
      {selectedId !== null ? (
        <AssetDetailsModal id={selectedId} onClose={closeModal} />
      ) : null}
    </>
  );
}
