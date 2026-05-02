// Supabase client singleton. URL + publishable key come from Vite env vars
// (web/.env.local). If either is missing the client is null — sync code
// treats that as "cloud sync disabled" and the app continues to work as a
// local-only PWA.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Capture Supabase's OAuth redirect (?code=...&state=...) on load
          // — no conflict with our #share=... hash since PKCE uses query
          // params, not the hash fragment.
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    : null;

export const SUPABASE_ENABLED = !!supabase;
