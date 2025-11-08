// src/lib/fx.ts
import { supabase } from "@/lib/supabase";

/**
 * Loads fx rates as a map: `${base}->${quote}` -> rate
 * e.g. "USD->AUD" => 1.5
 */
export async function loadFxMap(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("fx_rates")
    .select("base, quote, rate");
  if (error || !data) return {};
  const map: Record<string, number> = {};
  for (const row of data) {
    const key = `${String(row.base).toUpperCase()}->${String(
      row.quote
    ).toUpperCase()}`;
    const val = Number(row.rate);
    if (isFinite(val)) map[key] = val;
  }
  return map;
}

/**
 * Convert an amount from `from` currency into `to` currency using the fx map.
 * If direct pair missing, tries inverse. Returns null if neither found.
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  fx: Record<string, number>
): number | null {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return amount;

  const direct = fx[`${f}->${t}`];
  if (isFinite(direct)) return amount * direct;

  const inverse = fx[`${t}->${f}`];
  if (isFinite(inverse) && inverse !== 0) return amount / inverse;

  return null;
}
