import { describe, expect, it } from "vitest";
import { canTransition, STATUS_LABEL } from "@/lib/quote-status";
import { initials, naira, timeAgo } from "@/lib/format";
import { loginSchema, providerProfileSchema, quoteRequestSchema, registerSchema } from "@/lib/validation";
import { signSession, verifySession } from "@/lib/session-token";

describe("quote state machine", () => {
  it("allows the happy path with the right actors", () => {
    expect(canTransition("pending", "quoted", "provider")).toBe(true);
    expect(canTransition("quoted", "accepted", "customer")).toBe(true);
    expect(canTransition("accepted", "completed", "provider")).toBe(true);
  });
  it("blocks wrong actors and illegal jumps", () => {
    expect(canTransition("pending", "quoted", "customer")).toBe(false);
    expect(canTransition("quoted", "accepted", "provider")).toBe(false);
    expect(canTransition("pending", "completed", "provider")).toBe(false);
    expect(canTransition("completed", "pending", "admin")).toBe(false);
    expect(canTransition("declined", "quoted", "provider")).toBe(false);
  });
  it("has a label for every status", () => {
    expect(Object.keys(STATUS_LABEL)).toHaveLength(5);
  });
});

describe("formatting", () => {
  it("formats naira", () => {
    expect(naira(15000)).toBe("₦15,000");
    expect(naira(null)).toBe("—");
  });
  it("builds initials", () => expect(initials("tunde  bakare ade")).toBe("TB"));
  it("describes elapsed time", () => {
    const now = new Date("2026-01-02T12:00:00Z");
    expect(timeAgo(new Date("2026-01-02T11:59:50Z"), now)).toBe("just now");
    expect(timeAgo(new Date("2026-01-02T11:00:00Z"), now)).toBe("1 hr ago");
    expect(timeAgo(new Date("2025-12-30T12:00:00Z"), now)).toBe("3 days ago");
  });
});

describe("validation", () => {
  it("normalises emails and requires strong-enough passwords", () => {
    const ok = registerSchema.parse({ name: "Ada", email: "  ADA@Mail.com ", password: "12345678", role: "customer" });
    expect(ok.email).toBe("ada@mail.com");
    expect(registerSchema.safeParse({ name: "Ada", email: "ada@mail.com", password: "short", role: "customer" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ada", email: "ada@mail.com", password: "12345678", role: "admin" }).success).toBe(false);
  });
  it("rejects bad logins", () => expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false));
  it("coerces numeric profile fields", () => {
    const p = providerProfileSchema.parse({ businessName: "Fix It", categoryId: "2", areaId: "3", bio: "I fix many many things well.", yearsExperience: "4", startingPrice: "5000" });
    expect(p.categoryId).toBe(2);
    expect(p.startingPrice).toBe(5000);
  });
  it("requires job details on a quote request", () => {
    const r = quoteRequestSchema.safeParse({ providerId: "1", title: "Fix", details: "short", address: "Yaba" });
    expect(r.success).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ userId: 7, role: "provider", name: "Tunde" });
    expect(await verifySession(token)).toEqual({ userId: 7, role: "provider", name: "Tunde" });
  });
  it("rejects tampered or missing tokens", async () => {
    const token = await signSession({ userId: 7, role: "customer", name: "A" });
    expect(await verifySession(token.slice(0, -2) + "xx")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});
