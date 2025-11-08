// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/assets", "/accounts", "/settings"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // only run for protected routes
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // We store Supabase session in a cookie named "sb:token" variants.
  // Minimal check: if no cookie starting with "sb", send to /login.
  const hasSbCookie = req.cookies.getAll().some((c) => c.name.startsWith("sb"));
  if (!hasSbCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/assets/:path*", "/accounts/:path*", "/settings/:path*"],
};
