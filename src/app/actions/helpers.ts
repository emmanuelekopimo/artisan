import "server-only";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { firstError } from "@/lib/validation";

export function withMessage(path: string, key: "error" | "ok", message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(message)}`;
}

/** Runs `fn`; user-facing errors redirect back to `back` with ?error=..., anything else is rethrown. */
export async function attempt<T>(back: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) redirect(withMessage(back, "error", e.message));
    if (e instanceof ZodError) redirect(withMessage(back, "error", firstError(e)));
    throw e;
  }
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function formObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}
