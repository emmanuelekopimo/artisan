import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/db/schema";
import { signSession, verifySession, type SessionPayload } from "./session-token";

const COOKIE = "artisan_session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(COOKIE)?.value);
}

export async function startSession(payload: SessionPayload) {
  const store = await cookies();
  store.set(COOKIE, await signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Redirects to /login (or home) unless the visitor is signed in with one of the given roles. */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles.length && !roles.includes(session.role)) redirect("/");
  return session;
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : "/dashboard";
}
