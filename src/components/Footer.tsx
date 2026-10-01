import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container grid grid-4">
        <div>
          <div className="brand" style={{ marginBottom: 12 }}><img src="/logo.svg" alt="" width={28} /> Artisan</div>
          <p>Verified local artisans, one tap away.</p>
        </div>
        <div className="stack">
          <b style={{ color: "#fff" }}>Customers</b>
          <div><Link href="/artisans">Find an artisan</Link></div>
          <div><Link href="/register">Create account</Link></div>
        </div>
        <div className="stack">
          <b style={{ color: "#fff" }}>Artisans</b>
          <div><Link href="/register?role=provider">Join as an artisan</Link></div>
          <div><Link href="/login">Artisan login</Link></div>
        </div>
        <div className="stack">
          <b style={{ color: "#fff" }}>Project</b>
          <div>300 Level Presentation</div>
          <div>© {new Date().getFullYear()} Artisan</div>
        </div>
      </div>
    </footer>
  );
}
