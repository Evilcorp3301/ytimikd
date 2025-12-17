import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0", // Allow access from local network
    port: 5173, // Vite dev server port (only used in dev mode)
    strictPort: false,
    allowedHosts: true,
    hmr: {
      host: "localhost", // HMR will use localhost, but server accepts connections from network
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
