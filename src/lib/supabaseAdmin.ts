// src/lib/supabaseAdmin.ts
// Server-only Supabase client using the service role key.
// Do NOT import this in client components.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as
  | string
  | undefined;

if (!url || !serviceKey) {
  // Avoid throwing during build; API routes will guard at runtime.
  // eslint-disable-next-line no-console
  console.warn("supabaseAdmin: missing URL or service key");
}

export const supabaseAdmin = url && serviceKey ? createClient(url, serviceKey) : undefined;

