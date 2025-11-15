// src/app/api/insights/route.ts
import { NextRequest, NextResponse } from "next/server";

// Lightweight server-side generation using OpenAI Chat Completions.
// Expects POST with shape:
// {
//   assets: Array<{type:string|null,currency:string|null,current_value:number|null}>,
//   liabilities: Array<{type:string|null,currency:string|null,current_value:number|null,description?:string|null}>,
//   emergencyContacts: Array<{name:string|null,relation:string|null,phone:string|null,email:string|null}>,
//   documents: Array<{id:string|null,assetId:string|null,name:string|null,contentType:string|null,createdAt:string|null}>,
//   insurance: Array<{type:string|null,provider:string|null,endDate:string|null,premium:number|null,deductible:number|null}>,
//   currency?: string
// }
// Returns { insights: Array<{ title: string; tone?: string; body: string }> }

const DISCLAIMER = "Informational only - not financial advice.";
const PROHIBITED_PATTERNS = [/\b(financial advice|guaranteed|guarantee?)\b/i];
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b(buy|sell|trade|short|rebalance|allocate|recommend)\b/gi, "consider"],
  [/\binvest(ing)?\b/gi, "consider expanding exposure"],
  [/\bshould\b/gi, "could"],
  [/\bmust\b/gi, "should consider"],
];

const normalizeText = (value: string) => {
  let text = value.replace(/\s+/g, " ").trim();
  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text;
};

type FeatureSummary = {
  assets: any[];
  byType: Record<string, number>;
  total: number;
  displayCurrency: string;
  top?: string;
  liabilities: any[];
  liabilityTotal: number;
  contactCount: number;
  documentsCount: number;
  soonestInsurance?: { policy: any; days: number; end: string };
};

type InsuranceRecord = {
  type: string | null;
  provider: string | null;
  endDate: string | null;
  premium: number | null;
  deductible: number | null;
};

function buildFallbackInsights(summary: FeatureSummary) {
  const fallback: { title: string; tone: string; body: string }[] = [];
  if (summary.total <= 0 || summary.assets.length === 0) return fallback;

  const normalizeTitle = (title: string) => normalizeText(title);
  const normalizeBody = (body: string) => normalizeText(body);

  fallback.push({
    title: normalizeTitle("Portfolio overview"),
    tone: "Insight",
    body: normalizeBody(
      `You track ${summary.assets.length} assets totaling ${Math.round(
        summary.total
      )} in ${summary.displayCurrency}, led by ${summary.top || "N/A"}`
    ),
  });

  const typeEntries = Object.entries(summary.byType)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  if (typeEntries.length > 0 && summary.total > 0) {
    const [topCategory, topValue] = typeEntries[0];
    const share = Math.round((topValue / summary.total) * 100);
    fallback.push({
      title: normalizeTitle("Top category concentration"),
      tone: "Insight",
      body: normalizeBody(
        `${topCategory} represents approximately ${share}% of the portfolio's value`
      ),
    });
  }

  if (typeEntries.length > 1) {
    fallback.push({
      title: normalizeTitle("Category diversity"),
      tone: "Insight",
      body: normalizeBody(
        `You hold ${typeEntries.length} distinct categories, led by ${typeEntries[0][0]}`
      ),
    });
  }

  if (summary.liabilityTotal > 0) {
    const ratio = summary.total ? Math.round((summary.liabilityTotal / summary.total) * 100) : 0;
    fallback.push({
      title: normalizeTitle("Liabilities snapshot"),
      tone: "Insight",
      body: normalizeBody(
        `Liabilities total ${Math.round(summary.liabilityTotal)} (${ratio}% of assets)`
      ),
    });
  }

  if (summary.contactCount === 0) {
    fallback.push({
      title: normalizeTitle("Emergency contacts"),
      tone: "Attention",
      body: normalizeBody("No emergency contact is on record; add at least one for quick access"),
    });
  } else {
    fallback.push({
      title: normalizeTitle("Emergency contacts"),
      tone: "Positive",
      body: normalizeBody(
        `You have ${summary.contactCount} emergency contact${summary.contactCount === 1 ? "" : "s"} recorded`
      ),
    });
  }

  if (summary.documentsCount === 0) {
    fallback.push({
      title: normalizeTitle("Document storage"),
      tone: "Suggestion",
      body: normalizeBody("No documents have been uploaded; attach key files to centralize information"),
    });
  } else {
    fallback.push({
      title: normalizeTitle("Document count"),
      tone: "Positive",
      body: normalizeBody(`You store ${summary.documentsCount} document${summary.documentsCount === 1 ? "" : "s"}`),
    });
  }

  if (summary.soonestInsurance) {
    const { policy, days, end } = summary.soonestInsurance;
    fallback.push({
      title: normalizeTitle("Insurance renewal"),
      tone: "Attention",
      body: normalizeBody(
        `${policy.provider || "A policy"} (${policy.type || "Insurance"}) renews in ${days} day${days === 1 ? "" : "s"} (${end})`
      ),
    });
  }

  const uniqueCurrencies = [
    ...new Set(
      summary.assets
        .map((asset) => asset?.currency || summary.displayCurrency)
        .filter(Boolean)
    ),
  ];
  if (uniqueCurrencies.length > 1) {
    fallback.push({
      title: normalizeTitle("Currency mix"),
      tone: "Insight",
      body: normalizeBody(
        `Values span ${uniqueCurrencies.length} currencies (${uniqueCurrencies.join(", ")})`
      ),
    });
  } else if (uniqueCurrencies.length === 1) {
    fallback.push({
      title: normalizeTitle("Currency base"),
      tone: "Insight",
      body: normalizeBody(
        `All tracked assets are denominated in ${uniqueCurrencies[0]}`
      ),
    });
  }

  return fallback;
}

function toSafeInsights(items: any[]) {
  const sanitized: { title: string; tone: string; body: string }[] = [];
  for (const raw of items) {
    const title = normalizeText(String(raw?.title ?? "Portfolio insight"));
    const tone =
      typeof raw?.tone === "string" && raw.tone.trim().length > 0
        ? raw.tone
        : "Insight";
    let body = normalizeText(String(raw?.body ?? ""));
    if (!body) continue;
    const combined = `${title} ${body}`;
    if (PROHIBITED_PATTERNS.some((pattern) => pattern.test(combined))) {
      continue;
    }
    sanitized.push({ title, tone, body });
    if (sanitized.length >= 3) break;
  }
  return sanitized;
}

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
    const liabilities = Array.isArray(body?.liabilities) ? body.liabilities : [];
    const emergencyContacts = Array.isArray(body?.emergencyContacts)
      ? body.emergencyContacts
      : [];
    const documents = Array.isArray(body?.documents) ? body.documents : [];
    const insurance = (Array.isArray(body?.insurance)
      ? (body.insurance as InsuranceRecord[])
      : []) as InsuranceRecord[];
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

    const liabilityTotal = liabilities.reduce(
      (s: number, l: any) => s + (Number(l?.current_value) || 0),
      0
    );
    const liabilityByType: Record<string, number> = {};
    for (const l of liabilities) {
      const key = String(l?.type || "OTHER").toUpperCase();
      liabilityByType[key] = (liabilityByType[key] || 0) + (Number(l?.current_value) || 0);
    }

    const contactCount = emergencyContacts.length;
    const documentsCount = documents.length;

    const now = new Date();
    const insuranceWithDays = insurance
      .map((policy) => {
        const end = policy?.endDate ? new Date(policy.endDate) : null;
        if (!end || Number.isNaN(end.getTime())) return null;
        const days = Math.round((end.getTime() - now.getTime()) / 86400000);
        return { policy, endDate: end, days };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.endDate?.getTime() ?? 0) - (b!.endDate?.getTime() ?? 0));
    const soonestInsurance = insuranceWithDays[0]
      ? {
          policy: insuranceWithDays[0]!.policy,
          days: insuranceWithDays[0]!.days,
          end: insuranceWithDays[0]!.endDate.toLocaleDateString(),
        }
      : undefined;

    const insuranceSummary = insurance.length
      ? `${insurance.length} policy${insurance.length === 1 ? "" : "ies"}`
      : "no policies";

    const sys = `You are a regulated FinNest assistant. Summarize the datasets (assets, liabilities, emergency contacts, documents, insurance) in neutral, observational language. Highlight missing contacts, upcoming insurance renewals (30 days or sooner), and other noteworthy ratios. Do not issue recommendations (no buy/sell/invest/should/must) and avoid financial-advice wording.`;
    const user = {
      role: "user",
      content: [
        `Snapshot (display currency ${displayCurrency}):`,
        `Assets: total ${Math.round(total)}, by type ${JSON.stringify(byType)}, top ${top || "N/A"}.`,
        `Liabilities: total ${Math.round(liabilityTotal)}, by type ${JSON.stringify(
          liabilityByType
        )}.`,
        `Emergency contacts: ${contactCount}.`,
        `Documents stored: ${documentsCount}.`,
        `Insurance: ${insuranceSummary}${
          soonestInsurance ? `; soonest renewal in ${soonestInsurance.days} day(s)` : ""
        }.`,
        "Generate 3-4 concise insights that tie directly to the numbers above. Mark tone per item as Positive, Suggestion, Attention, or Insight. Return a JSON array of {title,tone,body}.",
      ].join("\n"),
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

    const rawInsights = Array.isArray(parsed?.insights)
      ? parsed.insights
      : Array.isArray(parsed)
      ? parsed
      : [];
    const insights = toSafeInsights(rawInsights);
    if (insights.length < 3) {
      const fallback = buildFallbackInsights({
        assets,
        byType,
        total,
        displayCurrency,
        top,
        liabilities,
        liabilityTotal,
        contactCount,
        documentsCount,
        soonestInsurance,
      });
      for (const candidate of fallback) {
        if (insights.length >= 3) break;
        const duplicate = insights.some(
          (ins) => ins.title === candidate.title && ins.body === candidate.body
        );
        if (duplicate) continue;
        insights.push(candidate);
      }
    }

    return NextResponse.json({ ok: true, insights });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}
