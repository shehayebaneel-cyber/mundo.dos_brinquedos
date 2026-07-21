import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { brl } from "../../lib/money";
import type { Customer } from "../../lib/types";

const wsTone: Record<string, string> = {
  approved: "bg-pix/10 text-pix", pending: "bg-warn/10 text-warn", rejected: "bg-danger/10 text-danger", none: "bg-surface-2 text-muted",
};

export function AdminCustomers({ wholesaleOnly = false }: { wholesaleOnly?: boolean }) {
  const [list, setList] = useState<Customer[] | null>(null);
  const load = () => api.aGet<Customer[]>("/api/admin/customers").then(setList);
  useEffect(() => { load(); }, []);

  async function setWs(c: Customer, wholesaleStatus: string) {
    await api.aPatch(`/api/admin/customers/${c.id}`, { wholesaleStatus, kind: wholesaleStatus === "approved" ? "atacado" : c.kind });
    load();
  }

  if (!list) return <p className="text-muted">Carregando…</p>;
  const shown = wholesaleOnly ? list.filter((c) => c.kind === "atacado" || c.wholesaleStatus !== "none") : list;

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{wholesaleOnly ? "Atacado" : "Clientes"}</h1>
      <div className="space-y-3">
        {shown.map((c) => (
          <div key={c.id} className="rounded-[16px] border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-bold text-ink">{c.name}</span>
              {c.businessName && <span className="text-sm text-muted">· {c.businessName}</span>}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.kind === "atacado" ? "bg-grape/10 text-grape" : "bg-sky/10 text-sky"}`}>{c.kind}</span>
              {c.kind === "atacado" && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${wsTone[c.wholesaleStatus]}`}>{c.wholesaleStatus}</span>}
              <span className="ml-auto text-sm text-muted">{c.ordersCount ?? 0} pedidos · <b className="text-ink tabular">{brl(c.spentCents ?? 0)}</b></span>
            </div>
            <div className="mt-1 text-sm text-muted">{c.email} · {c.phone} · {c.city}-{c.state}{c.cpfCnpj && ` · ${c.cpfCnpj}`}</div>
            {c.notes && <div className="mt-1 text-sm italic text-muted">“{c.notes}”</div>}
            {c.kind === "atacado" && c.wholesaleStatus !== "approved" && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => setWs(c, "approved")} className="btn btn-primary px-4 py-1.5 text-sm">Aprovar atacado</button>
                {c.wholesaleStatus !== "rejected" && <button onClick={() => setWs(c, "rejected")} className="btn btn-ghost px-4 py-1.5 text-sm text-danger">Rejeitar</button>}
              </div>
            )}
            {c.wholesaleStatus === "approved" && <button onClick={() => setWs(c, "rejected")} className="btn btn-ghost mt-2 px-4 py-1.5 text-sm">Suspender acesso atacado</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
