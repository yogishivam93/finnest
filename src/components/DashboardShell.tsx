"use client";

import React from "react";
import ChartsCard from "./ChartsCard";
import FxProvidersCard from "./FxProvidersCard";
import SummaryCards from "./SummaryCards";
import AssetCards from "./AssetCards";

// Simple wrapper component with a title
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}

export default function DashboardShell() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <SummaryCards />

      {/* Charts Row (Aligned Side by Side) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Section title="Financial Overview">
          <ChartsCard />
        </Section>
      </div>

      {/* Assets + FX Comparison Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Section title="FX Rate Comparison">
          <FxProvidersCard />
        </Section>

        <div className="md:col-span-2">
          <Section title="Your Assets">
            <AssetCards />
          </Section>
        </div>
      </div>
    </div>
  );
}
