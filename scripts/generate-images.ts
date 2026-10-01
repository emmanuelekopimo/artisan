/**
 * Generates the sample artwork shipped in /public:
 *  - work-photo illustrations for every trade (public/images/work/*.svg)
 *  - provider avatars via DiceBear (public/images/avatars/*.svg)
 *  - the hero "map" illustration (public/images/hero.svg)
 * Everything is generated offline from open-source icon sets (Lucide, DiceBear).
 */
import fs from "node:fs";
import path from "node:path";
import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";
import { CATEGORY_ART, SAMPLE_PROVIDERS } from "../src/db/sample-data";

const root = path.join(process.cwd(), "public", "images");
const iconDir = path.join(process.cwd(), "node_modules", "lucide-static", "icons");

function iconInner(name: string): string {
  const svg = fs.readFileSync(path.join(iconDir, `${name}.svg`), "utf8");
  return svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>")).trim();
}

/** Places a 24x24 Lucide icon at (x, y) scaled to `size` px. */
function icon(name: string, x: number, y: number, size: number, color: string, stroke = 2) {
  const s = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${iconInner(name)}</g>`;
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function workPhoto(slug: string, index: number): string {
  const art = CATEGORY_ART[slug];
  const r = rand(index * 97 + slug.length * 13);
  const W = 800;
  const H = 600;
  const main = art.icons[index % art.icons.length];
  const angle = Math.round(r() * 360);
  const shapes: string[] = [];
  for (let i = 0; i < 14; i++) {
    const cx = Math.round(r() * W);
    const cy = Math.round(r() * H);
    const rad = Math.round(20 + r() * 90);
    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="#fff" opacity="${(0.04 + r() * 0.08).toFixed(2)}"/>`);
  }
  const floating: string[] = [];
  const spots = [
    [90, 90],
    [610, 70],
    [80, 420],
    [640, 430],
    [360, 40],
  ];
  spots.forEach(([x, y], i) => {
    const name = art.icons[(index + i + 1) % art.icons.length];
    const size = 56 + Math.round(r() * 30);
    floating.push(
      `<g opacity="0.9"><rect x="${x - 14}" y="${y - 14}" width="${size + 28}" height="${size + 28}" rx="22" fill="#fff" fill-opacity="0.16"/>${icon(name, x, y, size, "#fff", 1.8)}</g>`,
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)">
      <stop offset="0" stop-color="${art.from}"/>
      <stop offset="1" stop-color="${art.to}"/>
    </linearGradient>
    <radialGradient id="spot" cx=".5" cy=".55" r=".5">
      <stop offset="0" stop-color="#fff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${shapes.join("\n  ")}
  <ellipse cx="400" cy="320" rx="300" ry="230" fill="url(#spot)"/>
  ${floating.join("\n  ")}
  <ellipse cx="400" cy="470" rx="150" ry="18" fill="#000" opacity=".18"/>
  <circle cx="400" cy="300" r="150" fill="#fff"/>
  ${icon(main, 300, 200, 200, art.to, 1.6)}
</svg>`;
}

function hero(): string {
  const W = 900;
  const H = 700;
  const roads: string[] = [];
  for (let x = 40; x < W; x += 140) roads.push(`<path d="M${x} 0 L${x + 60} ${H}" stroke="#fff" stroke-width="${x % 280 === 40 ? 14 : 6}" opacity=".9"/>`);
  for (let y = 60; y < H; y += 130) roads.push(`<path d="M0 ${y} L${W} ${y - 40}" stroke="#fff" stroke-width="${y % 260 === 60 ? 14 : 6}" opacity=".9"/>`);
  const blocks = `<rect width="${W}" height="${H}" fill="#E8E8E8"/>
  <rect x="520" y="380" width="220" height="160" rx="12" fill="#D4EDDA"/>
  <rect x="80" y="440" width="160" height="120" rx="12" fill="#D4EDDA"/>
  <path d="M0 620 C 200 560, 380 700, ${W} 600 L ${W} ${H} L 0 ${H} Z" fill="#CFE3FF"/>`;
  const pins = [
    ["plumber", 180, 150],
    ["electrician", 640, 190],
    ["tailor", 720, 300],
    ["mechanic", 150, 330],
    ["carpenter", 470, 520],
    ["painter", 300, 560],
  ] as const;
  const pinSvg = pins
    .map(([slug, x, y]) => {
      const art = CATEGORY_ART[slug];
      return `<g><circle cx="${x}" cy="${y}" r="46" fill="${art.from}" stroke="#fff" stroke-width="6"/>${icon(art.icons[0], x - 22, y - 22, 44, "#fff", 2)}</g>`;
    })
    .join("\n  ");
  const route = `<path d="M180 150 C 300 230, 330 300, 440 320" stroke="#000" stroke-width="8" fill="none" stroke-dasharray="1 16" stroke-linecap="round"/>`;
  const me = `<circle cx="440" cy="330" r="90" fill="#276EF1" opacity=".15"/><circle cx="440" cy="330" r="22" fill="#276EF1" stroke="#fff" stroke-width="6"/>`;
  const card = `<g transform="translate(250 30)"><rect width="400" height="76" rx="38" fill="#000"/>${icon("badge-check", 26, 20, 36, "#05A357", 2)}<text x="78" y="47" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#fff">18 verified artisans nearby</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${blocks}${roads.join("")}${route}${me}${pinSvg}${card}</svg>`;
}

function logo(color: string, bg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="16" fill="${bg}"/><path d="M18 48 L32 14 L46 48" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="38" r="5" fill="#05A357"/></svg>`;
}

fs.mkdirSync(path.join(root, "work"), { recursive: true });
fs.mkdirSync(path.join(root, "avatars"), { recursive: true });
for (const slug of Object.keys(CATEGORY_ART)) {
  for (let i = 1; i <= 6; i++) fs.writeFileSync(path.join(root, "work", `${slug}-${i}.svg`), workPhoto(slug, i));
}
for (const p of SAMPLE_PROVIDERS) {
  const svg = createAvatar(notionists, {
    seed: p.name,
    backgroundColor: ["c0aede", "d1d4f9", "b6e3f4", "ffd5dc", "ffdfbf"],
  }).toString();
  fs.writeFileSync(path.join(root, "avatars", `${p.avatar}.svg`), svg);
}
fs.writeFileSync(path.join(root, "hero.svg"), hero());
fs.writeFileSync(path.join(process.cwd(), "public", "logo.svg"), logo("#fff", "#000"));
fs.writeFileSync(path.join(process.cwd(), "src", "app", "icon.svg"), logo("#fff", "#000"));
console.log("✓ images generated");
