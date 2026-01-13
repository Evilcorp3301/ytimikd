import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
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
    // Оптимизации для production
    minify: "esbuild", // Быстрее чем terser, достаточно для большинства случаев
    cssCodeSplit: true, // Разделение CSS для лучшего кэширования
    sourcemap: false, // Отключить sourcemaps в production для уменьшения размера
    reportCompressedSize: true, // Показывать сжатый размер бандла
    chunkSizeWarningLimit: 1000, // Увеличить лимит предупреждений
    rollupOptions: {
      output: {
        // Code splitting для лучшей загрузки
        // Важно: React должен быть в основном bundle или загружаться первым
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            // React и react-dom должны быть в основном bundle для правильной загрузки
            // Или загружаться первыми, поэтому оставляем их в основном bundle
            if (id.includes("react") || id.includes("react-dom")) {
              // Не разделяем React - оставляем в основном bundle
              return undefined;
            }
            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Остальные node_modules
            return "vendor";
          }
        },
        // Оптимизация имен файлов для кэширования
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return `assets/[name]-[hash][extname]`;
          }
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    allowedHosts: ["truistic-kaidence-citable.ngrok-free.dev", ".ngrok-free.dev", ".ngrok.dev"],
  },
});
