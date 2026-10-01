"use server";

import { redirect } from "next/navigation";
import { createQuoteRequest, customerAccept, customerDecline } from "@/lib/services/quotes";
import { requireRole } from "@/lib/session";
import { quoteRequestSchema } from "@/lib/validation";
import { attempt, formObject, str, withMessage } from "./helpers";

export async function requestQuoteAction(fd: FormData) {
  const session = await requireRole("customer");
  const providerId = str(fd, "providerId");
  await attempt(`/artisans/${providerId}`, async () => {
    const input = quoteRequestSchema.parse(formObject(fd));
    await createQuoteRequest(session.userId, { ...input, preferredDate: input.preferredDate || undefined });
  });
  redirect(withMessage("/dashboard", "ok", "Quote request sent! You'll see the price here once the artisan replies."));
}

export async function acceptQuoteAction(fd: FormData) {
  const session = await requireRole("customer");
  await attempt("/dashboard", () => customerAccept(session.userId, Number(str(fd, "quoteId"))));
  redirect(withMessage("/dashboard", "ok", "Quote accepted. The artisan will contact you to schedule the job."));
}

export async function declineQuoteAction(fd: FormData) {
  const session = await requireRole("customer");
  await attempt("/dashboard", () => customerDecline(session.userId, Number(str(fd, "quoteId"))));
  redirect(withMessage("/dashboard", "ok", "Quote declined"));
}
