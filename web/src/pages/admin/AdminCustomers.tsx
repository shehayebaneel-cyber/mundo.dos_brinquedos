import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { brl } from "../../lib/money";
import type { Customer } from "../../lib/types";
import { useStore, waLink } from "../../lib/store";
import { useI18n } from "../../lib/i18n";

export function AdminCustomers({ wholesaleOnly = false }: { wholesaleOnly?: boolean }) {
  const { t } = useI18n();
  const { settings } = useStore();
  const [list, setList] = useState<Customer[] | null>(null);
  useEffect(() => { api.aGet<Customer[]>("/api/admin/customers").then(setList); }, []);

  if (!list) return <p className="text-muted">{t("Carregando…")}</p>;
  const shown = wholesaleOnly ? list.filter((c) => c.kind === "atacado") : list;

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{wholesaleOnly ? t("Clientes de atacado") : t("Clientes")}</h1>
      {shown.length === 0 && <p className="text-muted">{t("Nenhum cliente ainda.")}</p>}
      <div className="space-y-3">
        {shown.map((c) => (
          <div key={c.id} className="rounded-[16px] border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-bold text-ink">{c.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.kind === "atacado" ? "bg-grape/10 text-grape" : "bg-sky/10 text-sky"}`}>{t(c.kind)}</span>
              <span className="ml-auto text-sm text-muted">{t("{n} pedidos", { n: c.ordersCount ?? 0 })} · <b className="text-ink tabular">{brl(c.spentCents ?? 0)}</b></span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted">
              📱 {c.phone}
              <a href={waLink(c.phone || settings.whatsapp || "", `Olá ${c.name.split(" ")[0]}!`)} target="_blank" rel="noreferrer" className="text-[#128c4a] hover:underline">{t("Falar no WhatsApp")}</a>
            </div>
            {c.notes && <div className="mt-1 text-sm italic text-muted">“{c.notes}”</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
