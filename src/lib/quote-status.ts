import type { QuoteStatus, Role } from "@/db/schema";

/**
 * Quote lifecycle:
 *   pending --(provider sends price)--> quoted --(customer accepts)--> accepted --(provider)--> completed
 *   pending --(provider declines)-----> declined
 *   quoted  --(customer declines)-----> declined
 */
const TRANSITIONS: Record<QuoteStatus, Partial<Record<QuoteStatus, Role>>> = {
  pending: { quoted: "provider", declined: "provider" },
  quoted: { accepted: "customer", declined: "customer" },
  accepted: { completed: "provider" },
  declined: {},
  completed: {},
};

export function canTransition(from: QuoteStatus, to: QuoteStatus, actor: Role): boolean {
  return TRANSITIONS[from][to] === actor;
}

export const STATUS_LABEL: Record<QuoteStatus, string> = {
  pending: "Awaiting quote",
  quoted: "Quote received",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};
