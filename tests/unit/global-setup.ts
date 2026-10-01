import { runMigrations } from "../../src/db/migrate";
import { seed } from "../../src/db/seed";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/artisan_test";
  await runMigrations(url);
  await seed(url);
}
