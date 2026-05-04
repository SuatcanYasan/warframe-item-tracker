import { initSentry } from "./lib/sentry";

// Init Sentry before anything else loads so early render errors are captured.
// No-op when VITE_SENTRY_DSN is unset (dev / local).
initSentry();

// When a new deploy ships, the active page's lazy import statements
// still reference the OLD chunk hashes. The first time the user
// triggers one of those imports they get a 404 / fetch error.
// Vite emits `vite:preloadError` for exactly this case — we hard
// reload so the user lands on the fresh index.html with current
// chunk references. Guarded against reload loops via sessionStorage.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    if (sessionStorage.getItem("__wit_preload_reload__") === "1") return;
    sessionStorage.setItem("__wit_preload_reload__", "1");
    window.location.reload();
  });
  // Clear the guard after a successful page lifecycle so the next
  // genuine deploy can recover too.
  window.addEventListener("load", () => {
    setTimeout(() => sessionStorage.removeItem("__wit_preload_reload__"), 5000);
  });
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./utils/queryClient";
import CraftApp from "./App";
import "antd/dist/reset.css";
import "./styles/index.css";
import "./i18n";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root element missing in index.html");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CraftApp />
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--wf-bg-container)",
            color: "var(--wf-text)",
            border: "1px solid var(--wf-border)",
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
