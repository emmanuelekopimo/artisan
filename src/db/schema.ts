import { relations } from "drizzle-orm";
import {
  customType,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const roleEnum = pgEnum("role", ["customer", "provider", "admin"]);
export const providerStatusEnum = pgEnum("provider_status", ["pending", "verified", "rejected"]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "pending",
  "quoted",
  "accepted",
  "declined",
  "completed",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("customer"),
    phone: text("phone"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
});

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  areaId: integer("area_id")
    .notNull()
    .references(() => areas.id),
  businessName: text("business_name").notNull(),
  bio: text("bio").notNull(),
  yearsExperience: integer("years_experience").notNull().default(0),
  startingPrice: integer("starting_price").notNull().default(0),
  avatarUrl: text("avatar_url"),
  status: providerStatusEnum("status").notNull().default("pending"),
  rating: real("rating").notNull().default(0),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  rejectionReason: text("rejection_reason"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workPhotos = pgTable("work_photos", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Uploaded image bytes. Stored in Postgres so uploads survive redeploys on ephemeral hosts. */
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  providerId: integer("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  details: text("details").notNull(),
  address: text("address").notNull(),
  preferredDate: text("preferred_date"),
  status: quoteStatusEnum("status").notNull().default("pending"),
  quotedPrice: integer("quoted_price"),
  providerNote: text("provider_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, { fields: [providers.userId], references: [users.id] }),
  category: one(categories, { fields: [providers.categoryId], references: [categories.id] }),
  area: one(areas, { fields: [providers.areaId], references: [areas.id] }),
  photos: many(workPhotos),
}));

export const workPhotosRelations = relations(workPhotos, ({ one }) => ({
  provider: one(providers, { fields: [workPhotos.providerId], references: [providers.id] }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  customer: one(users, { fields: [quoteRequests.customerId], references: [users.id] }),
  provider: one(providers, { fields: [quoteRequests.providerId], references: [providers.id] }),
}));

export type User = typeof users.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Area = typeof areas.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type Role = User["role"];
export type QuoteStatus = QuoteRequest["status"];
