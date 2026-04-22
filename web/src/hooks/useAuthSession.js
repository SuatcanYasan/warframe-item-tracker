// Observable Supabase session for React. Returns the current session (or
// null) and re-renders any component that uses this hook whenever auth state
// changes (sign-in, sign-out, token refresh, Google link, etc.).

import { useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "../lib/supabase";
import { onAuthChange, isAnonymousSession } from "../lib/supabaseAuth";

export function useAuthSession() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!SUPABASE_ENABLED) return;
    let cancelled = false;

    // Prime with the current session (if SDK has already restored it).
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data?.session || null);
    });

    // Subscribe to future changes.
    const unsub = onAuthChange((next) => {
      if (!cancelled) setSession(next);
    });

    return () => { cancelled = true; unsub(); };
  }, []);

  return {
    session,
    userId: session?.user?.id || null,
    email: session?.user?.email || null,
    name: session?.user?.user_metadata?.full_name
      || session?.user?.user_metadata?.name
      || null,
    avatar: session?.user?.user_metadata?.avatar_url
      || session?.user?.user_metadata?.picture
      || null,
    isAnonymous: isAnonymousSession(session),
    isAuthenticated: !!session,
  };
}
