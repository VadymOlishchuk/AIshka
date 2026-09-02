import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// Той самий бекенд, що й у платформи: /api проксіюється туди ж.
const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@aishka/core": fileURLToPath(new URL("../../libs/core/src", import.meta.url)),
      "@aishka/ui": fileURLToPath(new URL("../../libs/ui/src", import.meta.url)),
    },
  },
  server: {
    proxy: { "/api": { target: apiTarget, changeOrigin: true } },
  },
  build: { outDir: "dist", sourcemap: false },
});
