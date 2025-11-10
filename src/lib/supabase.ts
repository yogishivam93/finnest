// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// read NEXT_PUBLIC_* so it works in the browser
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // temporary helpful message
  // eslint-disable-next-line no-console
  console.error("ENV MISSING in supabase.ts", { url, keyPresent: !!key });
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Check .env.local and restart `npm run dev`."
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
