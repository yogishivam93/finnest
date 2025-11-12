"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CurrentUIDBadge() {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUid(data?.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!uid) return null;

  const short = uid.length > 8 ? `${uid.slice(0, 4)}…${uid.slice(-4)}` : uid;

  return (
    <span
      title={uid}
      className="mr-3 hidden rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300 sm:inline"
    >
      UID: {short}
    </span>
  );
}

