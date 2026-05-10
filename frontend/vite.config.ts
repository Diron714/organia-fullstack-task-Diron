import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const apiProxy = {
  "/api": {
    target: "http://localhost:8080",
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
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
