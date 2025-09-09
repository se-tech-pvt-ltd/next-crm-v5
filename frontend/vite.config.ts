import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// Removed runtime error overlay plugin due to instability of overlay
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: { overlay: false },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: ["sales.crm-setech.cloud"],
  },
});
