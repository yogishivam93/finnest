"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyProvider";
import BeneficiaryModal from "@/components/BeneficiaryModal";
import AdvisorModal from "@/components/AdvisorModal";
import type { Advisor } from "@/types/advisor";

type Props = {
  open: boolean;
  onClose: () => void;
  initialTab?: "beneficiary" | "advisor";
};

type AssetRow = { id: number; name: string | null; current_value: number | null; currency: string | null };
type Person = { id: string; name: string | null; email?: string | null };

export default function ShareAssetsModal({
  open,
  onClose,
  initialTab = "beneficiary",
}: Props) {
  const { format, convert } = useCurrency();
  const [tab, setTab] = useState<"beneficiary" | "advisor">(initialTab);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Person[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [permView, setPermView] = useState(true);
  const [permDownload, setPermDownload] = useState(true);
  const [message, setMessage] = useState("");
  const [beneficiaryQuery, setBeneficiaryQuery] = useState("");
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorQuery, setAdvisorQuery] = useState("");
  const [showAddAdvisor, setShowAddAdvisor] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<number | "">("");

  useEffect(() => setTab(initialTab), [initialTab]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;

      const aq = supabase
        .from("assets")
        .select("id,name,current_value,currency")
        .order("id", { ascending: false });
      const { data: a } = uid ? await aq.eq("owner_id", uid) : await aq;
      if (!cancelled) setAssets((a ?? []) as AssetRow[]);

      const bq = supabase.from("beneficiaries").select("id,name,email").order("name", { ascending: true });
        const { data: b } = uid ? await bq.eq("owner_id", uid) : await bq;
        if (!cancelled) setBeneficiaries((b ?? []) as Person[]);

      // Advisors (optional table). If missing, we silently ignore.
      try {
        const aq2 = supabase
          .from("advisors")
          .select("id,name,email")
          .order("name", { ascending: true });
        const { data: adv } = uid ? await aq2.eq("owner_id", uid) : await aq2;
        if (!cancelled) setAdvisors((adv ?? []) as Advisor[]);
      } catch {}
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const totalSelected = useMemo(() => selectedAssetIds.length, [selectedAssetIds]);
  const filteredBeneficiaries = useMemo(() => {
    const q = beneficiaryQuery.trim().toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter((b) => (b.name ?? "").toLowerCase().includes(q));
  }, [beneficiaries, beneficiaryQuery]);

  const filteredAdvisors = useMemo(() => {
    const q = advisorQuery.trim().toLowerCase();
    if (!q) return advisors;
    return advisors.filter(
      (a) => (a.name ?? "").toLowerCase().includes(q) || (a.email ?? "").toLowerCase().includes(q)
    );
  }, [advisors, advisorQuery]);

  function toggleAsset(id: number) {
    setSelectedAssetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function close() {
    onClose();
    // reset lightweight state
    setSelectedAssetIds([]);
    setSelectedBeneficiary("");
    setMessage("");
  }

  const [submitting, setSubmitting] = useState(false);

  async function onShare() {
    try {
      setSubmitting(true);
      const targetEmail =
        tab === "beneficiary"
          ? (beneficiaries.find((x) => x.id === selectedBeneficiary) as any)?.email
          : advisors.find((x) => x.id === selectedAdvisor)?.email;

      const payload = {
        tab,
      beneficiaryId: tab === "beneficiary" ? selectedBeneficiary || null : null,
        advisorId: tab === "advisor" ? selectedAdvisor : null,
        assets: selectedAssetIds,
        permissions: { view: permView, download: permDownload },
        message,
        advisor: tab === "advisor" ? { name: advisorName, email: advisorEmail } : null,
        sendEmail: true,
        email: targetEmail ?? undefined,
      };
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const url: string | undefined = data?.url;
      if (url) {
        try { await navigator.clipboard.writeText(url); } catch {}
        alert("Share link copied to clipboard\n" + url);
      }
      close();
    } catch (e) {
      console.error(e);
      alert("Failed to create share link");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Share Assets</h3>
            <p className="text-sm text-gray-500">Share multiple assets with a {tab === "beneficiary" ? "beneficiary" : "professional advisor"}</p>
          </div>
          <button onClick={close} className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">Close</button>
        </div>

        {/* Tabs */}
        <div className="mb-3 inline-flex rounded-lg border bg-gray-50 p-1 text-sm">
          <button
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 ${tab === "beneficiary" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-white"}`}
            onClick={() => setTab("beneficiary")}
          >
            Beneficiary
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 ${tab === "advisor" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-white"}`}
            onClick={() => setTab("advisor")}
          >
            Professional Advisor
          </button>
        </div>

        <div className="space-y-4">
          {tab === "beneficiary" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium">Select Beneficiary</label>
                <div className="flex items-center gap-2 text-xs">
                  <a href="/beneficiaries" className="text-blue-600 hover:underline">View all</a>
                  <button type="button" className="rounded border px-2 py-1 hover:bg-gray-50" onClick={() => setShowAddBeneficiary(true)}>
                    + Add new
                  </button>
                </div>
              </div>
              <input
                placeholder="Search beneficiary..."
                value={beneficiaryQuery}
                onChange={(e) => setBeneficiaryQuery(e.target.value)}
                className="mb-2 w-full rounded-md border px-3 py-2 text-sm"
              />
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={selectedBeneficiary}
                  onChange={(e) => setSelectedBeneficiary(e.target.value)}
                >
                <option value="">Choose a beneficiary</option>
                {filteredBeneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || `Beneficiary #${b.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {tab === "advisor" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium">Select Advisor</label>
                <div className="flex items-center gap-2 text-xs">
                  <a href="/advisors" className="text-blue-600 hover:underline">View all</a>
                  <button type="button" className="rounded border px-2 py-1 hover:bg-gray-50" onClick={() => setShowAddAdvisor(true)}>
                    + Add new
                  </button>
                </div>
              </div>
              <input
                placeholder="Search advisor by name or email..."
                value={advisorQuery}
                onChange={(e) => setAdvisorQuery(e.target.value)}
                className="mb-2 w-full rounded-md border px-3 py-2 text-sm"
              />
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={selectedAdvisor as any}
                onChange={(e) => setSelectedAdvisor(Number(e.target.value) || "")}
              >
                <option value="">Choose an advisor</option>
                {filteredAdvisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {(a.name || `Advisor #${a.id}`) + (a.email ? ` — ${a.email}` : "")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assets checklist */}
          <div>
            <label className="mb-1 block text-sm font-medium">Select Assets to Share</label>
            <div className="rounded-lg border">
              {assets.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No assets available.</div>
              ) : (
                <ul className="max-h-64 divide-y overflow-auto">
                  {assets.map((a) => {
                    const val = convert(Number(a.current_value) || 0, a.currency);
                    const checked = selectedAssetIds.includes(a.id);
                    return (
                      <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={checked}
                            onChange={() => toggleAsset(a.id)}
                          />
                          <span>{a.name || `Asset #${a.id}`}</span>
                        </label>
                        <span className="text-sm text-gray-600">{format(val)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 text-sm font-medium">Default Access Permissions</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>View Access</span>
                <Switch checked={permView} onChange={setPermView} />
              </div>
              <div className="flex items-center justify-between">
                <span>Download Documents</span>
                <Switch checked={permDownload} onChange={setPermDownload} />
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm font-medium">Message (Optional)</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button onClick={close} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Cancel</button>
          <button
            onClick={onShare}
            disabled={
              submitting ||
              (tab === "beneficiary" && !selectedBeneficiary) ||
              (tab === "advisor" && !selectedAdvisor) ||
              totalSelected === 0
            }
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-blue-700"
          >
            {submitting ? "Sharing..." : "Share Selected Assets"}
          </button>
        </div>
      </div>
      {/* Inline add beneficiary modal */}
      <BeneficiaryModal
        open={showAddBeneficiary}
        onClose={() => setShowAddBeneficiary(false)}
        onSaved={() => {
          setShowAddBeneficiary(false);
          // refresh list
          (async () => {
            const { data: userRes } = await supabase.auth.getUser();
            const uid = userRes?.user?.id;
            const bq = supabase.from("beneficiaries").select("id,name").order("name", { ascending: true });
            const { data: b } = uid ? await bq.eq("owner_id", uid) : await bq;
            setBeneficiaries((b ?? []) as Person[]);
          })();
        }}
        beneficiary={null as any}
      />
      <AdvisorModal
        open={showAddAdvisor}
        onClose={() => setShowAddAdvisor(false)}
        onSaved={() => {
          setShowAddAdvisor(false);
          (async () => {
            const { data: userRes } = await supabase.auth.getUser();
            const uid = userRes?.user?.id;
            const aq2 = supabase.from("advisors").select("id,name,email").order("name", { ascending: true });
            const { data: adv } = uid ? await aq2.eq("owner_id", uid) : await aq2;
            setAdvisors((adv ?? []) as Advisor[]);
          })();
        }}
        advisor={null}
      />
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}
