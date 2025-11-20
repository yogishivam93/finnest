"use client";

import Link from "next/link";
import ActionBar from "@/components/ActionBar";
import ChartsCard from "@/components/ChartsCard";
import AssetCards from "@/components/AssetCards";
import InsightsPanel from "@/components/InsightsPanel";
import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/RequireAuth";

export default function MobileDashboardPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50">
        <DashboardShell>
          <div className="space-y-6 pb-20">
            <div className="sticky left-0 top-0 z-10 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">FinNest Mobile</p>
                  <h1 className="text-lg font-semibold text-slate-900">Daily snapshot</h1>
                </div>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Full dashboard
                </Link>
              </div>
            </div>

            <ActionBar />

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
        </DashboardShell>

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
