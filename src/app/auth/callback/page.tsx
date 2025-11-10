// src/app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Finishing sign-in...");

  useEffect(() => {
    (async () => {
      const code = params.get("code");
      const errorDesc = params.get("error_description") || params.get("error");
      const next = params.get("next") || "/";

      if (errorDesc) {
        setMsg(`Auth error: ${errorDesc}`);
        return;
      }
      if (!code) {
        setMsg("Missing auth code in URL.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMsg(`Auth error: ${error.message}`);
        return;
      }

      setMsg("Signed in! Redirecting...");
      router.replace(next);
    })();
  }, [params, router]);

  return <div className="p-6 text-sm">{msg}</div>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Finishing sign-in...</div>}>
      <CallbackContent />
    </Suspense>
  );
}

