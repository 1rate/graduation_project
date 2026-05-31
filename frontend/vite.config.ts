import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/graduation_project/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "react";
          }
          if (id.includes("node_modules/react-router-dom")) {
            return "router";
          }
          if (id.includes("node_modules/recharts")) {
            return "charts";
          }
        },
      },
      external: [],
    },
  },
});
