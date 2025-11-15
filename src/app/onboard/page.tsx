"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RequireAuth from "@/components/RequireAuth";

export default function OnboardPage() {
  return (
    <RequireAuth>
      <OnboardInner />
    </RequireAuth>
  );
}

function OnboardInner() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const pending = localStorage.getItem("pending_username");
      if (pending) setUsername(pending);
    } catch {}
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) throw new Error("Not authenticated");
      if (username.trim().length < 3) throw new Error("Username must be at least 3 characters");
      const { error } = await supabase.from("profiles").upsert({ id: uid, username: username.trim() });
      if (error) throw error;
      try { localStorage.removeItem("pending_username"); } catch {}
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Finish setup</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">Pick a username to complete your profile.</p>
      <form onSubmit={save} className="mt-6 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block">Username</span>
          <input
            type="text"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="yourname"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </main>
  );
}

