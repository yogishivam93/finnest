"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // after clicking the magic link, you’ll land back here
        emailRedirectTo: typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000",
      },
    });
    if (error) {
      setStatus("error");
      setMsg(error.message);
    } else {
      setStatus("sent");
      setMsg("Check your email for the magic link.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-2xl p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border rounded-lg p-2"
        />
        <button
          disabled={status==="sending"}
          className="w-full rounded-lg p-2 bg-black text-white disabled:opacity-60"
        >
          {status==="sending" ? "Sending…" : "Send magic link"}
        </button>
        {msg && <p className={status==="error" ? "text-red-600" : "text-green-600"}>{msg}</p>}
      </form>
    </main>
  );
}
