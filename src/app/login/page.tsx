"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send link");
    } finally {
      setLoading(false);
    }
  }

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "github") {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback` } });
      if (error) throw error;
    } catch (e: any) {
      setError(e?.message ?? "Unable to start sign in");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">Welcome back to FinNest.</p>

      {/* Email + Password */}
      <form onSubmit={loginPassword} className="mt-6 space-y-3">
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
          {loading ? "Signing in..." : "Log in"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      {/* Magic link (optional) */}
      <form onSubmit={sendMagicLink} className="mt-4 space-y-3">
        <div className="text-xs text-gray-500">or get a one‑time magic link</div>
        <label className="block text-sm">
          <span className="mb-1 block">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            placeholder="you@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {sent ? "Resend magic link" : "Send magic link"}
        </button>
        {sent ? <p className="text-sm text-emerald-600">Check your email for a login link.</p> : null}
      </form>

      <div className="mt-6 space-y-2">
        <button onClick={() => oauth("google")} className="w-full rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Continue with Google
        </button>
        <button onClick={() => oauth("github")} className="w-full rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Continue with GitHub
        </button>
      </div>

      <p className="mt-4 text-center text-sm">
        New to FinNest? <a href="/signup" className="text-blue-600 hover:underline">Create an account</a>
      </p>
    </main>
  );
}
