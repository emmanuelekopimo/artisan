import Link from "next/link";
import { listAreas, listCategories } from "@/lib/services/catalog";
import { searchProviders } from "@/lib/services/providers";
import { searchSchema } from "@/lib/validation";
import { Icon } from "@/components/Icon";
import { ProviderCard } from "@/components/ProviderCard";
import { one, type PageSearchParams } from "@/components/Flash";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find an artisan — Artisan" };

export default async function Browse({ searchParams }: { searchParams: PageSearchParams }) {
  const sp = await searchParams;
  const parsed = searchSchema.safeParse({ category: one(sp.category) || undefined, area: one(sp.area) || undefined, q: one(sp.q) || undefined, sort: one(sp.sort) || undefined });
  const params = parsed.success ? parsed.data : {};
  const [categories, areas, results] = await Promise.all([listCategories(), listAreas(), searchProviders(params)]);
  const activeCat = categories.find((c) => c.slug === params.category);
  const activeArea = areas.find((a) => a.slug === params.area);

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/artisans?${s}` : "/artisans";
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1 style={{ fontSize: "2.4rem" }}>
          {activeCat ? activeCat.name : "All artisans"}{activeArea ? ` in ${activeArea.name}` : " in Lagos"}
        </h1>
        <p className="muted">Only artisans verified by the Artisan team are shown.</p>
      </div>

      <div className="chips" style={{ marginBottom: 16 }} data-testid="category-chips">
        <Link href={href({ category: undefined })} className={`chip ${!params.category ? "active" : ""}`}>All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={href({ category: c.slug })} className={`chip ${params.category === c.slug ? "active" : ""}`}>
            <Icon name={c.icon} size={16} /> {c.name}
          </Link>
        ))}
      </div>

      <form className="row wrap" style={{ marginBottom: 24 }} action="/artisans" data-testid="filters">
        {params.category && <input type="hidden" name="category" value={params.category} />}
        <div className="search-input" style={{ flex: "2 1 240px" }}>
          <span className="lead-icon"><Icon name="search" size={18} /></span>
          <input className="input" name="q" placeholder="Search by name or skill" defaultValue={params.q ?? ""} />
        </div>
        <div className="search-input" style={{ flex: "1 1 180px" }}>
          <span className="lead-icon"><Icon name="map-pin" size={18} /></span>
          <select className="input" name="area" defaultValue={params.area ?? ""} aria-label="Area">
            <option value="">All areas</option>
            {areas.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
          </select>
        </div>
        <select className="input" name="sort" defaultValue={params.sort ?? "rating"} style={{ flex: "1 1 160px", width: "auto" }} aria-label="Sort">
          <option value="rating">Top rated</option>
          <option value="price">Lowest price</option>
          <option value="experience">Most experienced</option>
        </select>
        <button className="btn">Apply</button>
      </form>

      <p className="small muted" data-testid="result-count"><b style={{ color: "#000" }}>{results.length}</b> artisan{results.length === 1 ? "" : "s"} found</p>

      {results.length ? (
        <div className="grid grid-3">{results.map((p) => <ProviderCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="empty card flat">
          <Icon name="search" size={40} />
          <h3 style={{ marginTop: 12 }}>No artisans match those filters yet</h3>
          <p>Try another area or trade.</p>
          <Link href="/artisans" className="btn secondary">Clear filters</Link>
        </div>
      )}
    </div>
  );
}
