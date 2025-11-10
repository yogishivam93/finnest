// src/app/api/shares/[token]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
    }
    const token = params.token;
    if (!token) return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });

    const { data: share, error } = await supabaseAdmin
      .from("shares")
      .select("token,target_type,target_id,asset_ids,permissions,message,created_at")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    if (!share) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const assetIds: number[] = Array.isArray(share.asset_ids) ? share.asset_ids : [];
    let assets: any[] = [];
    if (assetIds.length) {
      const { data: a, error: aErr } = await supabaseAdmin
        .from("assets")
        .select("id,name,type,currency,current_value,country")
        .in("id", assetIds);
      if (aErr) throw aErr;
      assets = a ?? [];
    }

    return NextResponse.json({ ok: true, share, assets });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

