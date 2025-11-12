// src/app/advisors/page.tsx
import AdvisorsTable from "@/components/AdvisorsTable";
import RequireAuth from "@/components/RequireAuth";

export default function AdvisorsPage() {
  return (
    <RequireAuth>
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Advisors</h1>
        <AdvisorsTable />
      </main>
    </RequireAuth>
  );
}
