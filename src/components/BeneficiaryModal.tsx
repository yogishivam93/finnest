"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Beneficiary } from "@/types/beneficiary";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  beneficiary?: Beneficiary | null;
};

const RELATIONSHIPS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Friend",
  "Other"
] as const;

const COUNTRIES = [
  "Australia",
  "United States",
  "United Kingdom",
  "Canada",
  "India",
  "Singapore",
  "Other"
] as const;

type Relationship = (typeof RELATIONSHIPS)[number];
type Country = (typeof COUNTRIES)[number];

export default function BeneficiaryModal({ open, onClose, onSaved, beneficiary }: Props) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>(RELATIONSHIPS[0]);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (beneficiary) {
        setName(beneficiary.name || "");
        setRelationship((beneficiary.relationship as Relationship) || RELATIONSHIPS[0]);
        setEmail(beneficiary.email || "");
        setCountry((beneficiary.country as Country) || COUNTRIES[0]);
      } else {
        setName("");
        setRelationship(RELATIONSHIPS[0]);
        setEmail("");
        setCountry(COUNTRIES[0]);
      }
      setError(null);
    }
  }, [open, beneficiary]);

  if (!open) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (!name.trim()) {
        throw new Error("Name is required");
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (!uid) throw new Error("You must be logged in.");

      if (beneficiary?.id) {
        // Update existing
        const { error } = await supabase
          .from("beneficiaries")
          .update({
            name: name.trim(),
            relationship,
            email: email.trim() || null,
            country,
            updated_at: new Date().toISOString(),
          })
          .eq("id", beneficiary.id)
          .eq("owner_id", uid);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("beneficiaries")
          .insert([
            {
              owner_id: uid,
              name: name.trim(),
              relationship,
              email: email.trim() || null,
              country,
              created_at: new Date().toISOString(),
            },
          ]);
        
        if (error) throw error;
      }

      // Reset form and close
      setName("");
      setRelationship(RELATIONSHIPS[0]);
      setEmail("");
      setCountry(COUNTRIES[0]);
      onClose();
      onSaved?.();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save beneficiary.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {beneficiary ? "Edit Beneficiary" : "Add Beneficiary"}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            âœ•
          </button>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:placeholder-slate-400"
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Relationship <span className="text-red-500">*</span>
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as Relationship)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
              required
            >
              {RELATIONSHIPS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:placeholder-slate-400"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as Country)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {saving ? "Saving..." : (beneficiary ? "Save Changes" : "Add Beneficiary")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

