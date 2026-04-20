import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.svg"],
      manifest: {
        name: "Snappy — beautiful screenshots, instantly",
        short_name: "Snappy",
        description:
          "Turn any screenshot into a beautiful shareable image. 100% client-side, free, open source, no signup.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0b0b0c",
        theme_color: "#0b0b0c",
        categories: ["design", "productivity", "graphics"],
        icons: [
          { src: "/icons/snappy.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          {
            src: "/icons/snappy-mask.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,png,webp}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "three"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
    ],
  },
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          konva: ["konva", "react-konva"],
          three: ["three"],
          "three-r3f": ["@react-three/fiber", "@react-three/drei"],
          state: ["zustand", "zundo", "immer"],
          db: ["dexie", "lz-string"],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
