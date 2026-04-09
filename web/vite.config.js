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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
