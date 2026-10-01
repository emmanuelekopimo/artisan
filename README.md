# Artisan

**Find trusted artisans near you.** Artisan is a marketplace for plumbers, electricians, tailors, mechanics, carpenters and painters. Artisans register with a trade, an area and photos of past work. Admins verify them, and customers filter by category and location and request a quote. The UI is inspired by the Uber app.

📄 **Full illustrated guide:** [`docs/Artisan-Documentation.pdf`](docs/Artisan-Documentation.pdf)

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript**
- **PostgreSQL** + **Drizzle ORM** (schema in `src/db/schema.ts`, migrations in `drizzle/`)
- Zod validation, bcrypt passwords, signed JWT session cookie (jose)
- Lucide icons, DiceBear avatars, Inter font (all self-hosted)
- Vitest (unit + integration) and Playwright (end-to-end)

## Quick start

```bash
cp .env.example .env        # set DATABASE_URL and SESSION_SECRET
npm install
npm run db:deploy           # migrate + load sample data
npm run dev                 # http://localhost:3000
```

### Demo accounts (password `password123`)

| Role     | Email                 |
|----------|-----------------------|
| Customer | customer@artisan.ng   |
| Artisan  | tunde@artisan.ng      |
| Admin    | admin@artisan.ng      |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server |
| `npm run db:generate` | Generate a migration after editing the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Reset and load the sample data (22 artisans, 3 customers, 1 admin) |
| `npm test` | Unit + integration tests against `artisan_test` (Postgres) |
| `npm run test:e2e` | Playwright end-to-end tests (run `npm run build` first) |
| `npm run images` | Regenerate the sample artwork in `public/images` |
| `npm run docs:pdf` | Rebuild `docs/Artisan-Documentation.pdf` (app must be running on a freshly seeded DB) |

Tests expect a Postgres test database at `postgres://postgres:postgres@localhost:5432/artisan_test` (override with `TEST_DATABASE_URL`).

## Deploying to Railway

```bash
railway login
railway link                       # pick the "school-projects" project
railway add --database postgres
railway variables --set "SESSION_SECRET=$(openssl rand -hex 32)" --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
railway up
railway run npm run db:seed        # once, to load the sample data
```

`railway.json` builds with `npm run build` and runs migrations on every start.

## Project layout

```
src/app/            pages (home, artisans, dashboard, admin, auth) and server actions
src/lib/services/   business logic: users, providers, quotes, catalog
src/db/             Drizzle schema, migrations runner, seed + sample data
tests/unit/         Vitest suites (run against a real Postgres)
tests/e2e/          Playwright suites
scripts/            artwork generator and PDF documentation builder
docs/               PDF guide + screenshots
```
