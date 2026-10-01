import { expect, test } from "@playwright/test";

test("home page shows trades and top artisans", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /trusted artisans near you/i })).toBeVisible();
  await expect(page.getByTestId("categories").getByRole("link")).toHaveCount(6);
  await expect(page.getByTestId("provider-card")).toHaveCount(6);
});

test("customer filters by trade and area from the hero search", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Trade").selectOption("plumber");
  await page.getByLabel("Area").selectOption("yaba");
  await page.getByRole("button", { name: "See artisans" }).click();
  await expect(page).toHaveURL(/category=plumber/);
  await expect(page.getByRole("heading", { name: "Plumbers in Yaba" })).toBeVisible();
  await expect(page.getByTestId("provider-card")).toHaveCount(1);
  await expect(page.getByTestId("provider-card")).toContainText("Bakare Plumbing Works");
});

test("category chips, text search and empty state", async ({ page }) => {
  await page.goto("/artisans");
  await page.getByTestId("category-chips").getByRole("link", { name: "Tailors" }).click();
  await expect(page.getByTestId("result-count")).toContainText("3 artisans");
  await page.getByPlaceholder("Search by name or skill").fill("agbada");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByTestId("provider-card")).toHaveCount(1);
  await page.goto("/artisans?category=mechanic&area=yaba");
  await expect(page.getByText("No artisans match those filters yet")).toBeVisible();
});

test("artisan profile shows gallery and asks guests to log in", async ({ page }) => {
  await page.goto("/artisans?category=plumber&area=yaba");
  await page.getByTestId("provider-card").first().click();
  await expect(page.getByTestId("provider-name")).toHaveText("Bakare Plumbing Works");
  await expect(page.getByTestId("gallery").locator("img")).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Log in to request a quote" })).toBeVisible();
});

test("unverified artisans are hidden from the public", async ({ page, request }) => {
  await page.goto("/artisans?q=Obi+Electric");
  await expect(page.getByTestId("provider-card")).toHaveCount(0);
  // Provider #8 in the seed is pending.
  const res = await request.get("/artisans/8");
  expect(res.status()).toBe(404);
});
