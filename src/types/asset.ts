// src/types/asset.ts
export type Asset = {
  id: string;
  name: string | null;
  type: string | null;
  country: string | null;
  currency: string | null;
  current_value: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  owner_id: string | null;
};
