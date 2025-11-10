// src/types/advisor.ts
export type Advisor = {
  id: number;
  name: string | null;
  email: string | null;
  company?: string | null;
  created_at?: string | null;
  owner_id?: string | null;
};

