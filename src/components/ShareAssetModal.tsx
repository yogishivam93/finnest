"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  assetName?: string;
  shareUrl: string;
};

export default function ShareAssetModal({ open, onClose, assetName, shareUrl }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // optional toast could be added here
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Share Asset</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
            Close
          </button>
        </div>
        <p className="mb-3 text-sm text-gray-600">
          Create a temporary link to share {assetName ? <span className="font-medium">{assetName}</span> : "this asset"}.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-md border px-3 py-2 text-sm text-gray-700"
            aria-label="Share link"
          />
          <button onClick={copy} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
            Copy
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Note: This is a placeholder link for demo purposes.</p>
      </div>
    </div>
  );
}

