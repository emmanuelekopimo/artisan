import { Icon } from "./Icon";

export function AuthSide({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="auth-side">
      <img src="/logo.svg" alt="" width={56} style={{ marginBottom: 24, border: "1px solid #333", borderRadius: 16 }} />
      <h1 style={{ fontSize: "2.6rem", color: "#fff" }}>{title}</h1>
      <div className="stack" style={{ marginTop: 16 }}>
        {points.map((p) => (
          <div key={p} className="row" style={{ color: "#ddd" }}><Icon name="check" color="#05A357" /> {p}</div>
        ))}
      </div>
    </div>
  );
}
