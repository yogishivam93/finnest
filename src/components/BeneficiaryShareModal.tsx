"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BeneficiaryShareModal({ open, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/?share=beneficiary`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Share with Beneficiary</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">Close</button>
        </div>
        <p className="mb-3 text-sm text-gray-600">Copy a view-only link to share specific assets with a beneficiary (demo placeholder).</p>
        <div className="flex items-center gap-2">
          <input readOnly value={link} className="flex-1 rounded-md border px-3 py-2 text-sm text-gray-700" />
          <button onClick={copy} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Copy</button>
        </div>
      </div>
    </div>
  );
}

