import { Suspense } from "react";
import DocumentManager from "@/components/DocumentManager";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Documents</h1>
      <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
        Upload files and link them to your assets for easy reference.
      </p>
      <Suspense fallback={<div className="rounded-2xl border p-6 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">Loading…</div>}>
        <DocumentManager />
      </Suspense>
    </div>
  );
}
