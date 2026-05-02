import * as Sentry from "@sentry/react";

// Sensitive keys we never want surfaced to Sentry. Belt-and-suspenders alongside
// the explicit user/contexts strip below — covers nested places like extra,
// breadcrumbs.data, request.headers etc.
const SENSITIVE_KEY_RE = /(email|token|access_token|refresh_token|authorization|api[_-]?key|secret|password|supabase|session)/i;

function scrubObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(scrubObject);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEY_RE.test(k)) {
      out[k] = "[Filtered]";
    } else if (v && typeof v === "object") {
      out[k] = scrubObject(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn) return; // No-op in dev / when DSN not provided.

  Sentry.init({
    dsn,
    environment: import.meta.env?.MODE || "production",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    sendDefaultPii: false,
    ignoreErrors: [
      "ResizeObserver",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Network request failed",
      "Failed to fetch",
      "Load failed",
      "NetworkError",
    ],
    beforeSend(event) {
      // Strip user identity entirely — we never want emails/IDs leaving the browser.
      if (event.user) {
        delete event.user;
      }
      // Drop request body/cookies; keep URL only after stripping the hash
      // (#share=... can encode an export payload).
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.url) {
          try {
            const u = new URL(event.request.url);
            u.hash = "";
            // Strip query keys that might carry tokens.
            const params = u.searchParams;
            for (const k of Array.from(params.keys())) {
              if (SENSITIVE_KEY_RE.test(k)) params.delete(k);
            }
            event.request.url = u.toString();
          } catch {
            // ignore url parse failures
          }
        }
      }
      if (event.contexts) {
        event.contexts = scrubObject(event.contexts);
      }
      if (event.extra) {
        event.extra = scrubObject(event.extra);
      }
      if (event.tags) {
        event.tags = scrubObject(event.tags);
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb?.data) {
        breadcrumb.data = scrubObject(breadcrumb.data);
      }
      return breadcrumb;
    },
  });

  initialized = true;
}

export { Sentry };
