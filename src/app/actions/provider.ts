"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import { addWorkPhoto, deleteWorkPhoto, getProviderByUser, upsertProviderProfile } from "@/lib/services/providers";
import { markCompleted, providerDecline, sendQuote } from "@/lib/services/quotes";
import { requireRole } from "@/lib/session";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, providerProfileSchema, quoteResponseSchema } from "@/lib/validation";
import { attempt, formObject, str, withMessage } from "./helpers";

async function uploadPhotos(providerId: number, fd: FormData) {
  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new AppError("Photos must be JPG, PNG, WEBP or GIF");
    if (file.size > MAX_IMAGE_BYTES) throw new AppError("Each photo must be smaller than 4 MB");
  }
  const caption = str(fd, "caption");
  for (const file of files) {
    await addWorkPhoto(providerId, { mime: file.type, data: Buffer.from(await file.arrayBuffer()) }, caption || file.name.replace(/\.[^.]+$/, ""));
  }
  return files.length;
}

export async function saveProfileAction(fd: FormData) {
  const session = await requireRole("provider");
  await attempt("/dashboard/profile", async () => {
    const input = providerProfileSchema.parse(formObject(fd));
    const provider = await upsertProviderProfile(session.userId, input);
    await uploadPhotos(provider.id, fd);
  });
  revalidatePath("/dashboard");
  redirect(withMessage("/dashboard", "ok", "Profile saved. An admin will review it shortly."));
}

export async function uploadPhotosAction(fd: FormData) {
  const session = await requireRole("provider");
  const n = await attempt("/dashboard/profile", async () => {
    const provider = await getProviderByUser(session.userId);
    if (!provider) throw new AppError("Create your profile first");
    const count = await uploadPhotos(provider.id, fd);
    if (!count) throw new AppError("Choose at least one photo");
    return count;
  });
  redirect(withMessage("/dashboard/profile", "ok", `${n} photo${n === 1 ? "" : "s"} added`));
}

export async function deletePhotoAction(fd: FormData) {
  const session = await requireRole("provider");
  await attempt("/dashboard/profile", async () => {
    const provider = await getProviderByUser(session.userId);
    if (!provider) throw new AppError("Profile not found");
    await deleteWorkPhoto(provider.id, Number(str(fd, "photoId")));
  });
  redirect(withMessage("/dashboard/profile", "ok", "Photo removed"));
}

export async function sendQuoteAction(fd: FormData) {
  const session = await requireRole("provider");
  await attempt("/dashboard", async () => {
    const input = quoteResponseSchema.parse(formObject(fd));
    await sendQuote(session.userId, input.quoteId, input.price, input.note || undefined);
  });
  redirect(withMessage("/dashboard", "ok", "Quote sent to the customer"));
}

export async function declineRequestAction(fd: FormData) {
  const session = await requireRole("provider");
  await attempt("/dashboard", () => providerDecline(session.userId, Number(str(fd, "quoteId")), str(fd, "note")));
  redirect(withMessage("/dashboard", "ok", "Request declined"));
}

export async function completeJobAction(fd: FormData) {
  const session = await requireRole("provider");
  await attempt("/dashboard", () => markCompleted(session.userId, Number(str(fd, "quoteId"))));
  redirect(withMessage("/dashboard", "ok", "Job marked as completed"));
}
