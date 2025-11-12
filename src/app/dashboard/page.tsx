"use client";

import { useState } from "react";
import ActionBar from "@/components/ActionBar";
import ChartsCard from "@/components/ChartsCard";
import AssetCardGrid from "@/components/AssetCardGrid";
import FxProvidersCard from "@/components/FxProvidersCard";
import InsightsPanel from "@/components/InsightsPanel";
import DashboardShell from "@/components/DashboardShell";
import RequireAuth from "@/components/RequireAuth";
import AssetDetailsModal from "@/components/AssetDetailsModal";

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <RequireAuth>
      <DashboardShell>
        <div className="space-y-6">
          <ActionBar />

        {/* Charts at the top (full width) */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Financial Overview</h2>
          <ChartsCard />
        </section>

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
    </RequireAuth>
  );
}
