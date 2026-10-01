/**
 * Builds docs/Artisan-Documentation.pdf.
 *
 * 1. Drives the running app with Playwright to capture screenshots of every key screen.
 * 2. Draws numbered annotations over each screenshot (positions taken from the live DOM).
 * 3. Renders a print-styled HTML guide and prints it to PDF.
 *
 * Usage: start the app on a freshly seeded database (npm run db:seed && npm start), then
 *   DOCS_BASE_URL=http://localhost:3000 npm run docs:pdf
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Locator, type Page } from "@playwright/test";

const BASE = process.env.DOCS_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "docs");
const BUILD_DIR = path.join(OUT_DIR, ".build");
const SHOTS_DIR = path.join(OUT_DIR, "screenshots");
const PASSWORD = "password123";

type Note = { target: Locator; text: string };
type Shot = { file: string; width: number; height: number; notes: { n: number; text: string; x: number; y: number; w: number; h: number }[] };

const shots: Record<string, Shot> = {};

async function capture(page: Page, name: string, notes: Note[], opts: { fullPage?: boolean } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  const boxes = [];
  for (const [i, note] of notes.entries()) {
    const box = await note.target.first().boundingBox();
    if (!box) throw new Error(`Annotation target not found: ${name} #${i + 1} (${note.text})`);
    boxes.push({ n: i + 1, text: note.text, x: box.x, y: box.y, w: box.width, h: box.height });
  }
  const file = path.join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  const size = await page.evaluate((full) => ({
    width: document.documentElement.clientWidth,
    height: full ? document.documentElement.scrollHeight : window.innerHeight,
  }), opts.fullPage ?? false);
  shots[name] = { file, ...size, notes: boxes };
}

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByTestId("logout").waitFor();
}

async function logout(page: Page) {
  await page.getByTestId("logout").click();
  await page.getByRole("link", { name: "Log in" }).waitFor();
}

async function captureAll() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  // ---------- Guest ----------
  await page.goto(BASE);
  await capture(page, "home", [
    { target: page.locator(".nav-links"), text: "Top navigation: browse artisans, join as an artisan, or read how it works." },
    { target: page.getByLabel("Trade"), text: "Pick a trade (plumber, electrician, tailor, mechanic, carpenter, painter)." },
    { target: page.getByLabel("Area"), text: "Pick an area in Lagos — only artisans who work there are shown." },
    { target: page.getByRole("button", { name: "See artisans" }), text: "Search. Takes you to the filtered results list." },
    { target: page.locator(".hero-art"), text: "Map-style illustration in the spirit of the Uber app." },
  ]);
  await page.locator("#how").scrollIntoViewIfNeeded();
  await capture(page, "home-full", [
    { target: page.getByTestId("categories"), text: "‘Suggestions’ tiles — one tap jumps to a trade." },
    { target: page.locator("#how"), text: "How it works, in three steps." },
    { target: page.getByTestId("provider-card").first(), text: "Top-rated verified artisans." },
  ], { fullPage: true });

  await page.goto(`${BASE}/artisans?category=plumber`);
  await capture(page, "browse", [
    { target: page.getByTestId("category-chips"), text: "Category chips switch trades instantly." },
    { target: page.getByTestId("filters"), text: "Search by name/skill, filter by area and sort by rating, price or experience." },
    { target: page.getByTestId("result-count"), text: "Live count of matching artisans." },
    { target: page.locator(".floating-badge").first(), text: "Only admin-verified artisans appear in results." },
    { target: page.getByTestId("provider-card").first().locator(".pcard-body"), text: "Card: rating, area, experience, jobs done and starting price." },
  ]);

  await page.goto(`${BASE}/artisans?category=plumber&area=yaba`);
  await page.getByTestId("provider-card").first().click();
  await page.getByTestId("provider-name").waitFor();
  const profileUrl = page.url();
  await capture(page, "profile-guest", [
    { target: page.getByTestId("provider-name"), text: "Business name with the green Verified badge." },
    { target: page.locator(".stat-row"), text: "Rating, completed jobs and years of experience." },
    { target: page.getByTestId("gallery"), text: "Photos of past work uploaded by the artisan." },
    { target: page.locator("#quote"), text: "Guests are asked to log in or sign up before requesting a quote." },
  ]);

  // ---------- Artisan registration ----------
  await page.goto(`${BASE}/register?role=provider`);
  await capture(page, "register", [
    { target: page.locator(".role-pick"), text: "Choose your role: customer or artisan (service provider)." },
    { target: page.getByTestId("register-form").locator(".field").first(), text: "Basic account details — passwords are hashed with bcrypt." },
    { target: page.locator(".auth-side"), text: "Benefits panel changes with the selected role." },
  ]);
  const stamp = Date.now().toString().slice(-5);
  await page.getByLabel("Full name").fill("Kola Adewale");
  await page.getByLabel("Email").fill(`kola${stamp}@artisan.ng`);
  await page.getByLabel("Password").fill("supersecret1");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByTestId("profile-form").waitFor();
  await page.getByLabel("Business name").fill("Kola Kool Electric");
  await page.getByLabel("Trade").selectOption({ label: "Electrician" });
  await page.getByLabel("Area you work in").selectOption({ label: "Yaba" });
  await page.getByLabel("Years of experience").fill("6");
  await page.getByLabel("Starting price (₦)").fill("9000");
  await page.getByLabel("About your work").fill("Wiring, sockets and inverter installs done neatly and safely. Free inspection within Yaba.");
  await page.getByLabel("Photos of past work").setInputFiles([
    path.join(process.cwd(), "tests", "e2e", "fixtures", "work.png"),
  ]);
  await capture(page, "onboarding", [
    { target: page.getByLabel("Business name"), text: "Business name shown to customers." },
    { target: page.getByLabel("Trade"), text: "Trade (category) — used by the category filter." },
    { target: page.getByLabel("Area you work in"), text: "Area — used by the location filter." },
    { target: page.getByLabel("About your work"), text: "Short bio describing services." },
    { target: page.getByLabel("Photos of past work"), text: "Upload photos of past work (JPG/PNG/WEBP, max 4 MB each). Stored in Postgres." },
    { target: page.getByRole("button", { name: "Submit for verification" }), text: "Submits the profile to the admin verification queue." },
  ], { fullPage: true });
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await page.getByTestId("pending-banner").waitFor();
  await capture(page, "artisan-pending", [
    { target: page.getByTestId("provider-status"), text: "Status badge: Pending verification." },
    { target: page.getByTestId("pending-banner"), text: "The artisan is hidden from search until an admin approves them." },
    { target: page.locator(".kpi").first(), text: "Dashboard KPIs: new requests, totals, jobs completed and earnings." },
  ]);
  await logout(page);

  // ---------- Admin ----------
  await login(page, "admin@artisan.ng");
  await capture(page, "admin", [
    { target: page.getByTestId("admin-kpis"), text: "Platform stats: pending reviews, verified artisans, customers and quote requests." },
    { target: page.locator(".tabs"), text: "Tabs for Pending / Verified / Rejected artisans." },
    { target: page.getByTestId("admin-row").filter({ hasText: "Kola Kool Electric" }).locator(".thumbs"), text: "Preview of uploaded work photos — click the name to open the full profile." },
    { target: page.getByTestId("admin-row").filter({ hasText: "Kola Kool Electric" }).getByTestId("verify-btn"), text: "Verify: the artisan immediately becomes visible to customers." },
    { target: page.getByTestId("admin-row").filter({ hasText: "Kola Kool Electric" }).getByTestId("reject-btn"), text: "Reject with an optional reason the artisan will see." },
  ]);
  await page.getByTestId("admin-row").filter({ hasText: "Kola Kool Electric" }).getByTestId("verify-btn").click();
  await page.getByTestId("flash-ok").waitFor();
  await capture(page, "admin-verified", [
    { target: page.getByTestId("flash-ok"), text: "Confirmation message after verifying." },
    { target: page.getByTestId("kpi-verified"), text: "Verified count goes up by one." },
  ]);
  await logout(page);

  // ---------- Customer requests a quote ----------
  await login(page, "customer@artisan.ng");
  await page.goto(profileUrl);
  await page.getByLabel("What do you need done?").fill("Replace bathroom tap");
  await page.getByLabel("Details").fill("The hot water tap in the bathroom is broken and leaking. I have bought a new mixer.");
  await page.getByLabel("Address").fill("12 Herbert Macaulay Way, Yaba");
  await page.getByLabel("Preferred date").fill("2026-10-08");
  await capture(page, "request-quote", [
    { target: page.getByLabel("What do you need done?"), text: "Job title." },
    { target: page.getByLabel("Details"), text: "Details so the artisan can price the work." },
    { target: page.getByLabel("Address"), text: "Where the job is." },
    { target: page.getByRole("button", { name: "Request a quote" }), text: "Sends the request — it appears on both dashboards." },
  ]);
  await page.getByRole("button", { name: "Request a quote" }).click();
  await page.getByTestId("flash-ok").waitFor();
  const quotedCard = page.getByTestId("quote-card").filter({ hasText: "Leaking kitchen sink" });
  await capture(page, "customer-dashboard", [
    { target: page.getByTestId("flash-ok"), text: "Confirmation that the request was sent." },
    { target: page.getByTestId("quote-card").filter({ hasText: "Replace bathroom tap" }).getByTestId("quote-status"), text: "New request: Awaiting quote." },
    { target: quotedCard.locator(".status-strip"), text: "Progress bar: requested → quoted → accepted → completed." },
    { target: quotedCard.locator(".card.flat"), text: "The artisan's price and note." },
    { target: quotedCard.getByRole("button", { name: "Accept quote" }), text: "Accept or decline the quote." },
  ]);
  await logout(page);

  // ---------- Artisan responds ----------
  await login(page, "tunde@artisan.ng");
  const req = page.getByTestId("request-card").filter({ hasText: "Replace bathroom tap" });
  await req.getByLabel("Price (₦)").fill("12500");
  await req.getByLabel("Note to customer").fill("Includes fitting the new mixer and sealing. Can come Wednesday.");
  await capture(page, "artisan-dashboard", [
    { target: page.getByTestId("kpi-new"), text: "Number of new requests waiting for a quote." },
    { target: req.locator("p"), text: "Customer's job description, address and preferred date." },
    { target: req.getByLabel("Price (₦)"), text: "Enter a price in Naira…" },
    { target: req.getByRole("button", { name: "Send quote" }), text: "…and send it. Or decline the job." },
  ]);
  await req.getByRole("button", { name: "Send quote" }).click();
  await page.getByTestId("flash-ok").waitFor();
  await logout(page);

  await login(page, "customer@artisan.ng");
  await page.goto(`${BASE}/dashboard`);
  await page.getByTestId("quote-card").filter({ hasText: "Replace bathroom tap" }).getByRole("button", { name: "Accept quote" }).click();
  await page.getByTestId("flash-ok").waitFor();
  await capture(page, "accepted", [
    { target: page.getByTestId("quote-card").filter({ hasText: "Replace bathroom tap" }).getByTestId("quote-status"), text: "Quote accepted. The artisan can now see the customer's phone number and later mark the job completed." },
  ]);
  await logout(page);

  await page.goto(`${BASE}/login`);
  await capture(page, "login", [
    { target: page.getByTestId("login-form"), text: "One login for customers, artisans and admins — you land on the right dashboard." },
    { target: page.getByTestId("demo-accounts"), text: "Demo accounts for the presentation." },
  ]);

  // ---------- Mobile ----------
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const m = await mobile.newPage();
  await m.goto(BASE);
  await capture(m, "mobile-home", []);
  await m.goto(`${BASE}/artisans?category=tailor`);
  await capture(m, "mobile-browse", []);
  await browser.close();
}

/* ------------------------------------------------------------------ */

function img(name: string, caption: string, opts: { maxHeight?: number } = {}) {
  const s = shots[name]!;
  const data = fs.readFileSync(s.file).toString("base64");
  const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;
  const markers = s.notes
    .map((n) => {
      const cx = Math.max(0, n.x - 12);
      const cy = Math.max(0, n.y - 12);
      return `<div class="hl" style="left:${pct(n.x, s.width)};top:${pct(n.y, s.height)};width:${pct(n.w, s.width)};height:${pct(n.h, s.height)}"></div>
        <div class="pin" style="left:${pct(cx, s.width)};top:${pct(cy, s.height)}">${n.n}</div>`;
    })
    .join("");
  const legend = s.notes.length
    ? `<ol class="legend">${s.notes.map((n) => `<li><span class="num">${n.n}</span>${n.text}</li>`).join("")}</ol>`
    : "";
  const style = opts.maxHeight ? `style="max-width:${(opts.maxHeight * s.width) / s.height}px"` : "";
  return `<figure class="shot"><div class="frame" ${style}><img src="data:image/png;base64,${data}"/>${markers}</div><figcaption>${caption}</figcaption>${legend}</figure>`;
}

function buildHtml() {
  const font = path.join(process.cwd(), "node_modules", "@fontsource-variable", "inter", "files", "inter-latin-wght-normal.woff2");
  const logo = fs.readFileSync(path.join(process.cwd(), "public", "logo.svg"), "utf8");
  const hero = fs.readFileSync(path.join(process.cwd(), "public", "images", "hero.svg")).toString("base64");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url("file://${font}") format("woff2"); font-weight: 100 900; }
@page { size: A4; margin: 16mm 14mm 18mm; }
* { box-sizing: border-box; }
body { font-family: Inter, sans-serif; color: #000; font-size: 10.5pt; line-height: 1.5; margin: 0; }
h1 { font-size: 30pt; letter-spacing: -0.03em; margin: 0 0 6pt; line-height: 1.1; }
h2 { font-size: 18pt; letter-spacing: -0.02em; margin: 0 0 8pt; padding-top: 4pt; }
h3 { font-size: 12.5pt; margin: 14pt 0 6pt; break-after: avoid; }
p { margin: 0 0 8pt; }
.muted { color: #6b6b6b; }
section { break-before: page; }
.cover { height: 258mm; display: flex; flex-direction: column; justify-content: space-between; gap: 10mm; background: #000; color: #fff; border-radius: 16px; padding: 16mm 14mm; overflow: hidden; }
.cover .brand { display: flex; align-items: center; gap: 12px; font-size: 22pt; font-weight: 800; letter-spacing: -0.03em; }
.cover .brand svg { width: 48px; height: 48px; border: 1px solid #333; border-radius: 12px; }
.cover h1 { font-size: 40pt; color: #fff; }
.cover img { width: 100%; border-radius: 14px; }
.tag { display: inline-block; background: #05A357; color: #fff; padding: 2px 10px; border-radius: 999px; font-size: 9pt; font-weight: 600; }
.shot { margin: 8pt 0 14pt; break-inside: avoid; }
.frame { position: relative; border: 1px solid #e2e2e2; border-radius: 8px; overflow: hidden; margin: 0 auto; }
.frame img { width: 100%; display: block; }
.hl { position: absolute; border: 2.5px solid #E11900; border-radius: 6px; box-shadow: 0 0 0 3px rgba(225,25,0,.15); }
.pin { position: absolute; width: 22px; height: 22px; border-radius: 50%; background: #E11900; color: #fff; font-weight: 800; font-size: 10pt; display: grid; place-items: center; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.4); }
figcaption { font-size: 9pt; color: #6b6b6b; margin-top: 4pt; text-align: center; }
.legend { list-style: none; padding: 0; margin: 8pt 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4pt 14pt; font-size: 9.5pt; }
.legend li { display: flex; gap: 8px; align-items: flex-start; }
.num { flex: 0 0 18px; height: 18px; border-radius: 50%; background: #E11900; color: #fff; font-weight: 800; font-size: 8.5pt; display: grid; place-items: center; margin-top: 1px; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6pt 0 10pt; }
th { text-align: left; background: #f6f6f6; padding: 6pt 8pt; font-weight: 700; }
td { padding: 6pt 8pt; border-bottom: 1px solid #eee; vertical-align: top; }
code, .mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 9pt; background: #f3f3f3; padding: 1px 5px; border-radius: 4px; }
pre { background: #000; color: #e8e8e8; padding: 10pt 12pt; border-radius: 8px; font-size: 8.8pt; white-space: pre-wrap; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }
.box { background: #f6f6f6; border-radius: 10px; padding: 10pt 12pt; }
.box b { display: block; margin-bottom: 3pt; }
.flow { display: flex; align-items: center; gap: 6pt; flex-wrap: wrap; margin: 8pt 0; }
.flow .step { background: #000; color: #fff; border-radius: 999px; padding: 4pt 12pt; font-weight: 600; font-size: 9.5pt; }
.flow .step.alt { background: #f6f6f6; color: #000; }
.flow .arrow { color: #afafaf; font-weight: 700; }
.arch { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8pt; text-align: center; margin: 8pt 0; }
.arch div { border: 2px solid #000; border-radius: 10px; padding: 8pt; font-size: 9pt; }
.arch div b { display: block; font-size: 10.5pt; }
.toc li { margin: 3pt 0; }
.phones { display: flex; gap: 16pt; justify-content: center; }
.phones .shot { width: 42%; }
.callout { border-left: 4px solid #05A357; background: #e6f6ed; padding: 8pt 12pt; border-radius: 0 8px 8px 0; margin: 8pt 0; }
</style></head><body>

<div class="cover">
  <div class="brand">${logo} Artisan</div>
  <div>
    <span class="tag">300 Level Project · Documentation</span>
    <h1 style="margin-top:12pt">Find trusted artisans near you.</h1>
    <p style="color:#afafaf;font-size:13pt;max-width:140mm">A marketplace where plumbers, electricians, tailors and mechanics register with their trade, area and photos of past work. Admins verify them, and customers filter by category and location and request a quote.</p>
  </div>
  <img src="data:image/svg+xml;base64,${hero}"/>
  <div style="color:#afafaf;font-size:9.5pt">Next.js · TypeScript · Drizzle ORM · PostgreSQL · Railway &nbsp;—&nbsp; ${today}</div>
</div>

<section>
  <h2>Contents</h2>
  <ol class="toc">
    <li>Overview — the problem and the solution</li>
    <li>Users and roles</li>
    <li>Customer guide — search, filter, request a quote, accept</li>
    <li>Artisan guide — register, upload photos, get verified, send quotes</li>
    <li>Admin guide — verify or reject artisans</li>
    <li>How it works inside — architecture, data model, quote lifecycle</li>
    <li>Branding and UI</li>
    <li>Testing</li>
    <li>Running locally and deploying to Railway</li>
    <li>5-minute presentation script</li>
  </ol>

  <h2 style="margin-top:18pt">1. Overview</h2>
  <p><b>The problem.</b> Finding a reliable plumber, electrician, tailor or mechanic usually depends on word of mouth. Customers can't see past work, don't know if the person is trustworthy, and have to negotiate prices blindly.</p>
  <p><b>The solution.</b> <b>Artisan</b> is a web app (inspired by the look and feel of the Uber app) where:</p>
  <div class="grid2">
    <div class="box"><b>Artisans register</b>with their trade, the area they work in, a short bio, a starting price and photos of past work.</div>
    <div class="box"><b>Admins verify</b>every new artisan before they appear in search, so customers only see checked profiles.</div>
    <div class="box"><b>Customers search</b>by category (trade) and location (area), compare ratings, prices and photos.</div>
    <div class="box"><b>Customers request quotes</b>— the artisan replies with a price, the customer accepts and the job is tracked to completion.</div>
  </div>

  <h2 style="margin-top:18pt">2. Users and roles</h2>
  <table>
    <tr><th>Role</th><th>What they can do</th><th>Demo login</th></tr>
    <tr><td><b>Guest</b></td><td>Browse and filter verified artisans, view profiles and photos.</td><td>—</td></tr>
    <tr><td><b>Customer</b></td><td>Everything a guest can, plus request quotes, accept or decline them, and track jobs.</td><td><span class="mono">customer@artisan.ng</span></td></tr>
    <tr><td><b>Artisan</b> (provider)</td><td>Create a profile (trade, area, bio, price), upload/delete work photos, receive requests, send quotes, decline, mark jobs completed.</td><td><span class="mono">tunde@artisan.ng</span></td></tr>
    <tr><td><b>Admin</b></td><td>See platform stats, review pending artisans, verify or reject them with a reason.</td><td><span class="mono">admin@artisan.ng</span></td></tr>
  </table>
  <p class="muted">All demo accounts use the password <span class="mono">password123</span>. The sample data contains 22 artisans across 6 trades and 8 Lagos areas (18 verified, 3 pending, 1 rejected), 3 customers and 7 quote requests in every state.</p>
</section>

<section>
  <h2>3. Customer guide</h2>
  <h3>3.1 Home — start a search</h3>
  ${img("home", "Home page (desktop).")}
</section>
<section>
  <h3>3.2 Browse and filter artisans</h3>
  <p>The results page reads the filters from the URL (e.g. <span class="mono">/artisans?category=plumber&amp;area=yaba</span>), so searches can be bookmarked and shared.</p>
  ${img("browse", "Browse page filtered to Plumbers.")}
</section>
<section>
  <h3>3.3 View an artisan's profile</h3>
  ${img("profile-guest", "Artisan profile as a guest.")}
  <h3>3.4 Request a quote</h3>
  <p>Log in as a customer (or sign up), open a profile and fill in the quote form on the right.</p>
  ${img("request-quote", "Quote request form (logged in as a customer).", { maxHeight: 420 })}
</section>
<section>
  <h3>3.5 Track requests and accept a quote</h3>
  ${img("customer-dashboard", "Customer dashboard — every request with its status.")}
  ${img("accepted", "After accepting a quote.")}
</section>

<section>
  <h2>4. Artisan guide</h2>
  <h3>4.1 Sign up as an artisan</h3>
  ${img("register", "Sign-up page with the artisan role selected.", { maxHeight: 380 })}
</section>
<section>
  <h3>4.2 Create your profile and upload photos</h3>
  ${img("onboarding", "Profile set-up form.", { maxHeight: 700 })}
</section>
<section>
  <h3>4.3 Wait for verification</h3>
  ${img("artisan-pending", "Artisan dashboard while the profile is pending.")}
  <div class="callout">If an admin rejects the profile, the reason appears on the dashboard. Editing and saving the profile automatically sends it back to the admin queue.</div>
  <p>Artisans can add more photos or remove old ones at any time from <b>Edit profile &amp; photos</b>.</p>
</section>
<section>
  <h3>4.4 Reply to quote requests</h3>
  ${img("artisan-dashboard", "Artisan dashboard with a new request.")}
  <p>Once the customer accepts, the artisan sees the customer's phone number and a <b>Mark job completed</b> button, which also increases their “jobs done” count.</p>
</section>

<section>
  <h2>5. Admin guide</h2>
  ${img("admin", "Admin console — pending verification queue.")}
  ${img("admin-verified", "After clicking Verify.", { maxHeight: 330 })}
</section>

<section>
  <h2>6. How it works inside</h2>
  <h3>6.1 Architecture</h3>
  <div class="arch">
    <div><b>Browser</b>Server-rendered HTML + plain HTML forms</div>
    <div><b>Next.js 16</b>App Router pages &amp; Server Actions (TypeScript)</div>
    <div><b>Service layer</b>src/lib/services — business rules, validation (Zod)</div>
    <div><b>PostgreSQL</b>via Drizzle ORM (schema + migrations)</div>
  </div>
  <p>Pages are React Server Components that query the database directly through the service layer. Every form posts to a <b>Server Action</b> which checks the user's session and role, validates input with <b>Zod</b>, calls a service function and redirects back with a success or error message. No client-side JavaScript is needed for any feature.</p>
  <table>
    <tr><th>Concern</th><th>How it's done</th></tr>
    <tr><td>Authentication</td><td>Passwords hashed with <b>bcrypt</b>. Sessions are signed JWTs (<b>jose</b>, HS256) in an HTTP-only cookie, valid 7 days.</td></tr>
    <tr><td>Authorization</td><td><span class="mono">requireRole()</span> on every protected page and action; services also check ownership (e.g. only the artisan who received a request can quote it).</td></tr>
    <tr><td>Photo uploads</td><td>Validated (type + 4 MB limit) and stored as <span class="mono">bytea</span> in Postgres, served by <span class="mono">/api/uploads/[id]</span>. This survives redeploys on Railway's ephemeral disk.</td></tr>
    <tr><td>Search</td><td>One SQL query with joins; filters on category slug, area slug and a case-insensitive text match, always restricted to <span class="mono">status = 'verified'</span>.</td></tr>
  </table>

  <h3>6.2 Data model</h3>
  <table>
    <tr><th>Table</th><th>Key columns</th></tr>
    <tr><td>users</td><td>id, name, email (unique), password_hash, role (customer | provider | admin), phone</td></tr>
    <tr><td>categories</td><td>id, slug, name, icon, description — the 6 trades</td></tr>
    <tr><td>areas</td><td>id, slug, name, city — the 8 Lagos areas</td></tr>
    <tr><td>providers</td><td>user_id → users, category_id, area_id, business_name, bio, years_experience, starting_price, status (pending | verified | rejected), rating, jobs_completed, rejection_reason</td></tr>
    <tr><td>work_photos</td><td>provider_id → providers, url, caption</td></tr>
    <tr><td>uploads</td><td>id, mime, data (bytea) — raw uploaded images</td></tr>
    <tr><td>quote_requests</td><td>customer_id, provider_id, title, details, address, preferred_date, status, quoted_price, provider_note</td></tr>
  </table>

  <h3>6.3 Quote lifecycle</h3>
  <div class="flow"><span class="step">pending</span><span class="arrow">— artisan sends price →</span><span class="step">quoted</span><span class="arrow">— customer accepts →</span><span class="step">accepted</span><span class="arrow">— artisan →</span><span class="step">completed</span></div>
  <div class="flow"><span class="step alt">pending / quoted</span><span class="arrow">— artisan or customer declines →</span><span class="step alt">declined</span></div>
  <p>The allowed moves live in one table in <span class="mono">src/lib/quote-status.ts</span>; any other move (or the wrong person trying it) is refused.</p>

  <h3>6.4 Artisan verification</h3>
  <div class="flow"><span class="step alt">register</span><span class="arrow">→</span><span class="step">pending</span><span class="arrow">— admin →</span><span class="step">verified</span><span class="arrow">or</span><span class="step alt">rejected</span><span class="arrow">— edit profile →</span><span class="step">pending</span></div>
</section>

<section>
  <h2>7. Branding and UI</h2>
  <div class="grid2">
    <div>
      <p><b>Name:</b> Artisan. <b>Logo:</b> a bold geometric “A” (like a roof or a compass) on a black tile, with a green dot standing for a verified pin on the map.</p>
      <p><b>Inspired by Uber:</b> black navigation bar, black-and-white palette, big bold headings, grey input fields with icons, “Suggestions” tiles for categories, pill buttons and a map-style hero.</p>
      <table>
        <tr><th>Token</th><th>Value</th></tr>
        <tr><td>Primary</td><td>#000000 / #FFFFFF</td></tr>
        <tr><td>Surfaces</td><td>#F6F6F6, #EEEEEE</td></tr>
        <tr><td>Verified / success</td><td>#05A357</td></tr>
        <tr><td>Info / link</td><td>#276EF1</td></tr>
        <tr><td>Font</td><td>Inter (self-hosted)</td></tr>
        <tr><td>Icons</td><td>Lucide</td></tr>
        <tr><td>Avatars</td><td>DiceBear “Notionists”</td></tr>
      </table>
    </div>
    <div class="phones">
      ${img("mobile-home", "Mobile — home")}
      ${img("mobile-browse", "Mobile — browse")}
    </div>
  </div>
</section>
<section>
  <h3>Full home page</h3>
  ${img("home-full", "Full home page.", { maxHeight: 820 })}
</section>

<section>
  <h2>8. Testing</h2>
  <p>Two test suites run against a real PostgreSQL test database that is migrated and seeded fresh before each run.</p>
  <table>
    <tr><th>Suite</th><th>Tool</th><th>What it covers</th></tr>
    <tr><td>Unit &amp; integration (26 tests)</td><td>Vitest</td><td>Quote state machine, formatting, Zod validation, session signing and tamper detection; user registration and login; search filters (category, area, text, sort, verified-only); onboarding, photo upload/delete, verify/reject and resubmission; full quote lifecycle, ownership and role checks.</td></tr>
    <tr><td>End-to-end (9 tests)</td><td>Playwright (Chromium)</td><td>Home and search, chips and empty state, profile gallery, hidden unverified profiles (404), the <b>complete journey</b>: artisan registers with a photo → admin verifies → customer requests → artisan quotes → customer accepts → artisan completes; admin rejection with reason; bad login; access control; duplicate e-mail.</td></tr>
  </table>
  <pre>npm test            # unit + integration (Vitest)
npm run build && npm run test:e2e   # end-to-end in a real browser (Playwright)</pre>
  <p>Result at the time of writing: <b>26/26</b> unit/integration tests and <b>9/9</b> end-to-end tests passing.</p>

  <h2 style="margin-top:16pt">9. Running locally and deploying</h2>
  <h3>Run locally</h3>
  <pre>cp .env.example .env          # set DATABASE_URL and SESSION_SECRET
npm install
npm run db:deploy             # create tables + load sample data
npm run dev                   # http://localhost:3000</pre>
  <h3>Deploy to Railway (project “school-projects”)</h3>
  <ol>
    <li>In the project: <b>New → GitHub Repo</b> → choose this repository (pick the branch under <i>Settings → Source</i> if needed).</li>
    <li><b>New → Database → PostgreSQL</b>.</li>
    <li>On the app service add the variables <span class="mono">DATABASE_URL = \${{Postgres.DATABASE_URL}}</span> and <span class="mono">SESSION_SECRET</span> (any long random string).</li>
    <li><b>Settings → Networking → Generate Domain</b>.</li>
  </ol>
  <p><span class="mono">railway.json</span> runs <span class="mono">npm run build</span>; on every start it applies migrations and, on a brand-new database, loads the sample data automatically.</p>
</section>

<section>
  <h2>10. 5-minute presentation script</h2>
  <table>
    <tr><th style="width:18%">Time</th><th>What to show and say</th></tr>
    <tr><td>0:00 – 0:30</td><td><b>Problem.</b> “Finding a trustworthy artisan relies on word of mouth — you can't see their work or compare prices.”</td></tr>
    <tr><td>0:30 – 1:30</td><td><b>Customer search.</b> Home page → pick <i>Plumbers</i> + <i>Yaba</i> → See artisans. Show chips, area filter, sort and the Verified badges. Open <i>Bakare Plumbing Works</i> — photos, rating, starting price.</td></tr>
    <tr><td>1:30 – 2:30</td><td><b>Artisan onboarding.</b> Sign up as an artisan → choose trade and area → upload a photo → submit. Point out the <i>Pending verification</i> banner and that they're hidden from search.</td></tr>
    <tr><td>2:30 – 3:15</td><td><b>Admin.</b> Log in as <span class="mono">admin@artisan.ng</span> → Pending tab → Verify. The artisan is now searchable.</td></tr>
    <tr><td>3:15 – 4:15</td><td><b>Quote flow.</b> As <span class="mono">customer@artisan.ng</span> request a quote → as the artisan send ₦ price → as the customer accept. Show the progress bar.</td></tr>
    <tr><td>4:15 – 5:00</td><td><b>Tech.</b> Next.js + TypeScript, Drizzle + PostgreSQL, Server Actions, role-based access, 35 automated tests, deployed on Railway. Questions.</td></tr>
  </table>
  <div class="callout">Tip: open four browser windows in advance (guest, customer, artisan, admin — use private windows) so you can switch roles without logging in and out.</div>
</section>

</body></html>`;
}

async function main() {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  await captureAll();
  const htmlPath = path.join(BUILD_DIR, "documentation.html");
  fs.writeFileSync(htmlPath, buildHtml());
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const pdf = path.join(OUT_DIR, "Artisan-Documentation.pdf");
  await page.pdf({
    path: pdf,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="font-family:Inter,sans-serif;font-size:8px;color:#999;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>Artisan — Documentation</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  await browser.close();
  console.log(`✓ wrote ${path.relative(process.cwd(), pdf)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
