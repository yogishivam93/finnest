// src/types/beneficiary.ts
export type Beneficiary = {
  id: number;
  owner_id: string;
  name: string;
  relationship: string;
  email: string | null;
  country: string | null;
  created_at?: string;
  updated_at?: string;
};