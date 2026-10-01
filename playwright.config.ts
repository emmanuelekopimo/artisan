import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/artisan_test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Fresh schema + sample data, then the production build (run `npm run build` first).
    command: `npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { DATABASE_URL, SESSION_SECRET: "e2e-secret" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
