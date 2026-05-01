import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  VitePWA({
    registerType: "autoUpdate",
    injectRegister: "auto",
    includeAssets: [
      "favicon.ico",
      "favicon-32.png",
      "favicon-192.png",
      "icon-*.png",
      "dojoflow-logo.png",
      "dojoflow-logo-light.png",
    ],
    manifest: false, // We manage manifest.json manually in /public
    workbox: {
      // Cache the app shell and API routes intelligently
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      // Don't cache API calls — always go to network for fresh data
      navigateFallback: "/index.html",
      navigateFallbackDenylist: [/^\/api/, /^\/trpc/],
      runtimeCaching: [
        {
          // Cache Google Fonts
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // Cache Google Font files
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // Cache S3 assets (flyers, images, videos)
          urlPattern: /^https:\/\/.*\.amazonaws\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "s3-assets-cache",
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // Network-first for API/tRPC — always fresh, fall back to cache
          urlPattern: /^https?:\/\/.*\/(api|trpc)\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            networkTimeoutSeconds: 10,
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    devOptions: {
      enabled: false, // Don't run SW in dev to avoid cache confusion
    },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
