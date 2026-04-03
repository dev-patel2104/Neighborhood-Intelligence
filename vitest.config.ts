import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["server/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@server": path.resolve(__dirname, "server"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
