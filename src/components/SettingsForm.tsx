"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyProvider";

const currencies = ["AUD", "USD", "INR", "EUR", "GBP", "NZD"];
const themes = ["light", "dark"] as const;
type Theme = typeof themes[number];

export default function SettingsForm() {
  const { currency, setCurrency } = useCurrency();
  const [userId, setUserId] = useState<string | null>(null);
  const [formCurrency, setFormCurrency] = useState<string>(currency || "AUD");
  const [theme, setTheme] = useState<Theme>("light");
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

        // Try to load profile from a `profiles` table if present.
        const { data, error } = await supabase
          .from("profiles")
          .select("display_currency, theme")
          .eq("id", uid)
          .maybeSingle();

        if (!error && data) {
          const c = (data as any).display_currency as string | null;
          const t = ((data as any).theme as Theme | null) ?? null;
          if (c) {
            setFormCurrency(c);
          }
          if (t && themes.includes(t)) setTheme(t);
        }
      } catch {
        // best-effort; ignore
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

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      // Update context + localStorage immediately for UX
      setCurrency(formCurrency);
      try {
        localStorage.setItem("displayCurrency", formCurrency);
        localStorage.setItem("theme", theme);
      } catch {}
      applyTheme(theme);

      if (userId) {
        // Upsert into `profiles` if table exists.
        const { error } = await supabase
          .from("profiles")
          .upsert(
            [
              {
                id: userId,
                display_currency: formCurrency,
                theme,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "id" }
          );
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
    <form onSubmit={onSave} className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Personalize your FinNest experience</p>
      </div>

      {msg && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{msg}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Default Currency</label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={formCurrency}
            onChange={(e) => setFormCurrency(e.target.value)}
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
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

