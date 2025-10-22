import { defineConfig } from "tsup";

export default defineConfig([
  // Backend
  {
    entry: { server: "src/server.ts" },
    format: ["esm"],
    dts: true,
    outDir: "dist",
    clean: true,
    target: "es2022",
  },
  // Frontend widget -> build/main.js
  {
    entry: { main: "frontend/src/chat/chatWidget.ts" },
    format: ["iife"],
    minify: true,
    outDir: "build",
    clean: false, // keep dist from the first build
  },
]);
