import { expect, type Page } from "@playwright/test";

export const PASSWORD = "password123";

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByTestId("logout")).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByTestId("logout").click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
}
