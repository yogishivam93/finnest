// src/app/api/shares/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tab, // "beneficiary" | "advisor"
      beneficiaryId, // number | null
      assets = [], // number[]
      permissions = {}, // { view?: boolean; download?: boolean }
      message = "",
    } = body ?? {};

    const token = crypto.randomUUID();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const shareUrl = `${String(origin).startsWith("http") ? origin : `https://${origin}`}/share/${token}`;

    // Try to persist (best-effort). If env missing or insert fails, still return a link.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      const supabase = createClient(url, key);
      try {
        // Optional: capture user id if available via header cookie in future
        await supabase.from("shares").insert([
          {
            token,
            target_type: tab,
            target_id: tab === "beneficiary" ? beneficiaryId ?? null : null,
            asset_ids: assets,
            permissions,
            message,
          },
        ]);
      } catch (e) {
        // swallow – demo should continue to work without DB schema
        console.error("shares insert failed", e);
      }
    }

    return NextResponse.json({ ok: true, token, url: shareUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Bad request" }, { status: 400 });
  }
}

