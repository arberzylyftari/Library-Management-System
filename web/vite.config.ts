import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    // jsdom's default document URL is "about:blank", an opaque origin where
    // the Storage API (localStorage) isn't available — the app relies on it
    // for the auth token and theme, so tests need a real origin.
    environmentOptions: { jsdom: { url: "http://localhost:3000" } },
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  server: {
    proxy: {
      // Proxy API calls to the backend during dev so the app can use
      // same-origin "/api/..." requests without CORS friction.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
