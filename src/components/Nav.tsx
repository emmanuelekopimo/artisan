import Link from "next/link";
import { getSession, homeFor } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth";
import { Icon } from "./Icon";

export async function Nav() {
  const session = await getSession();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" data-testid="brand">
          <img src="/logo.svg" alt="" /> Artisan
        </Link>
        <nav className="nav-links">
          <Link href="/artisans" className="nav-link">Find an artisan</Link>
          <Link href="/register?role=provider" className="nav-link">Become an artisan</Link>
          <Link href="/#how" className="nav-link">How it works</Link>
        </nav>
        <div className="nav-right">
          {session ? (
            <>
              <Link href={homeFor(session.role)} className="btn sm white" data-testid="nav-dashboard">
                <Icon name="dashboard" size={16} /> {session.role === "admin" ? "Admin" : "Dashboard"}
              </Link>
              <span className="small" style={{ color: "#afafaf" }}>{session.name.split(" ")[0]}</span>
              <form action={logoutAction}>
                <button className="btn sm" style={{ background: "#2b2b2b" }} data-testid="logout">
                  <Icon name="logout" size={16} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">Log in</Link>
              <Link href="/register" className="btn sm white">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
