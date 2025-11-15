"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      if (username.trim().length < 3) throw new Error("Username must be at least 3 characters");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;

      const userId = data.user?.id;
      const hasSession = Boolean(data.session);

      if (hasSession && userId) {
        // Email confirmations disabled: we can create profile immediately
        const { error: pe } = await supabase
          .from("profiles")
          .upsert({ id: userId, username: username.trim() });
        if (pe) throw pe;
        setMessage("Account created. Redirecting...");
        // Let middleware pick up auth cookies
        location.assign("/dashboard");
      } else {
        // Confirmations enabled: save the username to apply after first login
        try { localStorage.setItem("pending_username", username.trim()); } catch {}
        setMessage("Check your email to confirm your account. After login, we’ll finish setup.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Unable to sign up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">Use email + password and pick a username.</p>

      <form onSubmit={signUp} className="mt-6 space-y-3">
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
        <label className="block text-sm">
          <span className="mb-1 block">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="••••••••"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a>
      </p>
    </main>
  );
}
