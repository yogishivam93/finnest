// src/app/share/[token]/page.tsx
import "../../globals.css";

type Props = {
  params: { token: string };
};

async function loadShare(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/shares/${token}`, {
    // Allow this to work in preview/prod even without NEXT_PUBLIC_SITE_URL by falling back to relative
    // URL when running on the server of the same origin.
    // Vercel sets absolute URL; local dev will still work via relative call below if needed.
    cache: "no-store",
  }).catch(() => undefined);
  if (!res || !res.ok) {
    // Fallback to relative request
    const rel = await fetch(`/api/shares/${token}`, { cache: "no-store" });
    if (!rel.ok) return null;
    return rel.json();
  }
  return res.json();
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `$${(n || 0).toLocaleString()}`;
  }
}

export default async function SharePage({ params }: Props) {
  const data = await loadShare(params.token);
  if (!data?.ok) {
    return (
      <main className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Shared Assets</h1>
          <p className="mt-2 text-sm text-red-600">This share link is invalid or has expired.</p>
        </div>
      </main>
    );
  }

  const assets = (data.assets as any[]) || [];
  const total = assets.reduce((s, a) => s + (Number(a.current_value) || 0), 0);

  return (
    <main className="p-6 space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Shared Assets</h1>
        <p className="mt-1 text-sm text-gray-500">Read-only view generated from a secure share link.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <th className="p-2">Name</th>
                <th className="p-2">Type</th>
                <th className="p-2">Country</th>
                <th className="p-2">Currency</th>
                <th className="p-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b">
                  <td className="p-2">{a.name || `Asset #${a.id}`}</td>
                  <td className="p-2">{a.type}</td>
                  <td className="p-2">{a.country}</td>
                  <td className="p-2">{a.currency}</td>
                  <td className="p-2">{formatCurrency(Number(a.current_value) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-gray-600">Total Assets</span>
          <span className="text-lg font-semibold">{formatCurrency(total)}</span>
        </div>
      </div>
    </main>
  );
}

