"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Home, RefreshCw, ShieldCheck, Users } from "lucide-react";
import ActionBar from "@/components/ActionBar";
import ChartsCard from "@/components/ChartsCard";
import AssetCards from "@/components/AssetCards";
import InsightsPanel from "@/components/InsightsPanel";
import RequireAuth from "@/components/RequireAuth";

const quickNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/insurance", label: "Insurance", icon: ShieldCheck },
  { href: "/beneficiaries", label: "Beneficiaries", icon: Users },
  { href: "/locker", label: "Locker", icon: FileText },
];

export default function MobileDashboardPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50 px-2 pb-20">
        <div className="mx-auto flex max-w-xl flex-col gap-6 px-3 py-6 sm:px-4">
          <div className="sticky top-3 z-10 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">FinNest Mobile</p>
                <h1 className="text-lg font-semibold text-slate-900">Daily snapshot</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.refresh()}
                  className="hidden rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 sm:inline-flex"
                >
                  Refresh
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Full dashboard
                </Link>
              </div>
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Quick navigation</h2>
                <button
                  onClick={() => router.refresh()}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 sm:hidden"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
            </div>
            <div className="grid gap-3">
              {quickNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-blue-400"
                  >
                    <Icon size={18} className="text-slate-500" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>

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
