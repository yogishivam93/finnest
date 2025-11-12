"use client";

import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default function Navbar() {
  // 
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b text-gray-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
      {/* Left side: logo and links */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="font-bold text-lg text-gray-800 dark:text-slate-100">
          FinNest
        </Link>
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
          Dashboard
        </Link>
        <Link href="/assets" className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
          Assets
        </Link>
        <Link href="/locker" className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
          Document Locker
        </Link>
        <Link href="/emergency" className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
          Emergency Binder
        </Link>
        <Link href="/accounts" className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
          Accounts
        </Link>
        <Link href="/settings" className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
          Settings
        </Link>
      </div>

      {/* Right side: Add Asset + Sign Out */}
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100 dark:border-slate-700 dark:hover:bg-slate-800">
          + Add Asset
        </button>
        <SignOutButton />
      </div>
    </nav>
  );
}

