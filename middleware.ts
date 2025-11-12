// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/assets",
  "/liabilities",
  "/accounts",
  "/people",
  "/beneficiaries",
  "/advisors",
  "/locker",
  "/documents",
  "/settings",
  "/emergency",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes: always allow
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/api/")
  ) {
    // Ensure the root always serves the marketing page even if any stale cache exists
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // only run for protected routes
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // Check for Supabase auth cookies set by @supabase/auth-helpers or supabase-js
  const hasSupabaseCookie = req.cookies.getAll().some((c) => {
    const n = c.name.toLowerCase();
    return n.startsWith("sb") || n.startsWith("supabase") || n.includes("sb-");
  });
  if (!hasSupabaseCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assets/:path*",
    "/liabilities/:path*",
    "/accounts/:path*",
    "/people/:path*",
    "/beneficiaries/:path*",
    "/advisors/:path*",
    "/locker/:path*",
    "/documents/:path*",
    "/settings/:path*",
    "/emergency/:path*",
  ],
};
