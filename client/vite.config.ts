import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  worker: {
    format: "es",
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
    exclude: ["@noir-lang/noirc_abi", "@noir-lang/acvm_js"],
  },
});
