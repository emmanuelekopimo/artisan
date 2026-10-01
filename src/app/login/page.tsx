import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { getSession, homeFor } from "@/lib/session";
import { AuthSide } from "@/components/AuthSide";
import { Flash, one, type PageSearchParams } from "@/components/Flash";

export const metadata = { title: "Log in — Artisan" };

export default async function Login({ searchParams }: { searchParams: PageSearchParams }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const sp = await searchParams;
  return (
    <div className="auth-wrap">
      <AuthSide title="Welcome back" points={["Track your quote requests", "Reply to customers fast", "Manage verifications"]} />
      <div className="auth-form">
        <h2>Log in to Artisan</h2>
        <p className="muted">Customers, artisans and admins all log in here.</p>
        <Flash error={one(sp.error)} ok={one(sp.ok)} />
        <form action={loginAction} data-testid="login-form">
          <input type="hidden" name="next" value={one(sp.next) ?? ""} />
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required autoComplete="email" /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" className="input" required autoComplete="current-password" /></div>
          <button className="btn block">Log in</button>
        </form>
        <p className="small muted" style={{ marginTop: 16 }}>New here? <Link href="/register" style={{ fontWeight: 600, color: "#000" }}>Create an account</Link></p>
        <div className="demo-box" data-testid="demo-accounts">
          <b>Demo accounts</b> (password <code>password123</code>)
          <div>Customer: <code>customer@artisan.ng</code></div>
          <div>Artisan: <code>tunde@artisan.ng</code></div>
          <div>Admin: <code>admin@artisan.ng</code></div>
        </div>
      </div>
    </div>
  );
}
