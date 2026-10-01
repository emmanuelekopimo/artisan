import { z } from "zod";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const registerSchema = z.object({
  name: trimmed(2, 80, "Name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  role: z.enum(["customer", "provider"]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const providerProfileSchema = z.object({
  businessName: trimmed(2, 80, "Business name"),
  categoryId: z.coerce.number().int().positive("Choose a trade"),
  areaId: z.coerce.number().int().positive("Choose an area"),
  bio: trimmed(20, 600, "About"),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  startingPrice: z.coerce.number().int().min(0).max(10_000_000),
});

export const quoteRequestSchema = z.object({
  providerId: z.coerce.number().int().positive(),
  title: trimmed(3, 100, "Job title"),
  details: trimmed(10, 1000, "Job details"),
  address: trimmed(3, 200, "Address"),
  preferredDate: z.string().trim().max(20).optional().or(z.literal("")),
});

export const quoteResponseSchema = z.object({
  quoteId: z.coerce.number().int().positive(),
  price: z.coerce.number().int().positive("Enter a price greater than zero"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const searchSchema = z.object({
  category: z.string().trim().optional(),
  area: z.string().trim().optional(),
  q: z.string().trim().max(60).optional(),
  sort: z.enum(["rating", "price", "experience"]).optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Invalid input";
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
