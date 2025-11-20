"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Briefcase, MinusCircle } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";
import AddAssetModal from "@/components/AddAssetModal";
import ShareAssetsModal from "@/components/ShareAssetsModal";
import AddLiabilityModal from "@/components/AddLiabilityModal";

export default function ActionBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openLiab, setOpenLiab] = useState(false);
  const [shareOpen, setShareOpen] = useState<null | "beneficiary" | "advisor">(null);

  return (
    <div className="mb-6 space-y-3">
      {/* Top row: title + subtitle with currency on the right */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Owner Dashboard</h2>
          <p className="text-sm text-gray-500">Manage and monitor your assets and beneficiaries</p>
        </div>
        <div>
          <CurrencySelector />
        </div>
      </div>

      {/* Toolbar row: match Figma ordering */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} /> Add Asset
        </button>

        <button
          onClick={() => setOpenLiab(true)}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
        >
          <MinusCircle size={16} /> Add Liability
        </button>

        <button
          onClick={() => setShareOpen("beneficiary")}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <Users size={16} /> Share with Beneficiary
        </button>

        <button
          onClick={() => setShareOpen("advisor")}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <Briefcase size={16} /> Share with Advisor
        </button>
      </div>

      <AddAssetModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          router.refresh();
        }}
      />
      <AddLiabilityModal
        open={openLiab}
        onClose={() => setOpenLiab(false)}
        onSaved={() => {
          setOpenLiab(false);
          router.refresh();
        }}
      />
      <ShareAssetsModal
        open={shareOpen !== null}
        initialTab={shareOpen ?? undefined}
        onClose={() => setShareOpen(null)}
      />
    </div>
  );
}
