import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // three and react-three as their own vendor chunks (see G5 in scripts/design-verify.mjs). They used to split out on their own because two
        // routes shared them; with the portfolio now a static page, only the ThermalOS kiosk uses
        // them and Rollup would fold them into that route's chunk (over the 260 KB chunk budget).
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three-core";
          if (id.includes("node_modules/@react-three/")) return "react-three";
        },
      },
    },
  },
}));
