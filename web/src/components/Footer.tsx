import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useI18n } from "../lib/i18n";

export function Footer() {
  const { settings } = useStore();
  const { t, tf } = useI18n();
  return (
    <footer className="mt-12 bg-ink px-4 pb-24 pt-10 text-sm text-white/75 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-lg font-extrabold text-white">{settings.storeName ?? "Mundo dos Brinquedos"}</div>
          <p className="mt-2 leading-relaxed">{tf(settings, "tagline")}</p>
          <p className="mt-3">📍 {settings.address}</p>
          <p>🕗 {settings.hours}</p>
          <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sun">{t("Ver no mapa →")}</a>
        </div>
        <div>
          <h4 className="font-display font-bold text-white">{t("Atendimento")}</h4>
          <ul className="mt-2 space-y-1.5">
            <li>💬 WhatsApp: {settings.whatsappLabel}</li>
            <li>✉️ {settings.email}</li>
            <li><Link to="/contato" className="hover:text-white">{t("Fale conosco")}</Link></li>
            <li><Link to="/faq" className="hover:text-white">{t("Perguntas frequentes")}</Link></li>
            <li><Link to="/rastrear" className="hover:text-white">{t("Rastrear pedido")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-white">{t("Institucional")}</h4>
          <ul className="mt-2 space-y-1.5">
            <li><Link to="/sobre" className="hover:text-white">{t("Sobre nós")}</Link></li>
            <li><Link to="/atacado" className="hover:text-white">{t("Atacado")}</Link></li>
            <li><Link to="/entrega" className="hover:text-white">{t("Entrega e frete")}</Link></li>
            <li><Link to="/trocas" className="hover:text-white">{t("Trocas e devoluções")}</Link></li>
            <li><Link to="/privacidade" className="hover:text-white">{t("Privacidade (LGPD)")}</Link></li>
            <li><Link to="/termos" className="hover:text-white">{t("Termos de uso")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold text-white">{t("Siga & pague")}</h4>
          <a href={settings.instagram} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-full bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] px-4 py-1.5 text-xs font-bold text-white">
            📸 {settings.instagramHandle}
          </a>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["PIX", "VISA", "MASTER", "ELO", "BOLETO"].map((m) => (
              <span key={m} className="rounded bg-white px-2 py-1 text-[10px] font-extrabold text-ink">{m}</span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/60">🔒 {t("Compra 100% segura")}</div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-4 text-xs text-white/50">
        © {new Date().getFullYear()} {settings.storeName}. CNPJ 00.000.000/0001-00 · Goiânia, GO.
      </p>
    </footer>
  );
}
