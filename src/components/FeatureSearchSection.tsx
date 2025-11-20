"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FeatureSearchSection() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSubmit = () => {
    if (!search.trim()) return;
    router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Search across features</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Look up assets, liabilities, emergency contacts, documents, insurance policies, and other
            records with a single keyword. The search will take you to the relevant table so you can
            act quickly.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          className="flex-1 min-w-0 rounded-md border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:border-slate-700"
          placeholder="Search by name, type, institution, currency, document, or keyword…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
        >
          Search
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-slate-400">
        This search is informational. Press “Search” to open the Assets page pre-filtered with your
        keyword before navigating elsewhere.
      </div>
    </section>
  );
}
