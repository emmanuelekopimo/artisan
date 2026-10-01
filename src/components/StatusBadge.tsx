import type { QuoteStatus } from "@/db/schema";
import { STATUS_LABEL } from "@/lib/quote-status";

const QUOTE_COLOR: Record<QuoteStatus, string> = {
  pending: "yellow", quoted: "blue", accepted: "green", declined: "red", completed: "black",
};

export function QuoteBadge({ status }: { status: QuoteStatus }) {
  return <span className={`badge ${QUOTE_COLOR[status]}`} data-testid="quote-status">{STATUS_LABEL[status]}</span>;
}

const PROVIDER: Record<string, [string, string]> = {
  pending: ["yellow", "Pending verification"], verified: ["green", "Verified"], rejected: ["red", "Rejected"],
};

export function ProviderBadge({ status }: { status: string }) {
  const [c, label] = PROVIDER[status] ?? ["", status];
  return <span className={`badge ${c}`} data-testid="provider-status">{label}</span>;
}
