"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (e) {
      // noop: keep UX simple; optional toast could go here
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
      disabled={loading}
      aria-label="Sign out"
      title="Sign out"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
