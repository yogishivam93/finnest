"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RequireAuth from "@/components/RequireAuth";

type SearchResultSet<T> = { label: string; items: T[]; href: string; render: (item: T) => ReactNode };

type AssetRow = {
  id: number;
  name: string | null;
  type: string | null;
  currency: string | null;
};

type LiabilityRow = {
  id: number;
  type: string | null;
  description: string | null;
  currency: string | null;
};

type ContactRow = {
  id: number;
  name: string | null;
  relation: string | null;
  phone: string | null;
  email: string | null;
};

type DocumentRow = {
  id: string | null;
  name: string | null;
  asset_id: string | null;
};

type InsuranceRow = {
  id: number;
  type: string | null;
  provider: string | null;
};

function useSearchData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [insurance, setInsurance] = useState<InsuranceRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [assetsRes, liabsRes, contactsRes, docsRes, insuranceRes] = await Promise.all([
        supabase.from("assets").select("id,name,type,currency"),
        supabase.from("liabilities").select("id,type,description,currency"),
        supabase.from("emergency_contacts").select("id,name,relation,phone,email"),
        supabase.from("documents").select("id,name,asset_id"),
        supabase.from("insurance_policies").select("id,type,provider"),
      ]);

      if (cancelled) return;

      if (assetsRes.error || liabsRes.error || contactsRes.error || docsRes.error || insuranceRes.error) {
        setError(
          (assetsRes.error ||
            liabsRes.error ||
            contactsRes.error ||
            docsRes.error ||
            insuranceRes.error)?.message || "Failed to load search data"
        );
      } else {
        setAssets((assetsRes.data ?? []) as AssetRow[]);
        setLiabilities((liabsRes.data ?? []) as LiabilityRow[]);
        setContacts((contactsRes.data ?? []) as ContactRow[]);
        setDocuments((docsRes.data ?? []) as DocumentRow[]);
        setInsurance((insuranceRes.data ?? []) as InsuranceRow[]);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, error, assets, liabilities, contacts, documents, insurance };
}

function matchesTerm(term: string, ...chunks: (string | null | undefined)[]) {
  if (!term) return true;
  const lower = term.toLowerCase();
  return chunks.some((c) => (c ?? "").toLowerCase().includes(lower));
}

function SearchClient() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams?.get("q")?.trim() ?? "";
  const { loading, error, assets, liabilities, contacts, documents, insurance } = useSearchData();

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return {
      assets: assets.filter((asset) =>
        matchesTerm(term, asset.name, asset.type, asset.currency)
      ),
      liabilities: liabilities.filter((liab) =>
        matchesTerm(term, liab.type, liab.description, liab.currency)
      ),
      contacts: contacts.filter((contact) =>
        matchesTerm(term, contact.name, contact.relation, contact.phone, contact.email)
      ),
      documents: documents.filter((doc) =>
        matchesTerm(term, doc.name, doc.asset_id)
      ),
      insurance: insurance.filter((policy) =>
        matchesTerm(term, policy.type, policy.provider)
      ),
    };
  }, [assets, liabilities, contacts, documents, insurance, searchTerm]);

  const sections: SearchResultSet<any>[] = [
    {
      label: "Assets",
      items: filtered.assets.slice(0, 3),
      href: `/assets?q=${encodeURIComponent(searchTerm)}`,
      render: (asset: AssetRow) => (
        <p className="text-sm text-gray-600">
          {asset.name ?? "Unnamed asset"} {asset.type ? `• ${asset.type}` : ""}{" "}
          {asset.currency ? `(${asset.currency})` : ""}
        </p>
      ),
    },
    {
      label: "Liabilities",
      items: filtered.liabilities.slice(0, 3),
      href: `/liabilities?q=${encodeURIComponent(searchTerm)}`,
      render: (liab: LiabilityRow) => (
        <p className="text-sm text-gray-600">
          {liab.type ?? "Liability"} {liab.currency ? `• ${liab.currency}` : ""}{" "}
          {liab.description ? `– ${liab.description}` : ""}
        </p>
      ),
    },
    {
      label: "Emergency contacts",
      items: filtered.contacts.slice(0, 3),
      href: `/emergency?q=${encodeURIComponent(searchTerm)}`,
      render: (contact: ContactRow) => (
        <p className="text-sm text-gray-600">
          {contact.name ?? "Contact"} {contact.relation ? `(${contact.relation})` : ""}{" "}
          {contact.phone ?? contact.email ?? ""}
        </p>
      ),
    },
    {
      label: "Documents",
      items: filtered.documents.slice(0, 3),
      href: `/documents?q=${encodeURIComponent(searchTerm)}`,
      render: (doc: DocumentRow) => (
        <p className="text-sm text-gray-600">{doc.name ?? "Document"}</p>
      ),
    },
    {
      label: "Insurance",
      items: filtered.insurance.slice(0, 3),
      href: `/assets?q=${encodeURIComponent(searchTerm)}`,
      render: (policy: InsuranceRow) => (
        <p className="text-sm text-gray-600">
          {policy.provider ?? "Insurance"} {policy.type ? `• ${policy.type}` : ""}
        </p>
      ),
    },
  ];

  const totalMatches = sections.reduce((sum, sec) => sum + sec.items.length, 0);

  const keywordMap: Record<
    string,
    { title: string; description: string; href: string }
  > = {
    emergency: {
      title: "Emergency contacts",
      description: "Record a trusted contact to reach out to in a crisis.",
      href: "/emergency",
    },
    liability: {
      title: "Liabilities",
      description: "Track loans and credit with the Liabilities table.",
      href: "/liabilities",
    },
    document: {
      title: "Documents",
      description: "Upload files to Document Manager for safekeeping.",
      href: "/documents",
    },
    insurance: {
      title: "Insurance",
      description: "Maintain policy details in the Insurance table.",
      href: "/insurance",
    },
    asset: {
      title: "Assets",
      description: "Add or view holdings in the Assets section.",
      href: "/assets",
    },
  };

  const lowerTerm = searchTerm.toLowerCase();
  const keywordSuggestions = Object.entries(keywordMap)
    .filter(([key]) => lowerTerm.includes(key))
    .map(([_, value]) => value);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Search results</h1>
        <p className="text-sm text-gray-500">
          Showing matches for <strong>{searchTerm || "all records"}</strong>.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          The search inspects multiple feature sets—assets, liabilities, contacts, documents, and insurance summaries.
        </p>
      </div>
      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading data...
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-red-600 dark:border-slate-800 dark:bg-slate-900">
          {error}
        </div>
      ) : (
        <>
          {totalMatches === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              No matches yet. Refine your keyword or add new records.
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.label} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">{section.label}</h2>
                  <Link
                    href={section.href}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    View all
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {section.items.length === 0 ? (
                    <p className="text-sm text-gray-500">No matches.</p>
                  ) : (
                    section.items.map((item) => (
                      <div
                        key={section.label + JSON.stringify(item)}
                        className="rounded-lg border px-3 py-2 text-sm text-gray-700 dark:border-slate-800 dark:text-slate-100"
                      >
                        {section.render(item)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
          {keywordSuggestions.length > 0 && (
            <div className="rounded-2xl border bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-700/70 dark:bg-yellow-900/20 dark:text-yellow-100">
              <p className="font-semibold">Suggested actions</p>
              <ul className="mt-2 space-y-2 text-xs">
                {keywordSuggestions.map((suggestion) => (
                  <li key={suggestion.title}>
                    <Link
                      href={suggestion.href}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {suggestion.title}
                    </Link>
                    <span className="ml-1 text-gray-600 dark:text-slate-400">
                      {suggestion.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function SearchPage() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <SearchClient />
      </div>
    </RequireAuth>
  );
}
