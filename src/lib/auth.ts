import { supabase } from "@/lib/supabase";

export type SessionUser = {
  id: string;
  email?: string | null;
};

/** Returns the current auth user or null */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    const u = data?.user;
    return u ? { id: u.id, email: (u as any).email ?? null } : null;
  } catch {
    return null;
  }
}

/** Returns the current user id or null */
export async function getCurrentUID(): Promise<string | null> {
  const u = await getCurrentUser();
  return u?.id ?? null;
}

/** Throws if no authenticated user and returns the id otherwise. */
export async function requireUID(): Promise<string> {
  const id = await getCurrentUID();
  if (!id) throw new Error("Not authenticated");
  return id;
}

const auth = { getCurrentUser, getCurrentUID, requireUID };
export default auth;
