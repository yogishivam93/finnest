"use client";

import { useCurrency } from "@/context/CurrencyProvider";

const options = ["AUD", "USD", "INR", "EUR", "GBP", "NZD"];

export default function CurrencySelector() {
  const { currency, setCurrency, loading } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Display</label>
      <select
        value={currency}
        disabled={loading}
        onChange={(e) => setCurrency(e.target.value)}
        className="rounded-md border px-2 py-1 text-sm"
        aria-label="Display currency"
        title="Display currency"
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

