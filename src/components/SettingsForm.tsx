"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyProvider";

const currencies = ["AUD", "USD", "INR", "EUR", "GBP", "NZD"];
const themes = ["light", "dark"] as const;
type Theme = typeof themes[number];

type FormState = {
  currency: string;
  theme: Theme;
  email: string;
  phone: string;
  displayName: string;
};

export default function SettingsForm() {
  const { currency, setCurrency } = useCurrency();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    currency: currency || "AUD",
    theme: "light",
    email: "",
    phone: "",
    displayName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMsg(null);
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id ?? null;
        if (!uid) {
          if (!cancelled) setLoading(false);
          return;
        }
        setUserId(uid);
        const { data, error } = await supabase
          .from("profiles")
          .select("display_currency, theme, email, phone, display_name")
          .eq("id", uid)
          .maybeSingle();

        if (!error && data) {
          const molded = data as any;
          setForm((prev) => ({
            ...prev,
            currency: (molded.display_currency as string | null) || prev.currency,
            theme: themes.includes(molded.theme) ? (molded.theme as Theme) : prev.theme,
            email: molded.email ?? prev.email,
            phone: molded.phone ?? prev.phone,
            displayName: molded.display_name ?? prev.displayName,
          }));
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function applyTheme(next: Theme) {
    try {
      if (typeof document !== "undefined") {
        const html = document.documentElement;
        if (next === "dark") html.classList.add("dark");
        else html.classList.remove("dark");
      }
    } catch {}
  }

  const handleInputChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      setCurrency(form.currency);
      try {
        localStorage.setItem("displayCurrency", form.currency);
        localStorage.setItem("theme", form.theme);
      } catch {}
      applyTheme(form.theme);

      if (userId) {
        const payload = {
          id: userId,
          display_currency: form.currency,
          theme: form.theme,
          email: form.email,
          phone: form.phone,
          display_name: form.displayName,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("profiles").upsert([payload], { onConflict: "id" });
        if (error && !String(error.message || "").includes("relation \"profiles\" does not exist")) {
          throw error;
        }
      }
      setMsg("Settings saved");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Your Profile & Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep your personal information up to date and control how FinNest looks.
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{msg}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.displayName}
            onChange={handleInputChange("displayName")}
            disabled={loading || saving}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.email}
            onChange={handleInputChange("email")}
            disabled={loading || saving}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input
            type="tel"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.phone}
            onChange={handleInputChange("phone")}
            disabled={loading || saving}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Default Currency</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.currency}
            onChange={handleInputChange("currency")}
            disabled={loading || saving}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Theme</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.theme}
            onChange={handleInputChange("theme")}
            disabled={loading || saving}
          >
            {themes.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white/80 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Security</h3>
          <p className="mt-1 text-xs text-gray-500">
            Email-based authentication via Supabase keeps your account protected. You can link MFA or SSO
            separately.
          </p>
        </div>
        <div className="rounded-2xl border bg-white/80 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <p className="mt-1 text-xs text-gray-500">
            Receive alerts when assets move or documents are shared. We’ll build this out soon—check back later.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </form>
  );
}
