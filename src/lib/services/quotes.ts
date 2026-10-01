import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, providers, quoteRequests, users, type QuoteStatus, type Role } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { canTransition } from "@/lib/quote-status";

export async function createQuoteRequest(
  customerId: number,
  input: { providerId: number; title: string; details: string; address: string; preferredDate?: string },
) {
  const customer = await db.query.users.findFirst({ where: eq(users.id, customerId) });
  if (!customer || customer.role !== "customer") throw new AppError("Only customers can request quotes");
  const provider = await db.query.providers.findFirst({ where: eq(providers.id, input.providerId) });
  if (!provider || provider.status !== "verified") throw new AppError("This artisan is not available for quotes");
  const [q] = await db
    .insert(quoteRequests)
    .values({ ...input, preferredDate: input.preferredDate || null, customerId })
    .returning();
  return q!;
}

async function transition(quoteId: number, to: QuoteStatus, actor: { id: number; role: Role }, patch: Partial<typeof quoteRequests.$inferInsert> = {}) {
  const quote = await db.query.quoteRequests.findFirst({ where: eq(quoteRequests.id, quoteId), with: { provider: true } });
  if (!quote) throw new AppError("Quote request not found");
  const owns = actor.role === "customer" ? quote.customerId === actor.id : quote.provider.userId === actor.id;
  if (!owns) throw new AppError("You cannot change this request");
  if (!canTransition(quote.status, to, actor.role)) {
    throw new AppError(`A ${quote.status} request cannot be marked ${to}`);
  }
  const [updated] = await db
    .update(quoteRequests)
    .set({ ...patch, status: to, updatedAt: new Date() })
    .where(eq(quoteRequests.id, quoteId))
    .returning();
  if (to === "completed") {
    await db
      .update(providers)
      .set({ jobsCompleted: quote.provider.jobsCompleted + 1 })
      .where(eq(providers.id, quote.providerId));
  }
  return updated!;
}

export const sendQuote = (providerUserId: number, quoteId: number, price: number, note?: string) =>
  transition(quoteId, "quoted", { id: providerUserId, role: "provider" }, { quotedPrice: price, providerNote: note || null });

export const providerDecline = (providerUserId: number, quoteId: number, note?: string) =>
  transition(quoteId, "declined", { id: providerUserId, role: "provider" }, { providerNote: note || null });

export const customerAccept = (customerId: number, quoteId: number) =>
  transition(quoteId, "accepted", { id: customerId, role: "customer" });

export const customerDecline = (customerId: number, quoteId: number) =>
  transition(quoteId, "declined", { id: customerId, role: "customer" });

export const markCompleted = (providerUserId: number, quoteId: number) =>
  transition(quoteId, "completed", { id: providerUserId, role: "provider" });

export async function listQuotesForCustomer(customerId: number) {
  return db
    .select({
      quote: quoteRequests,
      providerId: providers.id,
      businessName: providers.businessName,
      avatarUrl: providers.avatarUrl,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(quoteRequests)
    .innerJoin(providers, eq(providers.id, quoteRequests.providerId))
    .innerJoin(categories, eq(categories.id, providers.categoryId))
    .where(eq(quoteRequests.customerId, customerId))
    .orderBy(desc(quoteRequests.createdAt), desc(quoteRequests.id));
}

export async function listQuotesForProvider(providerId: number) {
  return db
    .select({ quote: quoteRequests, customerName: users.name, customerPhone: users.phone })
    .from(quoteRequests)
    .innerJoin(users, eq(users.id, quoteRequests.customerId))
    .where(eq(quoteRequests.providerId, providerId))
    .orderBy(desc(quoteRequests.createdAt), desc(quoteRequests.id));
}

export async function getQuote(id: number) {
  return db.query.quoteRequests.findFirst({ where: and(eq(quoteRequests.id, id)) });
}
