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
]);
