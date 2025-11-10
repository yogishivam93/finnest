// src/components/AuthForm.tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setStatus("sent");
      setMessage("Magic link sent! Check your email.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Could not send magic link.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
      <label className="block text-sm font-medium">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded border px-3 py-2"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      {message && (
        <p className={status === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>
          {message}
        </p>
      )}
    </form>
  );
}
