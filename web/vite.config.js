const path = require("path");
const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const { VitePWA } = require("vite-plugin-pwa");

module.exports = defineConfig({
  root: __dirname,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
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
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp}"],
        runtimeCaching: [
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
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor libs into stable chunks. Helps caching: when only
        // app code changes, antd/react/supabase don't re-download.
        // Function form is more reliable than the object form when
        // dependencies are deeply nested or imported transitively.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/antd/") || id.includes("/@ant-design/")) return "antd";
          if (id.includes("/react-router") || id.includes("/react-dom/") || id.match(/\/react\//)) return "react";
          if (id.includes("/framer-motion/")) return "motion";
          if (id.includes("/@supabase/")) return "supabase";
          if (id.includes("/@tanstack/react-query")) return "query";
          if (id.includes("/recharts/") || id.includes("/d3-")) return "recharts";
          if (id.includes("/@dnd-kit/")) return "dnd";
          if (id.includes("/@tanstack/react-table") || id.includes("/@tanstack/table-core")) return "tanstable";
          if (id.includes("/i18next") || id.includes("/react-i18next")) return "i18n";
          // Everything else from node_modules → small "vendor" bucket
          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
