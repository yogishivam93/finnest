"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // load current user
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));

    // listen for auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (email) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:inline">Hi, {email}</span>
        <button onClick={signOut} className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <a href="/login" className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
      Sign in
    </a>
  );
}
