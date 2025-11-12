export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
            All your finances, documents, and family access in one place.
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-slate-300">
            FinNest helps you track assets and liabilities, store critical documents securely, and share
            the right information with the right people—especially in emergencies.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/signup"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Get started — it’s free
            </a>
            <a
              href="/login"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              I already have an account
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
            >
              Explore the app
            </a>
          </div>

          <ul className="mt-8 grid gap-3 text-sm text-gray-700 dark:text-slate-200 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Track assets, liabilities, and net worth in real time
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Secure document locker with sharing controls
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Emergency Binder: insurance, contacts, and key info
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Share links for beneficiaries and advisors
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-blue-600/10 to-emerald-500/10 p-4">
            <div className="grid h-full place-content-center text-center text-gray-600 dark:text-slate-300">
              <div>
                <div className="text-sm uppercase tracking-wider">Preview</div>
                <div className="mt-2 text-xl font-semibold">Dashboard, charts, and FX comparison</div>
                <div className="mt-4 text-xs">Sign up to see your data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / social proof placeholder */}
      <section className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4 text-center text-xs text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Trusted placeholder #{i + 1}
          </div>
        ))}
      </section>

      {/* Feature highlights */}
      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Financial overview</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">Clear charts for assets, liabilities, and net worth with clean separators and brand colors.</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Secure locker</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">Store important files with client‑side encryption and link them to assets or policies.</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Emergency ready</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">Insurance tracker, contacts, and reminders so your family has what they need.</p>
        </div>
      </section>
    </main>
  );
}
export const revalidate = 0;
export const dynamic = "force-dynamic";
