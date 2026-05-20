import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps vendor code separate from app code
        manualChunks: {
          // React core — cached separately, never changes
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI icons — large, separate chunk
          "vendor-lucide": ["lucide-react"],
          // State management
          "vendor-store": ["zustand"],
        },
      },
    },
    // Minification
    minify: "esbuild",
    // Source maps off in production
    sourcemap: false,
    // Target modern browsers — smaller output
    target: "es2020",
  },
  // Optimize deps pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "zustand"],
  },
});
