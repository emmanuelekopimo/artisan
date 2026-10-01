"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setProviderStatus } from "@/lib/services/providers";
import { requireRole } from "@/lib/session";
import { attempt, str, withMessage } from "./helpers";

export async function verifyProviderAction(fd: FormData) {
  await requireRole("admin");
  const back = str(fd, "back").startsWith("/admin") ? str(fd, "back") : "/admin";
  await attempt(back, () => setProviderStatus(Number(str(fd, "providerId")), "verified"));
  revalidatePath("/artisans");
  redirect(withMessage(back, "ok", "Artisan verified and now visible to customers"));
}

export async function rejectProviderAction(fd: FormData) {
  await requireRole("admin");
  const back = str(fd, "back").startsWith("/admin") ? str(fd, "back") : "/admin";
  await attempt(back, () => setProviderStatus(Number(str(fd, "providerId")), "rejected", str(fd, "reason")));
  revalidatePath("/artisans");
  redirect(withMessage(back, "ok", "Artisan rejected"));
}
