import * as Sentry from "@sentry/react";

const SENSITIVE_KEY_RE =
  /(email|token|access_token|refresh_token|authorization|api[_-]?key|secret|password|supabase|session)/i;

function scrubObject(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(scrubObject);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
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

export function initSentry(): void {
  if (initialized) return;
  const dsn = import.meta.env?.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: (import.meta.env?.MODE as string | undefined) || "production",
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
      if (event.user) delete event.user;
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.url) {
          try {
            const u = new URL(event.request.url);
            u.hash = "";
            const params = u.searchParams;
            for (const k of Array.from(params.keys())) {
              if (SENSITIVE_KEY_RE.test(k)) params.delete(k);
            }
            event.request.url = u.toString();
          } catch {
            /* ignore url parse failures */
          }
        }
      }
      if (event.contexts) event.contexts = scrubObject(event.contexts) as typeof event.contexts;
      if (event.extra) event.extra = scrubObject(event.extra) as typeof event.extra;
      if (event.tags) event.tags = scrubObject(event.tags) as typeof event.tags;
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb?.data) breadcrumb.data = scrubObject(breadcrumb.data) as typeof breadcrumb.data;
      return breadcrumb;
    },
  });

  initialized = true;
}

export { Sentry };
