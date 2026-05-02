// Observable Supabase session for React. Returns the current session (or
// null) and re-renders any component that uses this hook whenever auth state
// changes (sign-in, sign-out, token refresh, Google link, etc.).

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, SUPABASE_ENABLED } from "../lib/supabase";
import { onAuthChange, isAnonymousSession } from "../lib/supabaseAuth";

export interface AuthSessionBag {
  session: Session | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
}

export function useAuthSession(): AuthSessionBag {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!SUPABASE_ENABLED) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data?.session || null);
    });

    const unsub = onAuthChange((next) => {
      if (!cancelled) setSession(next);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const meta = (session?.user?.user_metadata ?? {}) as Record<string, unknown>;
  return {
    session,
    userId: session?.user?.id || null,
    email: session?.user?.email || null,
    name:
      (meta.full_name as string | undefined) ||
      (meta.name as string | undefined) ||
      null,
    avatar:
      (meta.avatar_url as string | undefined) ||
      (meta.picture as string | undefined) ||
      null,
    isAnonymous: isAnonymousSession(session),
    isAuthenticated: !!session,
  };
}
