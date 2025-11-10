"use client";

import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default function Navbar() {
  // console.log("✅ Navbar loaded!");
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b">
      {/* Left side: logo and links */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="font-bold text-lg text-gray-800">
          FinNest
        </Link>
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
          Dashboard
        </Link>
        <Link href="/assets" className="text-gray-600 hover:text-gray-900">
          Assets
        </Link>
        <Link href="/accounts" className="text-gray-600 hover:text-gray-900">
          Accounts
        </Link>
        <Link href="/settings" className="text-gray-600 hover:text-gray-900">
          Settings
        </Link>
      </div>

      {/* Right side: Add Asset + Sign Out */}
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-100">
          + Add Asset
        </button>
        <SignOutButton />
      </div>
    </nav>
  );
}
