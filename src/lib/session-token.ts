import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/db/schema";

export type SessionPayload = { userId: number; role: Role; name: string };

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET || "artisan-dev-secret-change-me");

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return { userId: Number(payload.userId), role: payload.role as Role, name: String(payload.name) };
  } catch {
    return null;
  }
}
