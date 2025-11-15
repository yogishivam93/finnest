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
      const errorDesc = params.get("error_description") || params.get("error");
      const next = params.get("next") || "/dashboard";
      const code = params.get("code"); // OAuth PKCE code
      const tokenHash = params.get("token_hash"); // Email magic link token
      const type = params.get("type") || "magiclink";

      if (errorDesc) {
        setMsg(`Auth error: ${errorDesc}`);
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
          if (error) throw error;
        } else {
          // Some providers (and some Supabase email templates) place tokens in the URL hash (#)
          // e.g. #access_token=...&refresh_token=...&type=...  — parse and set the session.
          const hash = typeof window !== "undefined" ? window.location.hash : "";
          const h = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
          const access_token = h.get("access_token");
          const refresh_token = h.get("refresh_token");
          const hType = h.get("type");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
          } else if (h.get("token_hash")) {
            const { error } = await supabase.auth.verifyOtp({ token_hash: String(h.get("token_hash")), type: (hType || "magiclink") as any });
            if (error) throw error;
          } else {
            setMsg("Missing auth credentials in URL.");
            return;
          }
        }
      } catch (e: any) {
        setMsg(`Auth error: ${e?.message || "Unable to complete sign-in"}`);
        return;
      }

      try {
        // Ensure profile row exists; if not, try to use any pending_username captured at signup
        const { data: u } = await supabase.auth.getUser();
        const uid = u?.user?.id;
        if (uid) {
          const { data: p } = await supabase.from("profiles").select("id").eq("id", uid).maybeSingle();
          if (!p) {
            const pending = typeof localStorage !== "undefined" ? localStorage.getItem("pending_username") : null;
            if (pending && pending.trim().length >= 3) {
              await supabase.from("profiles").upsert({ id: uid, username: pending.trim() });
              try { localStorage.removeItem("pending_username"); } catch {}
            }
          }
        }
      } catch {}

      setMsg("Signed in! Redirecting...");
      try {
        // Set a lightweight cookie used by middleware as an auth hint
        document.cookie = "fn_auth=1; Max-Age=2592000; Path=/"; // 30 days
      } catch {}
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
