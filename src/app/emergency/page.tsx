"use client";

import InsuranceTable from "@/components/InsuranceTable";
import EmergencyContactsTable from "@/components/EmergencyContactsTable";

export default function EmergencyBinderPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Emergency Binder</h1>
      <p className="text-sm text-gray-500 dark:text-slate-400">Key information your family needs in an emergency.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InsuranceTable />
        <EmergencyContactsTable />
      </div>
    </div>
  );
}

