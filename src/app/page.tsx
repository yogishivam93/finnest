"use client";

import ActionBar from "@/components/ActionBar";
import ChartsCard from "@/components/ChartsCard";
import SummaryCards from "@/components/SummaryCards";
import CleanAssetCards from "@/components/CleanAssetCards";
import FxProvidersCard from "@/components/FxProvidersCard";

export default function Home() {
  return (
    <main className="p-6 space-y-8 bg-gray-50/60">
      <ActionBar />

      {/* Charts row: single card with two charts inside */}
      <div className="grid grid-cols-1 gap-6">
        <ChartsCard title="Financial Overview" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-6">
        <SummaryCards />
      </div>

      {/* Recent assets list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Your Assets</h2>
        <CleanAssetCards />
      </div>

      {/* FX Rate Comparison under assets */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">FX Rate Comparison</h2>
        <FxProvidersCard />
      </div>
    </main>
  );
}
