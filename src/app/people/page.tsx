// src/app/people/page.tsx
import BeneficiariesTable from "@/components/BeneficiariesTable";
import AdvisorsTable from "@/components/AdvisorsTable";
import RequireAuth from "@/components/RequireAuth";

export default function PeoplePage() {
  return (
    <RequireAuth>
      <main className="space-y-6 p-6">
        <h1 className="text-2xl font-semibold">People</h1>
        <p className="text-sm text-gray-600">Manage beneficiaries and professional advisors.</p>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <BeneficiariesTable />
          </div>
          <div>
            <AdvisorsTable />
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
