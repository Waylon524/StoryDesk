import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://127.0.0.1/"
      }
    },
    globals: true,
    setupFiles: "./src/test/setup.ts"
  }
});
