import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  root: path.resolve("web"),
  plugins: [
    react(),
    // Bundle visualizer is opt-in via ANALYZE=1 npm run build so the
    // stats file isn't generated on every prod build. Output lands in
    // dist/_bundle-stats.html — globIgnores below keeps it out of SW.
    process.env.ANALYZE
      ? visualizer({ filename: "dist/_bundle-stats.html", gzipSize: true, brotliSize: true, open: false, template: "treemap" })
      : null,
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["trackerlogo.png", "logo.svg"],
      manifest: {
        name: "Warframe Item Tracker",
        short_name: "WIT",
        description: "Track your Warframe crafts, relics, and inventory",
        theme_color: "#CA8A04",
        background_color: "#0B0B10",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "trackerlogo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "trackerlogo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Precache only the small app shell (HTML + CSS + tiny JS chunks
        // + manifest icons). Big vendor chunks are NOT precached — they
        // get cached on-demand the first time they're requested via the
        // runtime CacheFirst handler below. This keeps the SW install
        // step fast (was 4 MB → ~250 KB) so first-paint isn't blocked
        // by a giant background download.
        globPatterns: ["**/*.{css,html,svg,ico}", "**/index-*.js", "**/registerSW.js"],
        globIgnores: ["**/_bundle-stats.html"],
        maximumFileSizeToCacheInBytes: 1 * 1024 * 1024,
        runtimeCaching: [
          {
            // Catch every JS/CSS/asset chunk on first request so they
            // work offline thereafter. CacheFirst since chunk filenames
            // are content-hashed (re-deploy = new filename).
            urlPattern: /\/assets\/.*\.(?:js|css)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "app-chunks",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cdn-images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/wiki\.warframe\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "wiki-icons",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    // Modern browsers only — no IE11/old-Safari polyfills. esnext
    // skips the most transforms (top-level await, class fields,
    // private methods, etc. are emitted as-is). PWA app, modern UAs.
    target: "esnext",
    // Minify identifiers AND drop console.* in prod. Logs survive in
    // dev builds because Vite uses esbuild's `minify: false` there.
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Split node_modules into a few stable chunks. Important:
        // antd / recharts / @ant-design/icons stay grouped with their
        // React dependency in a single 'react-app' chunk. We previously
        // hit a "React.createContext is undefined" race when they were
        // in separate chunks evaluating before React initialized; this
        // keeps everything that *uses* React together while still
        // peeling off truly independent deps.
        // Splitting rules (after testing):
        //
        // Anything that calls React.* (createContext, Component,
        // useEffect, etc.) MUST stay in the same chunk as React. We
        // tested separate `sentry`, `i18n`, `charts` chunks — every
        // one of them produced "Cannot read properties of undefined
        // (reading 'Component')" because the chunk evaluated before
        // React's body had run.
        //
        // Only React-AGNOSTIC deps are safe to split out: supabase
        // (its own client lib), warframe-worldstate-parser (server-
        // only fallback). Everything else collapses into 'react-app'.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/@supabase/")) return "supabase";
          if (id.includes("/warframe-worldstate-parser/")) return "wf-data";
          // Recharts + d3 deps stay UNGROUPED — Vite then attaches them
          // to the dynamic-import chunk that pulls them in (Donut /
          // Bar wrappers are lazy()), keeping recharts out of the
          // entry critical path. Safe because chunks load AFTER React.
          if (
            id.includes("/recharts/") ||
            id.includes("/victory-vendor/") ||
            id.includes("/d3-") ||
            id.includes("/internmap/")
          ) return undefined;
          return "react-app";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve("web/src"),
    },
  },
});


