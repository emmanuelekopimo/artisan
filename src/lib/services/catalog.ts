import { asc } from "drizzle-orm";
import { db } from "@/db";
import { areas, categories } from "@/db/schema";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.id));
}

export async function listAreas() {
  return db.select().from(areas).orderBy(asc(areas.name));
}
