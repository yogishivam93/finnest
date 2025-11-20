"use client";

import Link from "next/link";
import { ShieldCheck, Sparkles, Users, Globe } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
];

const features = [
  {
    title: "Track your wealth effortlessly",
    description: "Real-time assets, liabilities, and net worth tracking you can trust.",
    icon: Sparkles,
  },
  {
    title: "Store documents securely",
    description: "Bank-level encryption for documents linked to assets, policies, and trusts.",
    icon: ShieldCheck,
  },
  {
    title: "Share with family & advisors",
    description: "Give access only to the right people, exactly when they need it.",
    icon: Users,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-2xl font-bold tracking-tight">FinNest</div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-700 hover:border-slate-400"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-blue-600 px-4 py-1.5 font-semibold text-white shadow-sm shadow-blue-400/30 hover:bg-blue-500"
            >
              Get started — it's free
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 md:py-20">
        <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">FinNest</p>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              All your finances, documents, and family access in one beautiful control center.
            </h1>
            <p className="text-lg text-slate-600">
              FinNest gives you real-time clarity on assets, liabilities, insurance, and emergency plans
              while letting you share only what matters with the people you trust.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
              >
                Get started — it's free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-700 hover:border-slate-500"
              >
                Log in
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-500/10 via-white to-slate-50 p-6 shadow-xl shadow-blue-500/10">
            <div className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">FinNest preview</div>
            <div className="mt-4 grid gap-3 rounded-2xl bg-white/90 p-5 shadow-inner">
              <div className="text-sm font-medium text-slate-700">Dashboard snapshot</div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Assets</span>
                <span>$1.2M</span>
              </div>
              <div className="h-1 w-full rounded-full bg-slate-200">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-sky-400" />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Liabilities</span>
                <span>$420K</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Family ready</span>
                <span>Shared</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-600 shadow-sm">
              <p className="font-semibold text-slate-800">Emergency binder</p>
              <p className="text-xs text-slate-500">Insurance, contacts, instructions</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 text-xs uppercase tracking-[0.4em] text-slate-500">
          <p>Trusted by early adopters</p>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span
                key={idx}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/70 text-slate-500"
              >
                F{idx + 1}
              </span>
            ))}
          </div>
        </section>

        <section id="features" className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:border-blue-300 md:p-8"
              >
                <Icon className="mb-4 h-8 w-8 text-blue-500" />
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm text-slate-500">{feature.description}</p>
              </article>
            );
          })}
        </section>

        <section id="security" className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 px-6 py-8 shadow-lg md:px-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Security</p>
              <h2 className="text-2xl font-semibold text-slate-900">Bank-level security. Your data stays yours.</h2>
            </div>
            <Globe className="h-8 w-8 text-blue-500" />
          </div>
          <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-3">
            <p>Encrypted at rest and in transit with multi-region keys.</p>
            <p>Granular access controls for each beneficiary or advisor.</p>
            <p>Realtime monitoring & alerts with tamper-proof logs.</p>
          </div>
          <p className="text-xs text-slate-500">MVP warning: Please avoid entering super-sensitive identifiers (full account numbers, SSNs) while we continue improving the experience.</p>
        </section>

        <section id="pricing" className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50/60 to-white p-6 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plan</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Early Access</h3>
          <p className="mt-2 text-sm text-slate-600">Free while we polish the experience for families and advisors.</p>
          <div className="mt-5 flex items-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-slate-900/30"
            >
              Join waitlist
            </Link>
            <div className="rounded-full border border-slate-200 px-4 py-1 text-xs text-slate-500">No credit card needed</div>
          </div>
        </section>
      </main>
    </div>
  );
}
