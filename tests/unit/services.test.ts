import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, pg } from "@/db";
import { providers, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { authenticate, createUser } from "@/lib/services/users";
import { listAreas, listCategories } from "@/lib/services/catalog";
import {
  addWorkPhoto, adminStats, deleteWorkPhoto, getProvider, getProviderByUser, getUpload,
  listProvidersForAdmin, searchProviders, setProviderStatus, upsertProviderProfile,
} from "@/lib/services/providers";
import {
  createQuoteRequest, customerAccept, customerDecline, listQuotesForCustomer, listQuotesForProvider,
  markCompleted, providerDecline, sendQuote,
} from "@/lib/services/quotes";

afterAll(async () => pg.end());

const uniq = () => Math.random().toString(36).slice(2, 8);
const userByEmail = async (email: string) => (await db.query.users.findFirst({ where: eq(users.email, email) }))!;

describe("seed data", () => {
  it("loads trades, areas and artisans", async () => {
    expect((await listCategories()).map((c) => c.slug)).toEqual(["plumber", "electrician", "tailor", "mechanic", "carpenter", "painter"]);
    expect(await listAreas()).toHaveLength(8);
    const stats = await adminStats();
    expect(stats.verified).toBeGreaterThanOrEqual(18);
    expect(stats.pending).toBeGreaterThanOrEqual(3);
  });
});

describe("users", () => {
  it("registers, prevents duplicates and authenticates", async () => {
    const email = `u-${uniq()}@test.ng`;
    const u = await createUser({ name: "Test User", email: email.toUpperCase(), password: "secret123", role: "customer" });
    expect(u.email).toBe(email);
    expect(u.passwordHash).not.toBe("secret123");
    await expect(createUser({ name: "Again", email, password: "secret123", role: "customer" })).rejects.toThrow(AppError);
    expect((await authenticate(email, "secret123")).id).toBe(u.id);
    await expect(authenticate(email, "wrong-pass")).rejects.toThrow("Incorrect email or password");
  });
});

describe("provider search", () => {
  it("only ever returns verified artisans", async () => {
    const all = await searchProviders();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((p) => p.status === "verified")).toBe(true);
    expect(all.find((p) => p.businessName === "Obi Electric Hub")).toBeUndefined();
  });
  it("filters by category and area", async () => {
    const plumbers = await searchProviders({ category: "plumber" });
    expect(plumbers.every((p) => p.categorySlug === "plumber")).toBe(true);
    const yabaPlumbers = await searchProviders({ category: "plumber", area: "yaba" });
    expect(yabaPlumbers.map((p) => p.businessName)).toEqual(["Bakare Plumbing Works"]);
    expect(await searchProviders({ category: "mechanic", area: "yaba" })).toHaveLength(0);
  });
  it("searches by text and sorts", async () => {
    expect((await searchProviders({ q: "agbada" })).map((p) => p.businessName)).toContain("Royal Stitches");
    const byPrice = await searchProviders({ sort: "price" });
    const prices = byPrice.map((p) => p.startingPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const byRating = await searchProviders();
    expect(byRating[0]!.rating).toBeGreaterThanOrEqual(byRating.at(-1)!.rating);
  });
  it("includes a cover photo for each card", async () => {
    const [first] = await searchProviders({ category: "tailor" });
    expect(first!.coverUrl).toMatch(/^\/images\/work\/tailor-\d\.svg$/);
  });
});

describe("provider onboarding and verification", () => {
  it("creates a pending profile, uploads photos, and goes live once verified", async () => {
    const [cat] = await listCategories();
    const [area] = await listAreas();
    const user = await createUser({ name: "New Artisan", email: `a-${uniq()}@test.ng`, password: "secret123", role: "provider" });
    const profile = await upsertProviderProfile(user.id, { businessName: `Zed Fixers ${uniq()}`, categoryId: cat!.id, areaId: area!.id, bio: "Reliable repairs for every home.", yearsExperience: 3, startingPrice: 4000 });
    expect(profile.status).toBe("pending");
    expect((await searchProviders({ q: profile.businessName })).length).toBe(0);
    expect((await listProvidersForAdmin("pending")).some((p) => p.id === profile.id)).toBe(true);

    const photo = await addWorkPhoto(profile.id, { mime: "image/png", data: Buffer.from([137, 80, 78, 71]) }, "Before and after");
    expect(photo.url).toMatch(/^\/api\/uploads\/\d+$/);
    const upload = await getUpload(Number(photo.url.split("/").pop()));
    expect(upload?.mime).toBe("image/png");
    expect((await getProvider(profile.id))!.photos).toHaveLength(1);

    await setProviderStatus(profile.id, "verified");
    const found = await searchProviders({ q: profile.businessName });
    expect(found).toHaveLength(1);
    expect((await getProviderByUser(user.id))!.verifiedAt).toBeInstanceOf(Date);

    await deleteWorkPhoto(profile.id, photo.id);
    await expect(deleteWorkPhoto(profile.id, photo.id)).rejects.toThrow("Photo not found");
  });

  it("puts a rejected profile back in the queue when edited", async () => {
    const [cat] = await listCategories();
    const [area] = await listAreas();
    const user = await createUser({ name: "Retry", email: `r-${uniq()}@test.ng`, password: "secret123", role: "provider" });
    const input = { businessName: "Retry Works", categoryId: cat!.id, areaId: area!.id, bio: "Trying again with better photos.", yearsExperience: 1, startingPrice: 1000 };
    const p = await upsertProviderProfile(user.id, input);
    const rejected = await setProviderStatus(p.id, "rejected", "Blurry photos");
    expect(rejected.rejectionReason).toBe("Blurry photos");
    const again = await upsertProviderProfile(user.id, { ...input, bio: "Trying again with much clearer photos." });
    expect(again.id).toBe(p.id);
    expect(again.status).toBe("pending");
    expect(again.rejectionReason).toBeNull();
  });

  it("refuses profiles for customer accounts", async () => {
    const user = await createUser({ name: "Cust", email: `c-${uniq()}@test.ng`, password: "secret123", role: "customer" });
    await expect(upsertProviderProfile(user.id, { businessName: "X", categoryId: 1, areaId: 1, bio: "x".repeat(30), yearsExperience: 1, startingPrice: 1 })).rejects.toThrow(AppError);
  });

  it("errors for a missing provider", async () => {
    await expect(setProviderStatus(999999, "verified")).rejects.toThrow("Provider not found");
  });
});

describe("quote requests", () => {
  const job = { title: "Fix the tap", details: "The kitchen tap drips all night long.", address: "Yaba" };

  it("runs the full lifecycle: request → quote → accept → complete", async () => {
    const customer = await createUser({ name: "Q Cust", email: `q-${uniq()}@test.ng`, password: "secret123", role: "customer" });
    const tunde = await userByEmail("tunde@artisan.ng");
    const provider = (await getProviderByUser(tunde.id))!;

    const q = await createQuoteRequest(customer.id, { providerId: provider.id, ...job });
    expect(q.status).toBe("pending");
    expect((await listQuotesForProvider(provider.id)).some((r) => r.quote.id === q.id)).toBe(true);

    await expect(customerAccept(customer.id, q.id)).rejects.toThrow("cannot be marked accepted");
    const quoted = await sendQuote(tunde.id, q.id, 12000, "Includes parts");
    expect(quoted).toMatchObject({ status: "quoted", quotedPrice: 12000, providerNote: "Includes parts" });

    expect((await customerAccept(customer.id, q.id)).status).toBe("accepted");
    const before = (await db.query.providers.findFirst({ where: eq(providers.id, provider.id) }))!.jobsCompleted;
    expect((await markCompleted(tunde.id, q.id)).status).toBe("completed");
    const after = (await db.query.providers.findFirst({ where: eq(providers.id, provider.id) }))!.jobsCompleted;
    expect(after).toBe(before + 1);

    const mine = await listQuotesForCustomer(customer.id);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.businessName).toBe("Bakare Plumbing Works");
  });

  it("lets either side decline at the right time", async () => {
    const customer = await createUser({ name: "D Cust", email: `d-${uniq()}@test.ng`, password: "secret123", role: "customer" });
    const tunde = await userByEmail("tunde@artisan.ng");
    const provider = (await getProviderByUser(tunde.id))!;
    const a = await createQuoteRequest(customer.id, { providerId: provider.id, ...job });
    expect((await providerDecline(tunde.id, a.id, "Fully booked")).status).toBe("declined");
    const b = await createQuoteRequest(customer.id, { providerId: provider.id, ...job });
    await sendQuote(tunde.id, b.id, 50000);
    expect((await customerDecline(customer.id, b.id)).status).toBe("declined");
  });

  it("enforces ownership and roles", async () => {
    const customer = await createUser({ name: "O Cust", email: `o-${uniq()}@test.ng`, password: "secret123", role: "customer" });
    const stranger = await createUser({ name: "Stranger", email: `s-${uniq()}@test.ng`, password: "secret123", role: "customer" });
    const tunde = await userByEmail("tunde@artisan.ng");
    const chidi = await userByEmail("chidi@artisan.ng");
    const provider = (await getProviderByUser(tunde.id))!;
    const q = await createQuoteRequest(customer.id, { providerId: provider.id, ...job });
    await expect(sendQuote(chidi.id, q.id, 100)).rejects.toThrow("You cannot change this request");
    await sendQuote(tunde.id, q.id, 100);
    await expect(customerAccept(stranger.id, q.id)).rejects.toThrow("You cannot change this request");
    await expect(createQuoteRequest(tunde.id, { providerId: provider.id, ...job })).rejects.toThrow("Only customers");
  });

  it("refuses requests to unverified artisans", async () => {
    const customer = await userByEmail("customer@artisan.ng");
    const pending = (await listProvidersForAdmin("pending"))[0]!;
    await expect(createQuoteRequest(customer.id, { providerId: pending.id, ...job })).rejects.toThrow("not available");
  });
});
