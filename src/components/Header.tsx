// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const pathname = usePathname();
  const isActive = (paths: string[]) => paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const linkClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${
      active
        ? "bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900"
        : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 text-gray-900 dark:text-slate-100 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="font-bold text-xl">FinNest</Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm text-gray-900 dark:text-slate-100 lg:gap-2">
          {/* Dashboard */}
          <Link href="/dashboard" className={linkClass(isActive(["/dashboard"]))}>Dashboard</Link>

          {/* Wealth dropdown: Assets, Liabilities, Accounts */}
          <HoverDetails label="Wealth" active={isActive(["/assets","/liabilities","/accounts"]) } summaryClass={linkClass(isActive(["/assets","/liabilities","/accounts"]))}>
            <Link href="/assets" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Assets</Link>
            <Link href="/liabilities" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Liabilities</Link>
            <Link href="/accounts" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Accounts</Link>
          </HoverDetails>

          {/* Documents dropdown: Locker, Emergency Binder */}
          <HoverDetails label="Documents" active={isActive(["/locker","/emergency"]) } summaryClass={linkClass(isActive(["/locker","/emergency"]))}>
            <Link href="/locker" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Document Locker</Link>
            <Link href="/emergency" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Emergency Binder</Link>
          </HoverDetails>

          {/* People dropdown: People, Beneficiaries, Advisors */}
          <HoverDetails label="People" active={isActive(["/people","/beneficiaries","/advisors"]) } summaryClass={linkClass(isActive(["/people","/beneficiaries","/advisors"]))}>
            <Link href="/people" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">People</Link>
            <Link href="/beneficiaries" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Beneficiaries</Link>
            <Link href="/advisors" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Advisors</Link>
          </HoverDetails>

          {/* Settings */}
          <Link href="/settings" className={linkClass(isActive(["/settings"]))}>Settings</Link>
        </nav>

        <div className="flex justify-end">
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}

function AuthButtons() {
  const [hasUser, setHasUser] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setHasUser(Boolean(data?.user?.id))).catch(() => setHasUser(false));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setHasUser(Boolean(session?.user?.id)));
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (hasUser == null) return null;
  if (hasUser) return <SignOutButton />;

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">Log in</Link>
      <Link href="/signup" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Sign up</Link>
    </div>
  );
}

function HoverDetails({ label, summaryClass, active, children }: { label: string; summaryClass: string; active: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const timer = useRef<number | null>(null);

  const open = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (ref.current) ref.current.open = true;
  };
  const close = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (ref.current) ref.current.open = false;
    }, 180);
  };

  return (
    <details ref={ref} className="relative group" onMouseEnter={open} onMouseLeave={close}>
      <summary className={`list-none cursor-pointer ${summaryClass}`}>{label}</summary>
      <div className="absolute left-0 mt-2 w-52 rounded-md border bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </details>
  );
}
