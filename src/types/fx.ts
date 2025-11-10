// src/types/fx.ts
export type FxRate = {
  id?: number;            // bigserial in DB
  base: string;           // e.g., "USD"
  quote: string;          // e.g., "AUD"
  rate: number;           // e.g., 1.50 (1 USD = 1.50 AUD)
  updated_at?: string | null;
};
