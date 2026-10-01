import Link from "next/link";
import { listAreas, listCategories } from "@/lib/services/catalog";
import { searchProviders } from "@/lib/services/providers";
import { CATEGORY_COLOR, Icon } from "@/components/Icon";
import { ProviderCard } from "@/components/ProviderCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, areas, top] = await Promise.all([listCategories(), listAreas(), searchProviders({ sort: "rating" })]);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Get it fixed by trusted artisans near you</h1>
            <p className="muted" style={{ fontSize: "1.15rem", maxWidth: 480 }}>
              Plumbers, electricians, tailors, mechanics and more, all checked by our team. Pick a trade, choose your area and request a quote.
            </p>
            <form action="/artisans" className="search-card stack" data-testid="hero-search">
              <div className="search-line">
                <div className="search-input">
                  <span className="lead-icon"><Icon name="wrench" size={18} /></span>
                  <select name="category" className="input" aria-label="Trade" defaultValue="">
                    <option value="">What do you need? (any trade)</option>
                    {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="search-input">
                <span className="lead-icon"><Icon name="map-pin" size={18} /></span>
                <select name="area" className="input" aria-label="Area" defaultValue="">
                  <option value="">Where? (all of Lagos)</option>
                  {areas.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
                </select>
              </div>
              <div className="row">
                <button className="btn">See artisans</button>
                <Link href="/register?role=provider" className="btn secondary">I&apos;m an artisan</Link>
              </div>
            </form>
          </div>
          <div className="hero-art"><img src="/images/hero.svg" alt="Map with nearby artisans" /></div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row spread" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Suggestions</h2>
            <Link href="/artisans" className="row small" style={{ fontWeight: 600 }}>See all <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="grid grid-3" data-testid="categories">
            {categories.map((c) => (
              <Link key={c.id} href={`/artisans?category=${c.slug}`} className="cat-tile">
                <div>
                  <div className="cat-name">{c.name}</div>
                  <div className="small muted" style={{ maxWidth: 220 }}>{c.description}</div>
                </div>
                <div className="cat-icon" style={{ background: CATEGORY_COLOR[c.slug] }}><Icon name={c.icon} size={32} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section gray" id="how">
        <div className="container">
          <h2>How Artisan works</h2>
          <p className="muted">Three steps for customers, and a verified storefront for artisans.</p>
          <div className="grid grid-3" style={{ marginTop: 24 }}>
            {[
              ["search", "1. Search", "Filter artisans by trade and area. Every listing has photos of real past work."],
              ["quote", "2. Request a quote", "Describe the job, your address and a preferred date. The artisan replies with a price."],
              ["check", "3. Accept & get it done", "Accept the quote you like. The artisan schedules the job and marks it complete."],
            ].map(([icon, title, body]) => (
              <div key={title} className="card shadow">
                <div className="icon-box" style={{ background: "#000", color: "#fff", marginBottom: 16 }}><Icon name={icon!} /></div>
                <h3>{title}</h3>
                <p className="muted" style={{ margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="row spread" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Top-rated artisans</h2>
            <Link href="/artisans" className="btn sm secondary">Browse all</Link>
          </div>
          <div className="grid grid-3">
            {top.slice(0, 6).map((p) => <ProviderCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="band">
          <div>
            <h2 style={{ color: "#fff" }}>Are you a skilled artisan?</h2>
            <p style={{ color: "#afafaf", margin: 0 }}>Register your trade and area, upload photos of your past work and get verified to start receiving quote requests.</p>
          </div>
          <Link href="/register?role=provider" className="btn white pill">Join as an artisan <Icon name="arrow" size={18} /></Link>
        </div>
      </section>
    </>
  );
}
