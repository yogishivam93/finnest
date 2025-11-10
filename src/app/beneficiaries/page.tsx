import BeneficiariesTable from "@/components/BeneficiariesTable";

export default function BeneficiariesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Beneficiaries</h1>
      <BeneficiariesTable />
    </div>
  );
}