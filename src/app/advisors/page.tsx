// src/app/advisors/page.tsx
import AdvisorsTable from "@/components/AdvisorsTable";

export default function AdvisorsPage() {
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Advisors</h1>
      <AdvisorsTable />
    </main>
  );
}
