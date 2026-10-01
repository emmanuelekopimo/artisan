import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import { getSession, homeFor } from "@/lib/session";
import { AuthSide } from "@/components/AuthSide";
import { Flash, one, type PageSearchParams } from "@/components/Flash";

export const metadata = { title: "Sign up | Artisan" };

export default async function Register({ searchParams }: { searchParams: PageSearchParams }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const sp = await searchParams;
  const role = one(sp.role) === "provider" ? "provider" : "customer";
  return (
    <div className="auth-wrap">
      <AuthSide
        title={role === "provider" ? "Grow your trade with Artisan" : "Find help you can trust"}
        points={role === "provider"
          ? ["Free listing for verified artisans", "Show off photos of your work", "Get quote requests from your area"]
          : ["Every artisan is verified", "Compare prices with quotes", "Plumbers, electricians, tailors and more"]}
      />
      <div className="auth-form">
        <h2>Create your account</h2>
        <Flash error={one(sp.error)} />
        <form action={registerAction} data-testid="register-form">
          <div className="role-pick">
            <input type="radio" id="role-customer" name="role" value="customer" defaultChecked={role === "customer"} />
            <label htmlFor="role-customer"><b>I need an artisan</b><div className="small muted">Customer</div></label>
            <input type="radio" id="role-provider" name="role" value="provider" defaultChecked={role === "provider"} />
            <label htmlFor="role-provider"><b>I am an artisan</b><div className="small muted">Service provider</div></label>
          </div>
          <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" className="input" required minLength={2} /></div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required /></div>
          <div className="field"><label htmlFor="phone">Phone (optional)</label><input id="phone" name="phone" className="input" placeholder="0803 000 0000" /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" className="input" required minLength={8} /><div className="hint">At least 8 characters</div></div>
          <button className="btn block">Create account</button>
        </form>
        <p className="small muted" style={{ marginTop: 16 }}>Already have an account? <Link href="/login" style={{ fontWeight: 600, color: "#000" }}>Log in</Link></p>
      </div>
    </div>
  );
}
