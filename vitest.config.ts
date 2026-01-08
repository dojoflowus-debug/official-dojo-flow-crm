import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "./shared"),
      "@": path.resolve(import.meta.dirname, "./client/src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/**/*.test.tsx", "client/**/*.spec.tsx"],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
