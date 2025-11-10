// src/app/api/env/route.ts
export async function GET() {
  return new Response(
    JSON.stringify({
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    }),
    { headers: { "content-type": "application/json" } }
  );
}
