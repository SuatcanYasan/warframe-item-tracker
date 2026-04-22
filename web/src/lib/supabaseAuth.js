// Anonymous auth: every tab gets a Supabase session automatically on app
// start. No UI, no friction. The session (+UID) persists in localStorage via
// the SDK; the same anonymous account follows the user on this device across
// reloads. Linking to a real identity (e.g. Google) is a future upgrade —
// see supabase.auth.linkIdentity().

import { supabase, SUPABASE_ENABLED } from "./supabase";

let sessionPromise = null;

export async function ensureSession() {
  if (!SUPABASE_ENABLED) return null;
  if (!sessionPromise) sessionPromise = bootstrapSession();
  return sessionPromise;
}

async function bootstrapSession() {
  const { data: existing } = await supabase.auth.getSession();
  if (existing?.session) return existing.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("[supabase] anonymous sign-in failed:", error.message);
    return null;
  }
  return data.session;
}

export function onAuthChange(handler) {
  if (!SUPABASE_ENABLED) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
}

export function getUserId() {
  if (!SUPABASE_ENABLED) return null;
  return supabase.auth.getSession()
    .then(({ data }) => data?.session?.user?.id || null);
}

// ----------------------------------------------------------------------------
// Google OAuth
// ----------------------------------------------------------------------------
// Two entry points:
//  - signInWithGoogle: used when no anonymous session exists, or when the user
//    explicitly wants to switch accounts. Creates a brand new user if the
//    Google email isn't already linked to one.
//  - linkGoogleIdentity: used when the user is anonymous and wants to upgrade.
//    Preserves the current UID so all their existing rows in Supabase remain
//    accessible after the upgrade. This is the preferred flow.
//
// Both redirect to Google's consent screen. After approval, Google returns the
// user to our app via Supabase's /auth/v1/callback, which sets the session
// and redirects back to window.location.origin. The SDK's detectSessionInUrl
// picks up the PKCE `?code=...` query and swaps it for a session.

function oauthOptions() {
  return {
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      queryParams: { prompt: "select_account" },
    },
  };
}

export async function signInWithGoogle() {
  if (!SUPABASE_ENABLED) return { ok: false, reason: "disabled" };
  const { error } = await supabase.auth.signInWithOAuth(oauthOptions());
  if (error) {
    console.warn("[auth] signInWithGoogle:", error.message);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function linkGoogleIdentity() {
  if (!SUPABASE_ENABLED) return { ok: false, reason: "disabled" };
  const session = await ensureSession();
  if (!session) return { ok: false, reason: "no-session" };
  const { error } = await supabase.auth.linkIdentity(oauthOptions());
  if (error) {
    // Real errors (synchronous) — the common identity_already_exists
    // comes back via URL after the OAuth redirect round-trip, not here.
    // App.jsx bootstrap detects that and shows a toast.
    console.warn("[auth] linkGoogleIdentity:", error.message);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

export async function signOut() {
  if (!SUPABASE_ENABLED) return { ok: false };
  // Reset the cached bootstrap promise so the next visit goes through
  // signInAnonymously again.
  sessionPromise = null;
  const { error } = await supabase.auth.signOut();
  if (error) console.warn("[auth] signOut:", error.message);
  return { ok: !error };
}

// Returns the current session synchronously if available. Useful for UI that
// needs to render auth state without awaiting.
export function getCurrentSession() {
  if (!SUPABASE_ENABLED) return null;
  return supabase.auth.getSession().then(({ data }) => data?.session || null);
}

// True when the current session belongs to an anonymous user (not linked to
// any identity provider).
export function isAnonymousSession(session) {
  if (!session?.user) return false;
  return session.user.is_anonymous === true
    || (Array.isArray(session.user.identities) && session.user.identities.length === 0);
}
