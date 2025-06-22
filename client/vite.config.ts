import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import fs from "fs";

// Custom plugin to create directory structure for IPFS routing
function ipfsRouting(): Plugin {
  return {
    name: "ipfs-routing",
    writeBundle(options) {
      // Routes that need directory structure for trailing slash support
      const routes = ["account", "readings", "contacts", "notes", "tree-test"];

      const outDir = options.dir || "dist";

      // Read the main index.html
      const indexPath = path.join(outDir, "index.html");
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, "utf-8");

        // Create directory structure for each route
        routes.forEach((route) => {
          const routeDir = path.join(outDir, route);
          if (!fs.existsSync(routeDir)) {
            fs.mkdirSync(routeDir, { recursive: true });
          }
          fs.writeFileSync(path.join(routeDir, "index.html"), indexContent);
        });
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ipfsRouting()],
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  base: "./",
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
