import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Review } from "../../lib/types";
import { Stars } from "../../components/Stars";
import { useI18n } from "../../lib/i18n";

export function AdminReviews() {
  const { t } = useI18n();
  const [list, setList] = useState<Review[] | null>(null);
  const load = () => api.aGet<Review[]>("/api/admin/reviews").then(setList);
  useEffect(() => { load(); }, []);

  async function approve(r: Review, approved: boolean) {
    await api.aPatch(`/api/admin/reviews/${r.id}`, { approved });
    load();
  }
  async function del(r: Review) {
    if (!confirm(t("Excluir esta avaliação?"))) return;
    await api.aDel(`/api/admin/reviews/${r.id}`);
    load();
  }

  if (!list) return <p className="text-muted">{t("Carregando…")}</p>;
  const pending = list.filter((r) => !r.approved);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink">{t("Avaliações")}</h1>
      <p className="mb-4 text-sm text-muted">{t("{n} aguardando aprovação de {m} no total.", { n: pending.length, m: list.length })}</p>
      <div className="space-y-3">
        {list.map((r) => (
          <div key={r.id} className={`rounded-[16px] border bg-surface p-4 ${r.approved ? "border-line" : "border-warn/50 bg-warn/5"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink">{r.author}</span>
              <Stars value={r.rating} size="text-xs" />
              <span className="text-xs text-muted">· {r.product?.name}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${r.approved ? "bg-pix/10 text-pix" : "bg-warn/10 text-warn"}`}>{r.approved ? t("publicada") : t("pendente")}</span>
            </div>
            <p className="mt-1 text-sm text-ink/90">{r.comment}</p>
            <div className="mt-2 flex gap-2">
              {!r.approved && <button onClick={() => approve(r, true)} className="btn btn-primary px-4 py-1.5 text-sm">{t("Aprovar")}</button>}
              {r.approved && <button onClick={() => approve(r, false)} className="btn btn-ghost px-4 py-1.5 text-sm">{t("Ocultar")}</button>}
              <button onClick={() => del(r)} className="btn btn-ghost px-4 py-1.5 text-sm text-danger">{t("Excluir")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
