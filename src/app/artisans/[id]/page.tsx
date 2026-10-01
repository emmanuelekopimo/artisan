import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvider } from "@/lib/services/providers";
import { getSession } from "@/lib/session";
import { naira } from "@/lib/format";
import { requestQuoteAction } from "@/app/actions/customer";
import { CATEGORY_COLOR, Icon } from "@/components/Icon";
import { Flash, one, type PageSearchParams } from "@/components/Flash";

export const dynamic = "force-dynamic";

export default async function ProviderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: PageSearchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await getProvider(Number(id));
  const session = await getSession();
  // Unverified profiles are only visible to their owner and admins.
  if (!p || (p.status !== "verified" && session?.role !== "admin" && session?.userId !== p.userId)) notFound();

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <Link href={`/artisans?category=${p.categorySlug}`} className="row small muted" style={{ marginBottom: 16 }}>
        ← Back to {p.categoryName}
      </Link>
      <div className="profile-grid">
        <div>
          <div className="row" style={{ gap: 16, marginBottom: 20 }}>
            <img src={p.avatarUrl ?? "/logo.svg"} alt="" width={88} height={88} className="avatar" />
            <div>
              <div className="row wrap" style={{ gap: 8 }}>
                <h1 style={{ fontSize: "2.2rem", margin: 0 }} data-testid="provider-name">{p.businessName}</h1>
                {p.status === "verified" && <span className="badge green"><Icon name="badge-check" size={14} /> Verified</span>}
              </div>
              <div className="muted">{p.ownerName}</div>
              <div className="row wrap small" style={{ gap: 14, marginTop: 6 }}>
                <span className="row" style={{ gap: 4, color: CATEGORY_COLOR[p.categorySlug], fontWeight: 600 }}>
                  <Icon name={p.categoryIcon} size={16} /> {p.categoryName.replace(/s$/, "")}
                </span>
                <span className="row" style={{ gap: 4 }}><Icon name="map-pin" size={16} /> {p.areaName}, Lagos</span>
              </div>
            </div>
          </div>

          <div className="stat-row" style={{ marginBottom: 24 }}>
            <div className="stat"><b className="row" style={{ gap: 4 }}><Icon name="star" size={18} /> {p.rating ? p.rating.toFixed(1) : "New"}</b><span className="small muted">Rating</span></div>
            <div className="stat"><b>{p.jobsCompleted}</b><span className="small muted">Jobs done</span></div>
            <div className="stat"><b>{p.yearsExperience} yrs</b><span className="small muted">Experience</span></div>
          </div>

          <h3>About</h3>
          <p className="muted">{p.bio}</p>

          <h3 style={{ marginTop: 24 }}>Past work <span className="muted small">({p.photos.length} photos)</span></h3>
          <div className="gallery" data-testid="gallery">
            {p.photos.map((ph) => (
              <figure key={ph.id}>
                <img src={ph.url} alt={ph.caption} />
                {ph.caption && <figcaption>{ph.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>

        <aside className="card shadow sticky" id="quote">
          <div className="small muted">Starting from</div>
          <div className="price">{naira(p.startingPrice)}</div>
          <p className="small muted">Final price is agreed in the quote.</p>
          <Flash error={one(sp.error)} />
          {session?.role === "customer" && p.status === "verified" ? (
            <form action={requestQuoteAction} data-testid="quote-form">
              <input type="hidden" name="providerId" value={p.id} />
              <div className="field"><label htmlFor="title">What do you need done?</label><input id="title" name="title" className="input" placeholder="e.g. Fix leaking kitchen tap" required minLength={3} /></div>
              <div className="field"><label htmlFor="details">Details</label><textarea id="details" name="details" className="input" placeholder="Describe the job so the artisan can price it" required minLength={10} /></div>
              <div className="field"><label htmlFor="address">Address</label><input id="address" name="address" className="input" placeholder="Street, area" required /></div>
              <div className="field"><label htmlFor="preferredDate">Preferred date</label><input id="preferredDate" type="date" name="preferredDate" className="input" /></div>
              <button className="btn block"><Icon name="quote" size={18} /> Request a quote</button>
            </form>
          ) : session ? (
            <div className="alert info">{session.role === "customer" ? "This artisan isn't accepting quotes yet." : "Log in with a customer account to request a quote."}</div>
          ) : (
            <div className="stack">
              <Link href={`/login?next=/artisans/${p.id}`} className="btn block">Log in to request a quote</Link>
              <Link href="/register" className="btn secondary block">Create a free account</Link>
            </div>
          )}
          <div className="row small muted" style={{ marginTop: 16 }}><Icon name="shield-check" size={16} /> ID and past work checked by Artisan</div>
        </aside>
      </div>
    </div>
  );
}
