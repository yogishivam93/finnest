import BeneficiariesTable from "@/components/BeneficiariesTable";
import RequireAuth from "@/components/RequireAuth";

export default function BeneficiariesPage() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Beneficiaries</h1>
        <BeneficiariesTable />
      </div>
    </RequireAuth>
  );
}
