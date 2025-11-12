// src/app/api/fx/compare/route.ts
// Aggregates FX rates from multiple public providers for quick comparison.
// Query: /api/fx/compare?base=AUD&quote=USD

export const revalidate = 300; // ISR hint for Next (5 minutes)

type ProviderResult = {
  provider: string;
  label: string;
  rate: number | null;
  timestamp?: string | null;
  source?: string;
};

async function fromFrankfurter(base: string, quote: string): Promise<ProviderResult> {
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const rate = j?.rates?.[quote] ?? null;
    return { provider: "frankfurter", label: "ECB (Frankfurter)", rate, timestamp: j?.date ?? null, source: url };
  } catch {
    return { provider: "frankfurter", label: "ECB (Frankfurter)", rate: null, source: url };
  }
}

async function fromExchangeRateHost(base: string, quote: string): Promise<ProviderResult> {
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quote)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const rate = j?.rates?.[quote] ?? null;
    const ts = j?.date ?? null;
    return { provider: "exchangerate_host", label: "ExchangeRate.host", rate, timestamp: ts, source: url };
  } catch {
    return { provider: "exchangerate_host", label: "ExchangeRate.host", rate: null, source: url };
  }
}

async function fromOpenERAPI(base: string, quote: string): Promise<ProviderResult> {
  const url = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const rate = j?.rates?.[quote] ?? null;
    const ts = j?.time_last_update_utc ?? null;
    return { provider: "erapi", label: "ER API", rate, timestamp: ts, source: url };
  } catch {
    return { provider: "erapi", label: "ER API", rate: null, source: url };
  }
}

async function fromOpenExchangeRates(base: string, quote: string): Promise<ProviderResult> {
  const appId = process.env.OPENEXCHANGERATES_APP_ID;
  const url = `https://openexchangerates.org/api/latest.json?app_id=${encodeURIComponent(String(appId))}&symbols=${encodeURIComponent(
    [base, quote].join(",")
  )}`;
  try {
    if (!appId) throw new Error("missing app id");
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as any;
    // OXR free tier is USD base. Convert base->quote via USD.
    const rates = j?.rates || {};
    const rBase = rates[base];
    const rQuote = rates[quote];
    let rate: number | null = null;
    if (base === "USD" && typeof rQuote === "number") rate = rQuote;
    else if (quote === "USD" && typeof rBase === "number") rate = 1 / rBase;
    else if (typeof rBase === "number" && typeof rQuote === "number") rate = rQuote / rBase;
    const ts = j?.timestamp ? new Date(j.timestamp * 1000).toISOString() : null;
    return { provider: "openexchangerates", label: "OpenExchangeRates", rate, timestamp: ts, source: url };
  } catch {
    return { provider: "openexchangerates", label: "OpenExchangeRates", rate: null, source: url };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") || "AUD").toUpperCase();
  const quote = (searchParams.get("quote") || "USD").toUpperCase();

  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote) || base === quote) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid currency pair" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const tasks: Array<Promise<ProviderResult>> = [
    fromFrankfurter(base, quote),
    fromExchangeRateHost(base, quote),
    fromOpenERAPI(base, quote),
  ];
  if (process.env.OPENEXCHANGERATES_APP_ID) {
    tasks.push(fromOpenExchangeRates(base, quote));
  }

  const providers = await Promise.allSettled(tasks);

  const results = providers
    .map((p) => (p.status === "fulfilled" ? p.value : null))
    .filter(Boolean) as ProviderResult[];

  // Sort by rate asc when available, put nulls at end
  results.sort((a, b) => {
    if (a.rate == null && b.rate == null) return 0;
    if (a.rate == null) return 1;
    if (b.rate == null) return -1;
    return a.rate - b.rate;
  });

  return new Response(JSON.stringify({ ok: true, base, quote, results }), {
    headers: {
      "content-type": "application/json",
      // Cache at the edge; providers revalidated individually above
      "cache-control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}
