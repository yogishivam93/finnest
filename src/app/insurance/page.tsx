import { supabase } from "@/lib/supabase";

type Policy = {
  id: number;
  type: string | null;
  provider: string | null;
  policy_number: string | null;
  end_date: string | null;
  premium: number | null;
  deductible: number | null;
};

export default async function InsurancePage() {
  const { data, error } = await supabase
    .from("insurance_policies")
    .select(
      "id,type,provider,policy_number,premium,deductible,end_date,created_at,updated_at"
    )
    .order("end_date", { ascending: true });

  const policies = (data ?? []) as Policy[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">
          Insurance tracker
        </h1>
        <p className="mt-2 text-gray-600 dark:text-slate-300">
          Review the policies you have stored with FinNest and keep an eye on renewals.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load insurance data: {error.message}
        </div>
      )}

      {policies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          No insurance policies recorded yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Policy</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {policy.type || "Insurance policy"}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  Renewal:{" "}
                  {policy.end_date
                    ? new Date(policy.end_date).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    Provider:
                  </span>{" "}
                  {policy.provider || "Unknown"}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    Policy #
                  </span>{" "}
                  {policy.policy_number || "N/A"}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    Premium
                  </span>{" "}
                  {policy.premium ? `$${policy.premium.toLocaleString()}` : "N/A"}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  <span className="font-medium text-gray-900 dark:text-slate-100">
                    Deductible
                  </span>{" "}
                  {policy.deductible
                    ? `$${policy.deductible.toLocaleString()}`
                    : "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
