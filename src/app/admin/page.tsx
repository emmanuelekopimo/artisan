import Link from "next/link";
import { requireRole } from "@/lib/session";
import { adminStats, listProvidersForAdmin } from "@/lib/services/providers";
import { naira, timeAgo } from "@/lib/format";
import { rejectProviderAction, verifyProviderAction } from "@/app/actions/admin";
import { Icon } from "@/components/Icon";
import { ProviderBadge } from "@/components/StatusBadge";
import { Flash, one, type PageSearchParams } from "@/components/Flash";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Artisan" };

const TABS = [
  ["pending", "Pending"],
  ["verified", "Verified"],
  ["rejected", "Rejected"],
] as const;

export default async function Admin({ searchParams }: { searchParams: PageSearchParams }) {
  await requireRole("admin");
  const sp = await searchParams;
  const status = TABS.find(([s]) => s === one(sp.status))?.[0] ?? "pending";
  const [stats, list] = await Promise.all([adminStats(), listProvidersForAdmin(status)]);
  const back = `/admin?status=${status}`;

  return (
    <div className="container">
      <div className="page-head">
        <h1 style={{ fontSize: "2.2rem" }}>Admin console</h1>
        <p className="muted">Review new artisans before they appear in search.</p>
      </div>
      <Flash error={one(sp.error)} ok={one(sp.ok)} />
      <div className="grid grid-4" style={{ marginBottom: 32 }} data-testid="admin-kpis">
        <div className="kpi"><div className="small muted">Awaiting review</div><div className="num" data-testid="kpi-pending">{stats.pending}</div></div>
        <div className="kpi"><div className="small muted">Verified artisans</div><div className="num" data-testid="kpi-verified">{stats.verified}</div></div>
        <div className="kpi"><div className="small muted">Customers</div><div className="num">{stats.customers}</div></div>
        <div className="kpi"><div className="small muted">Quote requests</div><div className="num">{stats.quotes}</div></div>
      </div>

      <div className="tabs">
        {TABS.map(([s, label]) => (
          <Link key={s} href={`/admin?status=${s}`} className={`tab ${status === s ? "active" : ""}`}>
            {label} ({stats[s]})
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty card flat"><Icon name="check" size={40} /><h3>All caught up</h3><p>No {status} artisans.</p></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table" data-testid="admin-table">
            <thead>
              <tr><th>Artisan</th><th>Trade &amp; area</th><th>Work photos</th><th>Experience</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} data-testid="admin-row">
                  <td>
                    <div className="row">
                      <img src={p.avatarUrl ?? "/logo.svg"} alt="" width={40} height={40} className="avatar" />
                      <div><Link href={`/artisans/${p.id}`} style={{ fontWeight: 600 }}>{p.businessName}</Link><div className="small muted">{p.ownerName} · {p.email}</div></div>
                    </div>
                  </td>
                  <td className="nowrap">{p.categoryName.replace(/s$/, "")}<div className="small muted">{p.areaName}</div></td>
                  <td><div className="thumbs">{p.coverUrl ? <img src={p.coverUrl} alt="" /> : null}<span className="small muted nowrap" style={{ alignSelf: "center" }}>{p.photoCount} photo{p.photoCount === 1 ? "" : "s"}</span></div></td>
                  <td className="nowrap">{p.yearsExperience} yrs<div className="small muted">from {naira(p.startingPrice)}</div></td>
                  <td><ProviderBadge status={p.status} /><div className="small muted nowrap" style={{ marginTop: 4 }}>Joined {timeAgo(p.createdAt)}</div></td>
                  <td>
                    <div className="row" style={{ justifyContent: "flex-end" }}>
                      {p.status !== "verified" && (
                        <form action={verifyProviderAction}><input type="hidden" name="providerId" value={p.id} /><input type="hidden" name="back" value={back} /><button className="btn sm green" data-testid="verify-btn"><Icon name="badge-check" size={16} /> Verify</button></form>
                      )}
                      {p.status !== "rejected" && (
                        <form action={rejectProviderAction} className="row" style={{ gap: 6 }}>
                          <input type="hidden" name="providerId" value={p.id} /><input type="hidden" name="back" value={back} />
                          <input name="reason" className="input" placeholder="Reason (optional)" style={{ minHeight: 36, height: 36, padding: "4px 10px", width: 130 }} />
                          <button className="btn sm danger" data-testid="reject-btn">Reject</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
