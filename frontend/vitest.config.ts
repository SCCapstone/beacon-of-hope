import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", // Simulate a browser environment
    globals: true, // Enables Jest-like global functions (describe, it, expect)
  },
});
