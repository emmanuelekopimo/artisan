import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.resolve(dir, "src") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/artisan_test" },
    fileParallelism: false,
    globalSetup: "./tests/unit/global-setup.ts",
  },
});
