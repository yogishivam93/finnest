"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "http://localhost:3000" }
    });
    if (error) {
      setStatus("error");
      setMsg(error.message);
    } else {
      setStatus("sent");
      setMsg("Check your email for the sign-in link.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-sm">
      <label className="block text-sm font-medium">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-xl border px-3 py-2"
      />
      <button
        type="submit"
        disabled={status==="sending"}
        className="rounded-xl bg-gray-900 px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
      >
        {status==="sending" ? "Sending..." : "Send magic link"}
      </button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  );
}
