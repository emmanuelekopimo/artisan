import Link from "next/link";
import type { ProviderCard as Card } from "@/lib/services/providers";
import { naira } from "@/lib/format";
import { Icon } from "./Icon";

export function ProviderCard({ p }: { p: Card }) {
  return (
    <Link href={`/artisans/${p.id}`} className="pcard" data-testid="provider-card">
      <div className="pcard-cover">
        {p.coverUrl && <img src={p.coverUrl} alt={`${p.businessName} work`} />}
        <span className="badge black floating-badge"><Icon name="badge-check" size={14} color="#05A357" /> Verified</span>
      </div>
      <div className="pcard-body">
        <img className="pcard-avatar" src={p.avatarUrl ?? "/logo.svg"} alt="" />
        <div className="row spread">
          <h3 style={{ margin: 0 }}>{p.businessName}</h3>
          <span className="rating"><Icon name="star" size={16} color="#000" /> {p.rating.toFixed(1)}</span>
        </div>
        <div className="muted small">{p.ownerName} · {p.categoryName.replace(/s$/, "")}</div>
        <div className="row small muted" style={{ gap: 14 }}>
          <span className="row" style={{ gap: 4 }}><Icon name="map-pin" size={14} /> {p.areaName}</span>
          <span className="row" style={{ gap: 4 }}><Icon name="briefcase" size={14} /> {p.yearsExperience} yrs</span>
          <span className="row" style={{ gap: 4 }}><Icon name="check" size={14} /> {p.jobsCompleted} jobs</span>
        </div>
        <div style={{ marginTop: "auto", paddingTop: 8 }} className="row spread">
          <span className="small muted">From <b style={{ color: "#000", fontSize: "1rem" }}>{naira(p.startingPrice)}</b></span>
          <span className="btn sm secondary">Request quote</span>
        </div>
      </div>
    </Link>
  );
}
