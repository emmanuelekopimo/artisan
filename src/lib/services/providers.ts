import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { areas, categories, providers, quoteRequests, uploads, users, workPhotos } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { SearchParams } from "@/lib/validation";

const providerCard = {
  id: providers.id,
  businessName: providers.businessName,
  bio: providers.bio,
  yearsExperience: providers.yearsExperience,
  startingPrice: providers.startingPrice,
  avatarUrl: providers.avatarUrl,
  rating: providers.rating,
  jobsCompleted: providers.jobsCompleted,
  status: providers.status,
  ownerName: users.name,
  categoryName: categories.name,
  categorySlug: categories.slug,
  categoryIcon: categories.icon,
  areaName: areas.name,
  areaSlug: areas.slug,
  coverUrl: sql<string | null>`(select url from work_photos wp where wp.provider_id = ${providers.id} order by wp.id limit 1)`,
};

/** Public search: only verified providers are ever returned. */
export async function searchProviders(params: SearchParams = {}) {
  const filters = [eq(providers.status, "verified")];
  if (params.category) filters.push(eq(categories.slug, params.category));
  if (params.area) filters.push(eq(areas.slug, params.area));
  if (params.q) {
    const like = `%${params.q}%`;
    filters.push(or(ilike(providers.businessName, like), ilike(users.name, like), ilike(providers.bio, like))!);
  }
  const order =
    params.sort === "price"
      ? [asc(providers.startingPrice)]
      : params.sort === "experience"
        ? [desc(providers.yearsExperience)]
        : [desc(providers.rating), desc(providers.jobsCompleted)];
  return db
    .select(providerCard)
    .from(providers)
    .innerJoin(users, eq(users.id, providers.userId))
    .innerJoin(categories, eq(categories.id, providers.categoryId))
    .innerJoin(areas, eq(areas.id, providers.areaId))
    .where(and(...filters))
    .orderBy(...order, asc(providers.id));
}

export type ProviderCard = Awaited<ReturnType<typeof searchProviders>>[number];

export async function getProvider(id: number) {
  const [row] = await db
    .select({ ...providerCard, phone: users.phone, email: users.email, userId: providers.userId, rejectionReason: providers.rejectionReason, createdAt: providers.createdAt, verifiedAt: providers.verifiedAt })
    .from(providers)
    .innerJoin(users, eq(users.id, providers.userId))
    .innerJoin(categories, eq(categories.id, providers.categoryId))
    .innerJoin(areas, eq(areas.id, providers.areaId))
    .where(eq(providers.id, id));
  if (!row) return null;
  const photos = await db.select().from(workPhotos).where(eq(workPhotos.providerId, id)).orderBy(asc(workPhotos.id));
  return { ...row, photos };
}

export async function getProviderByUser(userId: number) {
  const p = await db.query.providers.findFirst({ where: eq(providers.userId, userId) });
  return p ? getProvider(p.id) : null;
}

export async function upsertProviderProfile(
  userId: number,
  input: { businessName: string; categoryId: number; areaId: number; bio: string; yearsExperience: number; startingPrice: number },
) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.role !== "provider") throw new AppError("Only artisan accounts can create a profile");
  const existing = await db.query.providers.findFirst({ where: eq(providers.userId, userId) });
  if (existing) {
    // Editing a rejected profile sends it back to the admin queue.
    const status = existing.status === "rejected" ? "pending" : existing.status;
    const [p] = await db
      .update(providers)
      .set({ ...input, status, rejectionReason: status === "pending" ? null : existing.rejectionReason })
      .where(eq(providers.id, existing.id))
      .returning();
    return p!;
  }
  const [p] = await db.insert(providers).values({ ...input, userId, status: "pending" }).returning();
  return p!;
}

export async function addWorkPhoto(providerId: number, file: { mime: string; data: Buffer }, caption: string) {
  const [upload] = await db.insert(uploads).values({ mime: file.mime, data: file.data }).returning({ id: uploads.id });
  const [photo] = await db
    .insert(workPhotos)
    .values({ providerId, url: `/api/uploads/${upload!.id}`, caption: caption.slice(0, 100) })
    .returning();
  return photo!;
}

export async function deleteWorkPhoto(providerId: number, photoId: number) {
  const deleted = await db
    .delete(workPhotos)
    .where(and(eq(workPhotos.id, photoId), eq(workPhotos.providerId, providerId)))
    .returning();
  if (!deleted.length) throw new AppError("Photo not found");
}

export async function getUpload(id: number) {
  return db.query.uploads.findFirst({ where: eq(uploads.id, id) });
}

/* ---------- admin ---------- */

export async function listProvidersForAdmin(status?: "pending" | "verified" | "rejected") {
  return db
    .select({ ...providerCard, email: users.email, phone: users.phone, createdAt: providers.createdAt, photoCount: sql<number>`(select count(*)::int from work_photos wp where wp.provider_id = ${providers.id})` })
    .from(providers)
    .innerJoin(users, eq(users.id, providers.userId))
    .innerJoin(categories, eq(categories.id, providers.categoryId))
    .innerJoin(areas, eq(areas.id, providers.areaId))
    .where(status ? eq(providers.status, status) : undefined)
    .orderBy(desc(providers.createdAt), desc(providers.id));
}

export async function setProviderStatus(providerId: number, status: "verified" | "rejected", reason?: string) {
  const [p] = await db
    .update(providers)
    .set({
      status,
      verifiedAt: status === "verified" ? new Date() : null,
      rejectionReason: status === "rejected" ? reason || "Profile did not meet our requirements" : null,
    })
    .where(eq(providers.id, providerId))
    .returning();
  if (!p) throw new AppError("Provider not found");
  return p;
}

export async function adminStats() {
  const byStatus = await db.select({ status: providers.status, n: count() }).from(providers).groupBy(providers.status);
  const [customers] = await db.select({ n: count() }).from(users).where(eq(users.role, "customer"));
  const [quotes] = await db.select({ n: count() }).from(quoteRequests);
  const get = (s: string) => byStatus.find((r) => r.status === s)?.n ?? 0;
  return {
    verified: get("verified"),
    pending: get("pending"),
    rejected: get("rejected"),
    customers: customers!.n,
    quotes: quotes!.n,
  };
}
