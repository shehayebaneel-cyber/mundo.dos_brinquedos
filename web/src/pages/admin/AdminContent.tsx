import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Banner, Category, Settings } from "../../lib/types";
import { useI18n } from "../../lib/i18n";

const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";
const lbl = "mb-1 block text-xs font-bold text-muted";
const BG = ["brand", "grape", "mint", "sun", "sky"];

export function AdminContent() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"loja" | "banners" | "categorias">("loja");
  return (
    <div>
      <h1 className="mb-3 font-display text-2xl font-extrabold text-ink">{t("Conteúdo & Loja")}</h1>
      <div className="mb-4 flex gap-2">
        {([["loja", "🏬 Informações"], ["banners", "🖼️ Banners"], ["categorias", "🗂️ Categorias"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === k ? "bg-brand text-white" : "bg-surface border border-line text-ink"}`}>{t(l)}</button>
        ))}
      </div>
      {tab === "loja" && <StoreSettings />}
      {tab === "banners" && <Banners />}
      {tab === "categorias" && <Categories />}
    </div>
  );
}

function StoreSettings() {
  const { t } = useI18n();
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api.aGet<Settings>("/api/admin/settings").then(setS); }, []);
  if (!s) return <p className="text-muted">{t("Carregando…")}</p>;
  const set = (k: string, v: string) => setS((c) => ({ ...c!, [k]: v }));
  const fields: [string, string][] = [
    ["storeName", "Nome da loja"], ["tagline", "Slogan"], ["whatsappLabel", "WhatsApp (exibido)"], ["whatsapp", "WhatsApp (só números, com 55)"],
    ["hours", "Horário"], ["address", "Endereço"], ["mapsUrl", "Link do Google Maps"], ["email", "E-mail"],
    ["instagram", "Link do Instagram"], ["instagramHandle", "@ do Instagram"],
  ];
  async function save() { await api.aPut("/api/admin/settings", s); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  return (
    <div className="max-w-2xl rounded-[16px] border border-line bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([k, label]) => (
          <div key={k} className={k === "address" || k === "mapsUrl" ? "sm:col-span-2" : ""}><label className={lbl}>{t(label)}</label><input value={s[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={input} /></div>
        ))}
        <div className="sm:col-span-2 rounded-xl bg-grape/5 p-3">
          <label className={lbl}>{t("Valor do carrinho para o preço de atacado — nível 3 (centavos)")}</label>
          <input value={s.wholesaleThresholdCents ?? ""} onChange={(e) => set("wholesaleThresholdCents", e.target.value)} className={input} placeholder="30000" />
          <p className="mt-1 text-[11px] text-muted">{t("Ex.: 30000 = R$300. Quando o carrinho atinge este valor, todos os produtos recebem o preço de atacado (nível 3). O nível 2 é fixo em 10 itens.")}</p>
        </div>
        <div><label className={lbl}>{t("Pedido mínimo atacado (centavos)")}</label><input value={s.wholesaleMinOrderCents ?? ""} onChange={(e) => set("wholesaleMinOrderCents", e.target.value)} className={input} /></div>
      </div>
      <button onClick={save} className="btn btn-primary mt-4 px-6 py-2.5">{saved ? t("✓ Salvo!") : t("Salvar informações")}</button>
    </div>
  );
}

function Banners() {
  const { t } = useI18n();
  const [list, setList] = useState<Banner[] | null>(null);
  const load = () => api.aGet<Banner[]>("/api/admin/banners").then(setList);
  useEffect(() => { load(); }, []);
  const blank = { title: "", subtitle: "", badge: "", ctaLabel: "", ctaHref: "/produtos", cta2Label: "", cta2Href: "", bg: "brand", emoji: "🧸", sortOrder: 99, active: true };

  async function save(b: Partial<Banner>) {
    if (b.id) await api.aPatch(`/api/admin/banners/${b.id}`, b);
    else await api.aPost("/api/admin/banners", b);
    load();
  }
  async function del(id: number) { if (confirm(t("Excluir banner?"))) { await api.aDel(`/api/admin/banners/${id}`); load(); } }

  if (!list) return <p className="text-muted">{t("Carregando…")}</p>;
  return (
    <div className="space-y-3">
      {list.map((b) => <BannerRow key={b.id} b={b} onSave={save} onDel={() => del(b.id)} />)}
      <BannerRow b={blank as Banner} isNew onSave={save} />
    </div>
  );
}

function BannerRow({ b, isNew, onSave, onDel }: { b: Banner; isNew?: boolean; onSave: (b: Partial<Banner>) => void; onDel?: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState(b);
  const set = (k: string, v: string | boolean | number) => setF((c) => ({ ...c, [k]: v }));
  return (
    <div className={`rounded-[16px] border p-4 ${isNew ? "border-dashed border-brand" : "border-line"} bg-surface`}>
      {isNew && <p className="mb-2 text-sm font-bold text-brand-dark">{t("+ Novo banner")}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={t("Título")} className={input} />
        <input value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder={t("Subtítulo")} className={input} />
        <input value={f.badge} onChange={(e) => set("badge", e.target.value)} placeholder={t("Selo (ex.: 💠 Pix)")} className={input} />
        <div className="flex gap-2">
          <input value={f.emoji} onChange={(e) => set("emoji", e.target.value)} placeholder="🧸" className={`${input} w-16`} />
          <select value={f.bg} onChange={(e) => set("bg", e.target.value)} className={input}>{BG.map((g) => <option key={g}>{g}</option>)}</select>
        </div>
        <input value={f.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder={t("Botão 1 (texto)")} className={input} />
        <input value={f.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} placeholder={t("Botão 1 (link /produtos)")} className={input} />
        <input value={f.cta2Label} onChange={(e) => set("cta2Label", e.target.value)} placeholder={t("Botão 2 (texto)")} className={input} />
        <input value={f.cta2Href} onChange={(e) => set("cta2Href", e.target.value)} placeholder={t("Botão 2 (link)")} className={input} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} className="accent-brand" /> {t("Ativo")}</label>
        <input type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className={`${input} w-20`} title={t("ordem")} />
        <button onClick={() => onSave(f)} className="btn btn-primary ml-auto px-4 py-1.5 text-sm">{isNew ? t("Adicionar") : t("Salvar")}</button>
        {onDel && <button onClick={onDel} className="btn btn-ghost px-4 py-1.5 text-sm text-danger">{t("Excluir")}</button>}
      </div>
    </div>
  );
}

function Categories() {
  const { t } = useI18n();
  const [list, setList] = useState<(Category & { _count?: { products: number } })[] | null>(null);
  const load = () => api.aGet<Category[]>("/api/admin/categories").then(setList);
  useEffect(() => { load(); }, []);
  const [nw, setNw] = useState({ name: "", slug: "", emoji: "🧸", accent: "brand" });

  async function add() {
    if (!nw.name) return;
    await api.aPost("/api/admin/categories", { ...nw, slug: nw.slug || nw.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    setNw({ name: "", slug: "", emoji: "🧸", accent: "brand" });
    load();
  }
  async function del(id: number) { if (confirm(t("Excluir categoria?"))) { await api.aDel(`/api/admin/categories/${id}`); load(); } }
  async function upd(id: number, data: Partial<Category>) { await api.aPatch(`/api/admin/categories/${id}`, data); load(); }

  if (!list) return <p className="text-muted">{t("Carregando…")}</p>;
  return (
    <div className="max-w-2xl space-y-2">
      {list.map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded-[16px] border border-line bg-surface p-3">
          <input defaultValue={c.emoji} onBlur={(e) => e.target.value !== c.emoji && upd(c.id, { emoji: e.target.value })} className={`${input} w-14 text-center`} />
          <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && upd(c.id, { name: e.target.value })} className={input} />
          <span className="whitespace-nowrap text-xs text-muted">{t("{n} prod.", { n: c._count?.products ?? 0 })}</span>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" defaultChecked={c.active} onChange={(e) => upd(c.id, { active: e.target.checked })} className="accent-brand" />{t("ativa")}</label>
          <button onClick={() => del(c.id)} className="px-2 text-danger">✕</button>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-[16px] border border-dashed border-brand bg-surface p-3">
        <input value={nw.emoji} onChange={(e) => setNw({ ...nw, emoji: e.target.value })} className={`${input} w-14 text-center`} />
        <input value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} placeholder={t("Nova categoria")} className={input} />
        <button onClick={add} className="btn btn-primary px-4 py-1.5 text-sm">+ Add</button>
      </div>
    </div>
  );
}
