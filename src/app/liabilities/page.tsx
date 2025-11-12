import LiabilitiesTable from "@/components/LiabilitiesTable";
import RequireAuth from "@/components/RequireAuth";

export default function LiabilitiesPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        <h1 className="text-lg font-semibold">Liabilities</h1>
        <LiabilitiesTable />
      </div>
    </RequireAuth>
  );
}
