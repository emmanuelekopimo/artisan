import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container empty" style={{ padding: "96px 16px" }}>
      <h1>Page not found</h1>
      <p>We couldn&apos;t find what you were looking for.</p>
      <Link href="/artisans" className="btn">Browse artisans</Link>
    </div>
  );
}
