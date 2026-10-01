import path from "node:path";
import { expect, test } from "@playwright/test";
import { login, logout } from "./helpers";

test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const artisan = { name: "Kola Adewale", email: `kola${stamp}@artisan.ng`, business: `Kola Kool Electric ${stamp}` };

test("full journey: register artisan → admin verifies → customer requests → quote accepted → job done", async ({ page }) => {
  // 1. Artisan signs up and submits a profile with a photo.
  await page.goto("/register?role=provider");
  await page.getByLabel("Full name").fill(artisan.name);
  await page.getByLabel("Email").fill(artisan.email);
  await page.getByLabel("Password").fill("supersecret1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile/);

  await page.getByLabel("Business name").fill(artisan.business);
  await page.getByLabel("Trade").selectOption({ label: "Electrician" });
  await page.getByLabel("Area you work in").selectOption({ label: "Yaba" });
  await page.getByLabel("Years of experience").fill("6");
  await page.getByLabel("Starting price (₦)").fill("9000");
  await page.getByLabel("About your work").fill("Wiring, sockets and inverter installs done neatly and safely.");
  await page.getByLabel("Photos of past work").setInputFiles(path.join(__dirname, "fixtures", "work.png"));
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await expect(page.getByTestId("flash-ok")).toContainText("Profile saved");
  await expect(page.getByTestId("pending-banner")).toBeVisible();
  await expect(page.getByTestId("provider-status")).toHaveText("Pending verification");

  // Not visible in search yet.
  await page.goto(`/artisans?q=${encodeURIComponent(artisan.business)}`);
  await expect(page.getByTestId("provider-card")).toHaveCount(0);
  await logout(page);

  // 2. Admin verifies the new artisan.
  await login(page, "admin@artisan.ng");
  await expect(page).toHaveURL(/\/admin/);
  const row = page.getByTestId("admin-row").filter({ hasText: artisan.business });
  await expect(row).toContainText("1 photo");
  await row.getByTestId("verify-btn").click();
  await expect(page.getByTestId("flash-ok")).toContainText("verified");
  await page.goto("/admin?status=verified");
  await expect(page.getByTestId("admin-row").filter({ hasText: artisan.business })).toBeVisible();
  await logout(page);

  // 3. Customer finds the artisan and requests a quote.
  await login(page, "customer@artisan.ng");
  await page.goto("/artisans?category=electrician&area=yaba");
  await page.getByTestId("provider-card").filter({ hasText: artisan.business }).click();
  await expect(page.getByTestId("gallery").locator("img")).toHaveCount(1);
  await page.getByLabel("What do you need done?").fill("Install ceiling fan");
  await page.getByLabel("Details").fill("Two ceiling fans in the bedrooms, wiring already in place.");
  await page.getByLabel("Address").fill("5 Commercial Ave, Yaba");
  await page.getByRole("button", { name: "Request a quote" }).click();
  await expect(page.getByTestId("flash-ok")).toContainText("Quote request sent");
  const card = page.getByTestId("quote-card").filter({ hasText: "Install ceiling fan" });
  await expect(card.getByTestId("quote-status")).toHaveText("Awaiting quote");
  await logout(page);

  // 4. Artisan replies with a price.
  await login(page, artisan.email, "supersecret1");
  await expect(page.getByTestId("kpi-new")).toHaveText("1");
  const req = page.getByTestId("request-card").filter({ hasText: "Install ceiling fan" });
  await req.getByLabel("Price (₦)").fill("18000");
  await req.getByLabel("Note to customer").fill("Both fans, can come tomorrow.");
  await req.getByRole("button", { name: "Send quote" }).click();
  await expect(page.getByTestId("flash-ok")).toContainText("Quote sent");
  await logout(page);

  // 5. Customer accepts.
  await login(page, "customer@artisan.ng");
  await page.goto("/dashboard");
  const quoted = page.getByTestId("quote-card").filter({ hasText: "Install ceiling fan" });
  await expect(quoted.getByTestId("quoted-price")).toHaveText("₦18,000");
  await quoted.getByRole("button", { name: "Accept quote" }).click();
  await expect(page.getByTestId("quote-card").filter({ hasText: "Install ceiling fan" }).getByTestId("quote-status")).toHaveText("Accepted");
  await logout(page);

  // 6. Artisan completes the job.
  await login(page, artisan.email, "supersecret1");
  await page.getByTestId("request-card").filter({ hasText: "Install ceiling fan" }).getByRole("button", { name: "Mark job completed" }).click();
  await expect(page.getByTestId("request-card").filter({ hasText: "Install ceiling fan" }).getByTestId("quote-status")).toHaveText("Completed");
});

test("admin can reject an artisan with a reason", async ({ page }) => {
  await login(page, "admin@artisan.ng");
  const row = page.getByTestId("admin-row").filter({ hasText: "Grace Fashion House" });
  await row.getByPlaceholder("Reason (optional)").fill("Please add photos of finished outfits");
  await row.getByTestId("reject-btn").click();
  await expect(page.getByTestId("flash-ok")).toContainText("rejected");
  await logout(page);
  await login(page, "grace@artisan.ng");
  await expect(page.getByText("Please add photos of finished outfits")).toBeVisible();
});

test("validation and access control", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("customer@artisan.ng");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByTestId("flash-error")).toHaveText(/Incorrect email or password/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await login(page, "customer@artisan.ng");
  await page.goto("/admin");
  await expect(page).toHaveURL("/");

  await page.goto("/register");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("duplicate registration is rejected", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Someone");
  await page.getByLabel("Email").fill("customer@artisan.ng");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByTestId("flash-error")).toContainText("already exists");
});
