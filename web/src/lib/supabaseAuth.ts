// Anonymous auth: every tab gets a Supabase session automatically on app
// start. Linking to a real identity (Google) is an opt-in upgrade.

import type { Session, SignInWithOAuthCredentials } from "@supabase/supabase-js";
import { supabase, SUPABASE_ENABLED } from "./supabase";

let sessionPromise: Promise<Session | null> | null = null;

export interface AuthResult {
  ok: boolean;
  reason?: string;
}

export async function ensureSession(): Promise<Session | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  if (!sessionPromise) sessionPromise = bootstrapSession();
  return sessionPromise;
}

async function bootstrapSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data: existing } = await supabase.auth.getSession();
  if (existing?.session) return existing.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("[supabase] anonymous sign-in failed:", error.message);
    return null;
  }
  return data.session;
}

export function onAuthChange(handler: (session: Session | null) => void): () => void {
  if (!SUPABASE_ENABLED || !supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
}

export async function getUserId(): Promise<string | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

function oauthOptions(): SignInWithOAuthCredentials {
  return {
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      queryParams: { prompt: "select_account" },
    },
  };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!SUPABASE_ENABLED || !supabase) return { ok: false, reason: "disabled" };
  const { error } = await supabase.auth.signInWithOAuth(oauthOptions());
  if (error) {
    console.warn("[auth] signInWithGoogle:", error.message);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function linkGoogleIdentity(): Promise<AuthResult> {
  if (!SUPABASE_ENABLED || !supabase) return { ok: false, reason: "disabled" };
  const session = await ensureSession();
  if (!session) return { ok: false, reason: "no-session" };
  const { error } = await supabase.auth.linkIdentity(oauthOptions());
  if (error) {
    console.warn("[auth] linkGoogleIdentity:", error.message);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function signOut(): Promise<AuthResult> {
  if (!SUPABASE_ENABLED || !supabase) return { ok: false };
  sessionPromise = null;
  const { error } = await supabase.auth.signOut();
  if (error) console.warn("[auth] signOut:", error.message);
  return { ok: !error };
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export function isAnonymousSession(session: Session | null | undefined): boolean {
  if (!session?.user) return false;
  const u = session.user as { is_anonymous?: boolean; identities?: unknown[] };
  return (
    u.is_anonymous === true ||
    (Array.isArray(u.identities) && u.identities.length === 0)
  );
}
