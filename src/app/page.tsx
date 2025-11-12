"use client";

import { useState } from "react";
import ActionBar from "@/components/ActionBar";
import ChartsCard from "@/components/ChartsCard";
import AssetCardGrid from "@/components/AssetCardGrid";
import FxProvidersCard from "@/components/FxProvidersCard";
import InsightsPanel from "@/components/InsightsPanel";
import DashboardShell from "@/components/DashboardShell";
import AssetDetailsModal from "@/components/AssetDetailsModal";

export default function Home() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <DashboardShell>
      <div className="space-y-6">
        <ActionBar />

        {/* Charts at the top (full width) */}
        <ChartsCard title="Financial Overview" />


        {/* Your Assets section (cards only on dashboard) */}
        <AssetCardGrid onView={(id) => setSelectedId(id)} />

        {/* Bottom row: FX (left) + AI Insights (right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FxProvidersCard />
          <InsightsPanel />
        </div>

        {selectedId !== null ? (
          <AssetDetailsModal id={selectedId} onClose={() => setSelectedId(null)} />
        ) : null}
      </div>
    </DashboardShell>
  );
}
