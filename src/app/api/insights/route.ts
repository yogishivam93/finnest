// src/app/api/insights/route.ts
import { NextRequest, NextResponse } from "next/server";

// Lightweight server-side generation using OpenAI Chat Completions.
// Expects POST with shape: { assets: Array<{type:string|null,currency:string|null,current_value:number|null}>, currency?: string }
// Returns { insights: Array<{ title: string; tone?: string; body: string }> }

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const assets = Array.isArray(body?.assets) ? body.assets : [];
    const displayCurrency = body?.currency || "USD";

    const total = assets.reduce(
      (s: number, a: any) => s + (Number(a?.current_value) || 0),
      0
    );
    const byType: Record<string, number> = {};
    for (const a of assets) {
      const key = String(a?.type || "OTHER").toUpperCase();
      byType[key] = (byType[key] || 0) + (Number(a?.current_value) || 0);
    }

    const top = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const sys = `You are an investment assistant. Produce 3–4 concise insights (title + one sentence). Avoid generic tips; tie to the data.`;
    const user = {
      role: "user",
      content: `Portfolio summary (display currency ${displayCurrency}):\nTotal: ${Math.round(
        total
      )}\nBy type: ${JSON.stringify(byType)}\nTop category: ${top || "N/A"}.\nGenerate specific, actionable bullets. Mark tone per item as one of: Positive, Suggestion, Attention, Insight. Return JSON array of {title,tone,body}.`,
    } as const;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sys },
          user,
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ ok: false, error: text }, { status: 500 });
    }
    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {}

    const insights = Array.isArray(parsed?.insights)
      ? parsed.insights
      : Array.isArray(parsed)
      ? parsed
      : [];

    return NextResponse.json({ ok: true, insights });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}

