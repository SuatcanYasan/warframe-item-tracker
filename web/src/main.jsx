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

ReactDOM.createRoot(document.getElementById("root")).render(
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
