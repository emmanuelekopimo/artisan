"use server";

import { redirect } from "next/navigation";
import { authenticate, createUser } from "@/lib/services/users";
import { endSession, homeFor, startSession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validation";
import { attempt, formObject, str } from "./helpers";

export async function loginAction(fd: FormData) {
  const next = str(fd, "next");
  const user = await attempt("/login", async () => {
    const input = loginSchema.parse(formObject(fd));
    return authenticate(input.email, input.password);
  });
  await startSession({ userId: user.id, role: user.role, name: user.name });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : homeFor(user.role));
}

export async function registerAction(fd: FormData) {
  const role = str(fd, "role") === "provider" ? "provider" : "customer";
  const user = await attempt(`/register?role=${role}`, async () => {
    const input = registerSchema.parse(formObject(fd));
    return createUser(input);
  });
  await startSession({ userId: user.id, role: user.role, name: user.name });
  redirect(user.role === "provider" ? "/dashboard/profile" : "/artisans");
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}
