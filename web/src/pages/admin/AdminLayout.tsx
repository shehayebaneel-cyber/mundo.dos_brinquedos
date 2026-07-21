import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, getAdminKey, setAdminKey } from "../../lib/api";

const NAV = [
  ["/admin", "Painel", "📊", true],
  ["/admin/produtos", "Produtos", "📦", false],
  ["/admin/pedidos", "Pedidos", "🧾", false],
  ["/admin/clientes", "Clientes", "👥", false],
  ["/admin/atacado", "Atacado", "🏷️", false],
  ["/admin/avaliacoes", "Avaliações", "⭐", false],
  ["/admin/conteudo", "Conteúdo & Loja", "🎨", false],
] as const;

export function AdminLayout() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [key, setKey] = useState(getAdminKey());
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (!getAdminKey()) return setAuthed(false);
    api.aGet("/api/admin/overview").then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setAdminKey(key);
    try {
      await api.aGet("/api/admin/overview");
      setAuthed(true);
    } catch {
      setErr("Chave incorreta.");
      setAuthed(false);
    }
  }

  if (authed === null) return <div className="grid min-h-screen place-items-center text-muted">Carregando…</div>;

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-[16px] border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <div className="font-display text-2xl font-extrabold text-brand-dark">Mundo · Admin</div>
          <p className="mt-1 text-sm text-muted">Painel da loja. Informe sua chave de acesso.</p>
          <input value={key} onChange={(e) => setKey(e.target.value)} type="password" placeholder="Chave de acesso" className="mt-4 w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
          {err && <p className="mt-2 text-sm font-semibold text-danger">{err}</p>}
          <button className="btn btn-primary mt-3 w-full py-3">Entrar</button>
          <p className="mt-3 text-center text-xs text-muted">Protótipo: a chave é <code className="rounded bg-surface-2 px-1">mundo123</code></p>
          <Link to="/" className="mt-3 block text-center text-xs text-muted hover:text-brand-dark">← Voltar para a loja</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream lg:flex">
      {/* sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 p-4">
          <Link to="/admin" className="font-display text-xl font-extrabold text-brand-dark">Mundo · Admin</Link>
          <nav className="mt-4 flex flex-col gap-1">
            {NAV.map(([to, label, icon, end]) => (
              <NavLink key={to} to={to} end={end as boolean} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-brand text-white" : "text-ink hover:bg-surface-2"}`}>
                <span>{icon}</span> {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 border-t border-line pt-3">
            <a href="/" className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2">🛍️ Ver a loja</a>
            <button onClick={() => { setAdminKey(""); nav("/admin"); location.reload(); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2">🚪 Sair</button>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto border-b border-line bg-surface px-3 py-2 lg:hidden">
        {NAV.map(([to, label, icon, end]) => (
          <NavLink key={to} to={to} end={end as boolean} className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${isActive ? "bg-brand text-white" : "bg-surface-2 text-ink"}`}>
            {icon} {label}
          </NavLink>
        ))}
      </div>

      <main className="flex-1 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
