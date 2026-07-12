import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: process.env.NODE_ENV === 'production' && process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/',
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
}));
