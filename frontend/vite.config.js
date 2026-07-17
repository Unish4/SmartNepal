import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import process from "node:process";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiOrigin = env.VITE_API_URL || "http://localhost:5000";
  const apiOriginPattern = escapeRegex(apiOrigin);

  return {
    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: "prompt",
        injectRegister: false,

        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.js",
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        },

        devOptions: {
          enabled: true,
          type: "module",
          suppressWarnings: true,
        },

        includeAssets: ["favicon-196.png", "apple-icon-180.png", "icon.png"],

        manifest: {
          name: "NepalSewa — Civic Issue Reporting",
          short_name: "NepalSewa",
          description:
            "Report civic issues and connect with your municipality across Nepal.",
          theme_color: "#16a34a",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/manifest-icon-192.maskable.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/manifest-icon-192.maskable.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/manifest-icon-512.maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/manifest-icon-512.maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },

        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico}"],

          navigateFallback: "/index.html",

          navigateFallbackDenylist: [/^\/api\//],

          cleanupOutdatedCaches: true,

          runtimeCaching: [
            // ── Backend API — issue reads
            {
              urlPattern: new RegExp(`^${apiOriginPattern}/api/issues`),
              handler: "NetworkFirst",
              options: {
                cacheName: "nepalSewa-api-issues",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 24h
                cacheableResponse: { statuses: [0, 200] },
                fetchOptions: {
                  credentials: "include",
                },
              },
            },

            // ── Cloudinary issue photos
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "nepalSewa-cloudinary-images",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                }, // 30d
                cacheableResponse: { statuses: [0, 200] },
              },
            },

            // ── OpenStreetMap tiles
            {
              urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "nepalSewa-map-tiles",
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },

            // ── Google Fonts
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "nepalSewa-google-fonts-stylesheets",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "nepalSewa-google-fonts-webfonts",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  };
});
