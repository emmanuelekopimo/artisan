import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type Role } from "@/db/schema";
import { AppError } from "@/lib/errors";

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw new AppError("An account with this email already exists");
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [user] = await db
    .insert(users)
    .values({ name: input.name, email, passwordHash, role: input.role, phone: input.phone || null })
    .returning();
  return user!;
}

export async function authenticate(email: string, password: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.trim().toLowerCase()) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Incorrect email or password");
  }
  return user;
}

export async function getUser(id: number) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
