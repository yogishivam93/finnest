"use client";

import RequireAuth from "@/components/RequireAuth";
import DocumentManager from "@/components/DocumentManager";

export default function LockerPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="mb-2 text-xl font-semibold">Secure Document Locker</h1>
        <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
          Store important files securely and link them to your assets.
        </p>
        <DocumentManager />
      </div>
    </RequireAuth>
  );
}

