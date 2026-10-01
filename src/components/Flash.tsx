import { Icon } from "./Icon";

export function Flash({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <div className="alert error" role="alert" data-testid="flash-error"><Icon name="alert" size={18} /> {error}</div>;
  if (ok) return <div className="alert success" role="status" data-testid="flash-ok"><Icon name="check" size={18} /> {ok}</div>;
  return null;
}

export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
