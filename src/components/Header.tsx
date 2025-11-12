// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

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
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between text-gray-900 dark:text-slate-100">
        <Link href="/" className="font-bold text-xl">FinNest</Link>

        <nav className="flex items-center gap-2">
          {/* Dashboard */}
          <Link href="/" className={linkClass(isActive(["/"]))}>Dashboard</Link>

          {/* Wealth dropdown: Assets, Liabilities, Accounts */}
          <details className="relative group">
            <summary className={`list-none cursor-pointer ${linkClass(isActive(["/assets","/liabilities","/accounts"]))}`}>
              Wealth
            </summary>
            <div className="absolute left-0 mt-2 w-44 rounded-md border bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <Link href="/assets" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Assets</Link>
              <Link href="/liabilities" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Liabilities</Link>
              <Link href="/accounts" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Accounts</Link>
            </div>
          </details>

          {/* Documents dropdown: Locker, Emergency Binder */}
          <details className="relative group">
            <summary className={`list-none cursor-pointer ${linkClass(isActive(["/locker","/emergency"]))}`}>
              Documents
            </summary>
            <div className="absolute left-0 mt-2 w-52 rounded-md border bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <Link href="/locker" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Document Locker</Link>
              <Link href="/emergency" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Emergency Binder</Link>
            </div>
          </details>

          {/* People dropdown: People, Beneficiaries, Advisors */}
          <details className="relative group">
            <summary className={`list-none cursor-pointer ${linkClass(isActive(["/people","/beneficiaries","/advisors"]))}`}>
              People
            </summary>
            <div className="absolute left-0 mt-2 w-44 rounded-md border bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <Link href="/people" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">People</Link>
              <Link href="/beneficiaries" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Beneficiaries</Link>
              <Link href="/advisors" className="block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800">Advisors</Link>
            </div>
          </details>

          {/* Settings */}
          <Link href="/settings" className={linkClass(isActive(["/settings"]))}>Settings</Link>
        </nav>

        <SignOutButton />
      </div>
    </header>
  );
}
