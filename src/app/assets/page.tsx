// src/app/assets/page.tsx
import AssetsTable from "@/components/AssetsTable";

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Assets</h1>
      <AssetsTable />
    </div>
  );
}
