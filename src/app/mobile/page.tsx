"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ActionBar from "@/components/ActionBar";
import ChartsCard from "@/components/ChartsCard";
import AssetCards from "@/components/AssetCards";
import InsightsPanel from "@/components/InsightsPanel";
import RequireAuth from "@/components/RequireAuth";

export default function MobileDashboardPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 px-2 pb-20">
        <div className="mx-auto flex max-w-xl flex-col gap-6 px-3 py-6 sm:px-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <ActionBar />
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Financial overview</h2>
              <span className="text-xs text-slate-500">Updated live</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ChartsCard />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent assets</h2>
              <Link href="/add-asset" className="text-sm font-medium text-blue-600 hover:underline">
                + Add
              </Link>
            </div>
            <AssetCards />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Insights</h2>
              <Link href="/insights" className="text-sm font-medium text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <InsightsPanel />
            </div>
          </section>
        </div>

        <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-lg">
          <Link href="/settings" className="font-semibold text-slate-700 hover:text-slate-900">
            Settings
          </Link>
          <span className="text-slate-400">|</span>
          <Link href="/support" className="font-semibold text-blue-600 hover:text-blue-800">
            Support
          </Link>
        </div>
      </div>
    </RequireAuth>
  );
}
