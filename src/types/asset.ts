// src/types/asset.ts
export type Asset = {
  id: string;
  name: string | null;
  type: string | null;
  institution?: string | null;
  country: string | null;
  currency: string | null;
  current_value: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  owner_id: string | null;
};

// Central definition of allowed asset types.
// Keep in sync with the DB CHECK constraint on assets.type
// ('BANK','INVESTMENT','PROPERTY','CRYPTO','SUPER','OTHER').
export const ASSET_TYPES = [
  "BANK",
  "INVESTMENT",
  "PROPERTY",
  "CRYPTO",
  "SUPER",
  "OTHER",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
