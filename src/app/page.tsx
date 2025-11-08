// src/app/page.tsx
import SummaryCards from "@/components/SummaryCards";
import AssetsTable from "@/components/AssetsTable";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Live summary from your Supabase rows */}
      <SummaryCards />

      {/* Assets table (with + Add Asset) */}
      <AssetsTable />
    </div>
  );
}
