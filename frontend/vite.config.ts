import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const devProxy = {
  "/api": {
    target: "http://localhost:8080",
    changeOrigin: true
  },
  "/uploads": {
    target: "http://localhost:8080",
    changeOrigin: true
  },
  "/ws": {
    target: "http://localhost:8080",
    ws: true,
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [
    react(),
    {
      name: "favicon-ico-alias",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/favicon.ico") {
            res.statusCode = 302;
            res.setHeader("Location", "/favicon.svg");
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173,
    proxy: devProxy
  },
  preview: {
    proxy: devProxy
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          charts: ["recharts"],
          dnd: ["@dnd-kit/core", "@dnd-kit/sortable"]
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
