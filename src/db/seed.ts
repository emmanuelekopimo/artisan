import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { ADMIN, AREAS, CATEGORIES, PHOTO_CAPTIONS, SAMPLE_CUSTOMERS, SAMPLE_PASSWORD, SAMPLE_PROVIDERS } from "./sample-data";

/** Wipes every table and loads the sample marketplace. Safe to re-run. */
export async function seed(url: string) {
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });
  const { users, categories, areas, providers, workPhotos, quoteRequests } = schema;

  await client`TRUNCATE quote_requests, work_photos, uploads, providers, users, categories, areas RESTART IDENTITY CASCADE`;

  const hash = await bcrypt.hash(SAMPLE_PASSWORD, 10);
  const cats = await db.insert(categories).values([...CATEGORIES]).returning();
  const ars = await db.insert(areas).values([...AREAS]).returning();
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;
  const areaId = (slug: string) => ars.find((a) => a.slug === slug)!.id;

  await db.insert(users).values({ name: ADMIN.name, email: ADMIN.email, passwordHash: hash, role: "admin" });
  const customers = await db
    .insert(users)
    .values(SAMPLE_CUSTOMERS.map((c) => ({ ...c, passwordHash: hash, role: "customer" as const })))
    .returning();

  const day = 24 * 60 * 60 * 1000;
  const insertedProviders: (schema.Provider & { sample: (typeof SAMPLE_PROVIDERS)[number] })[] = [];
  for (const [i, p] of SAMPLE_PROVIDERS.entries()) {
    const [u] = await db
      .insert(users)
      .values({ name: p.name, email: p.email, phone: p.phone, passwordHash: hash, role: "provider" })
      .returning();
    const createdAt = new Date(Date.now() - (60 - i) * day);
    const [prov] = await db
      .insert(providers)
      .values({
        userId: u!.id,
        categoryId: catId(p.category),
        areaId: areaId(p.area),
        businessName: p.business,
        bio: p.bio,
        yearsExperience: p.years,
        startingPrice: p.price,
        avatarUrl: `/images/avatars/${p.avatar}.svg`,
        status: p.status,
        rating: p.rating,
        jobsCompleted: p.jobs,
        rejectionReason: p.status === "rejected" ? "Work photos were unclear. Please upload clearer pictures of finished jobs." : null,
        verifiedAt: p.status === "verified" ? new Date(createdAt.getTime() + 2 * day) : null,
        createdAt,
      })
      .returning();
    insertedProviders.push({ ...prov!, sample: p });
    const captions = PHOTO_CAPTIONS[p.category]!;
    const photoCount = p.status === "verified" ? 4 : 3;
    await db.insert(workPhotos).values(
      Array.from({ length: photoCount }, (_, k) => {
        const n = ((i + k) % 6) + 1;
        return { providerId: prov!.id, url: `/images/work/${p.category}-${n}.svg`, caption: captions[n - 1]! };
      }),
    );
  }

  // A few quote requests in every state so the dashboards have something to show.
  const byEmail = (e: string) => insertedProviders.find((p) => p.sample.email === e)!;
  const amaka = customers[0]!;
  const david = customers[1]!;
  const fatima = customers[2]!;
  const ago = (d: number) => new Date(Date.now() - d * day);
  await db.insert(quoteRequests).values([
    { customerId: amaka.id, providerId: byEmail("tunde@artisan.ng").id, title: "Leaking kitchen sink", details: "Water drips under the sink whenever the tap is on. Pipe looks rusty.", address: "12 Herbert Macaulay Way, Yaba", preferredDate: "2026-10-04", status: "quoted", quotedPrice: 15000, providerNote: "Includes replacing the waste pipe and trap. Can come Saturday morning.", createdAt: ago(2), updatedAt: ago(1) },
    { customerId: amaka.id, providerId: byEmail("aisha@artisan.ng").id, title: "Aso-ebi gown for wedding", details: "Lace gown, mermaid style, I have the fabric. Needed in 3 weeks.", address: "Lekki Phase 1", preferredDate: "2026-10-20", status: "pending", createdAt: ago(0.2), updatedAt: ago(0.2) },
    { customerId: amaka.id, providerId: byEmail("emeka@artisan.ng").id, title: "Install 3.5kVA inverter", details: "I bought the inverter and 2 batteries. Need installation and changeover.", address: "Allen Avenue, Ikeja", status: "accepted", quotedPrice: 35000, providerNote: "Price covers cabling and changeover switch.", createdAt: ago(6), updatedAt: ago(4) },
    { customerId: amaka.id, providerId: byEmail("yusuf@artisan.ng").id, title: "Car AC not cooling", details: "Toyota Corolla 2012, AC blows warm air.", address: "Ikeja GRA", status: "completed", quotedPrice: 25000, providerNote: "Re-gas and compressor check.", createdAt: ago(20), updatedAt: ago(15) },
    { customerId: david.id, providerId: byEmail("tunde@artisan.ng").id, title: "Install new water heater", details: "Replace old 30L heater in the master bathroom.", address: "Akoka, Yaba", status: "pending", createdAt: ago(0.5), updatedAt: ago(0.5) },
    { customerId: fatima.id, providerId: byEmail("tunde@artisan.ng").id, title: "Blocked toilet", details: "Toilet in guest bathroom is blocked.", address: "Sabo, Yaba", status: "completed", quotedPrice: 8000, providerNote: "Done, thanks!", createdAt: ago(12), updatedAt: ago(11) },
    { customerId: david.id, providerId: byEmail("bola@artisan.ng").id, title: "Built-in wardrobe", details: "Two-door wardrobe with sliding doors, 2.4m wide.", address: "Onike, Yaba", status: "declined", quotedPrice: 450000, providerNote: "Price includes Mahogany wood.", createdAt: ago(9), updatedAt: ago(7) },
  ]);

  await client.end();
  return { providers: insertedProviders.length, customers: customers.length };
}

/** True when the catalog has never been loaded (fresh database). */
export async function isEmpty(url: string) {
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const [row] = await client`SELECT count(*)::int AS n FROM categories`;
  await client.end();
  return row!.n === 0;
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const url = process.env.DATABASE_URL!;
  const onlyIfEmpty = process.argv.includes("--if-empty");
  (async () => {
    if (onlyIfEmpty && !(await isEmpty(url))) {
      console.log("✓ database already has data, skipping seed");
      return;
    }
    const r = await seed(url);
    console.log(`✓ seeded ${r.providers} artisans, ${r.customers} customers, 1 admin`);
    console.log(`  sample password for every account: ${SAMPLE_PASSWORD}`);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

