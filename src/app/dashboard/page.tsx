import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { getProviderByUser } from "@/lib/services/providers";
import { listQuotesForCustomer, listQuotesForProvider } from "@/lib/services/quotes";
import { naira, timeAgo } from "@/lib/format";
import { acceptQuoteAction, declineQuoteAction } from "@/app/actions/customer";
import { completeJobAction, declineRequestAction, sendQuoteAction } from "@/app/actions/provider";
import { Icon } from "@/components/Icon";
import { ProviderBadge, QuoteBadge } from "@/components/StatusBadge";
import { Flash, one, type PageSearchParams } from "@/components/Flash";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Artisan" };

const STEPS = ["pending", "quoted", "accepted", "completed"];
function Progress({ status }: { status: string }) {
  const idx = status === "declined" ? -1 : STEPS.indexOf(status);
  return (
    <div className="status-strip" aria-hidden>
      {STEPS.map((s, i) => <div key={s} className={`status-step ${i <= idx ? "done" : ""}`} />)}
    </div>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: PageSearchParams }) {
  const session = await requireRole("customer", "provider", "admin");
  if (session.role === "admin") redirect("/admin");
  const sp = await searchParams;
  const flash = <Flash error={one(sp.error)} ok={one(sp.ok)} />;
  return session.role === "customer"
    ? <CustomerDashboard userId={session.userId} name={session.name} flash={flash} />
    : <ProviderDashboard userId={session.userId} name={session.name} flash={flash} />;
}

async function CustomerDashboard({ userId, name, flash }: { userId: number; name: string; flash: React.ReactNode }) {
  const quotes = await listQuotesForCustomer(userId);
  const open = quotes.filter((q) => ["pending", "quoted", "accepted"].includes(q.quote.status)).length;
  return (
    <div className="container">
      <div className="page-head row spread wrap">
        <div>
          <h1 style={{ fontSize: "2.2rem" }}>Hi, {name.split(" ")[0]}</h1>
          <p className="muted">You have {open} active request{open === 1 ? "" : "s"}.</p>
        </div>
        <Link href="/artisans" className="btn"><Icon name="search" size={18} /> Find an artisan</Link>
      </div>
      {flash}
      <h2 style={{ fontSize: "1.4rem" }}>My quote requests</h2>
      {quotes.length === 0 && (
        <div className="empty card flat"><Icon name="quote" size={40} /><h3>No requests yet</h3><p>Browse artisans and request your first quote.</p></div>
      )}
      <div className="grid grid-2" data-testid="customer-quotes">
        {quotes.map(({ quote: q, ...p }) => (
          <div key={q.id} className="card" data-testid="quote-card">
            <div className="row spread">
              <div className="row">
                <img src={p.avatarUrl ?? "/logo.svg"} alt="" width={44} height={44} className="avatar" />
                <div>
                  <b>{q.title}</b>
                  <div className="small muted"><Link href={`/artisans/${p.providerId}`}>{p.businessName}</Link> · {p.categoryName.replace(/s$/, "")}</div>
                </div>
              </div>
              <QuoteBadge status={q.status} />
            </div>
            <Progress status={q.status} />
            <p className="small muted" style={{ marginBottom: 8 }}>{q.details}</p>
            <div className="small muted row wrap" style={{ gap: 14 }}>
              <span className="row" style={{ gap: 4 }}><Icon name="map-pin" size={14} /> {q.address}</span>
              <span className="row" style={{ gap: 4 }}><Icon name="clock" size={14} /> {timeAgo(q.createdAt)}</span>
            </div>
            {q.quotedPrice != null && (
              <div className="card flat" style={{ marginTop: 12, padding: 14 }}>
                <div className="row spread"><span className="small muted">Quoted price</span><span className="price" data-testid="quoted-price">{naira(q.quotedPrice)}</span></div>
                {q.providerNote && <div className="small">“{q.providerNote}”</div>}
              </div>
            )}
            {q.status === "quoted" && (
              <div className="row" style={{ marginTop: 12 }}>
                <form action={acceptQuoteAction}><input type="hidden" name="quoteId" value={q.id} /><button className="btn green sm">Accept quote</button></form>
                <form action={declineQuoteAction}><input type="hidden" name="quoteId" value={q.id} /><button className="btn secondary sm">Decline</button></form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

async function ProviderDashboard({ userId, name, flash }: { userId: number; name: string; flash: React.ReactNode }) {
  const provider = await getProviderByUser(userId);
  if (!provider) redirect("/dashboard/profile");
  const quotes = await listQuotesForProvider(provider.id);
  const pending = quotes.filter((q) => q.quote.status === "pending");
  const earnings = quotes.filter((q) => q.quote.status === "completed").reduce((s, q) => s + (q.quote.quotedPrice ?? 0), 0);

  return (
    <div className="container">
      <div className="page-head row spread wrap">
        <div>
          <div className="row" style={{ gap: 8 }}><h1 style={{ fontSize: "2.2rem", margin: 0 }}>{provider.businessName}</h1><ProviderBadge status={provider.status} /></div>
          <p className="muted">Welcome back, {name.split(" ")[0]}.</p>
        </div>
        <div className="row">
          {provider.status === "verified" && <Link href={`/artisans/${provider.id}`} className="btn secondary">View public profile</Link>}
          <Link href="/dashboard/profile" className="btn">Edit profile & photos</Link>
        </div>
      </div>
      {flash}
      {provider.status === "pending" && (
        <div className="alert info" data-testid="pending-banner"><Icon name="hourglass" size={18} /> Your profile is awaiting admin verification. Customers will see you as soon as you are approved.</div>
      )}
      {provider.status === "rejected" && (
        <div className="alert error"><Icon name="x" size={18} /> Verification was declined: {provider.rejectionReason} Update your profile to resubmit.</div>
      )}

      <div className="grid grid-4" style={{ margin: "16px 0 32px" }}>
        <div className="kpi"><div className="small muted">New requests</div><div className="num" data-testid="kpi-new">{pending.length}</div></div>
        <div className="kpi"><div className="small muted">Total requests</div><div className="num">{quotes.length}</div></div>
        <div className="kpi"><div className="small muted">Jobs completed</div><div className="num">{provider.jobsCompleted}</div></div>
        <div className="kpi"><div className="small muted">Earned on Artisan</div><div className="num">{naira(earnings)}</div></div>
      </div>

      <h2 style={{ fontSize: "1.4rem" }}>Quote requests</h2>
      {quotes.length === 0 && <div className="empty card flat"><Icon name="quote" size={40} /><h3>No requests yet</h3><p>Requests from customers will appear here.</p></div>}
      <div className="stack" data-testid="provider-quotes">
        {quotes.map(({ quote: q, customerName, customerPhone }) => (
          <div key={q.id} className="card" data-testid="request-card">
            <div className="row spread wrap">
              <div>
                <b style={{ fontSize: "1.1rem" }}>{q.title}</b>
                <div className="small muted">{customerName}{q.status === "accepted" && customerPhone ? ` · ${customerPhone}` : ""} · {timeAgo(q.createdAt)}</div>
              </div>
              <QuoteBadge status={q.status} />
            </div>
            <p style={{ margin: "10px 0" }}>{q.details}</p>
            <div className="small muted row wrap" style={{ gap: 14 }}>
              <span className="row" style={{ gap: 4 }}><Icon name="map-pin" size={14} /> {q.address}</span>
              {q.preferredDate && <span className="row" style={{ gap: 4 }}><Icon name="clock" size={14} /> Preferred {q.preferredDate}</span>}
              {q.quotedPrice != null && <span className="row" style={{ gap: 4 }}><b style={{ color: "#000" }}>{naira(q.quotedPrice)}</b> quoted</span>}
            </div>
            {q.status === "pending" && (
              <div className="row wrap" style={{ marginTop: 14, alignItems: "flex-end" }}>
                <form action={sendQuoteAction} className="row wrap" style={{ flex: 1, alignItems: "flex-end" }} data-testid="send-quote-form">
                  <input type="hidden" name="quoteId" value={q.id} />
                  <div style={{ width: 160 }}><label htmlFor={`price-${q.id}`}>Price (₦)</label><input id={`price-${q.id}`} name="price" type="number" min={1} className="input" required /></div>
                  <div style={{ flex: 1, minWidth: 200 }}><label htmlFor={`note-${q.id}`}>Note to customer</label><input id={`note-${q.id}`} name="note" className="input" placeholder="What's included, when you can come…" /></div>
                  <button className="btn">Send quote</button>
                </form>
                <form action={declineRequestAction}><input type="hidden" name="quoteId" value={q.id} /><button className="btn danger">Decline</button></form>
              </div>
            )}
            {q.status === "accepted" && (
              <form action={completeJobAction} style={{ marginTop: 14 }}>
                <input type="hidden" name="quoteId" value={q.id} />
                <button className="btn green sm"><Icon name="check" size={16} /> Mark job completed</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
