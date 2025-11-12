"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugUID() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      console.log("âœ… Logged-in UID =", data.user?.id);
    });
  }, []);
  return null;
}



