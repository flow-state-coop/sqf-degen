import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    eslint(),
    nodePolyfills({
      include: ["buffer"],
    }),
  ],
  server: {
    port: 3000,
    fs: {
      strict: false,
    },
  },
  define: {
    "process.env": {},
    "process.browser": {},
  },
  build: {
    target: "es2020",
    minify: true,
    sourcemap: false,
  },
});
