import { useState } from "react";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [ok, setOk] = useState(() => localStorage.getItem("mundo_cookies") === "1");
  if (ok) return null;
  const accept = () => {
    localStorage.setItem("mundo_cookies", "1");
    setOk(true);
  };
  return (
    <div className="fixed inset-x-2 bottom-20 z-40 mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-pop)] md:bottom-4">
      <p className="text-sm text-ink">
        🍪 Usamos cookies para melhorar sua experiência, lembrar seu carrinho e personalizar ofertas. Ao continuar, você concorda com nossa{" "}
        <Link to="/cookies" className="font-bold text-brand-dark underline">Política de Cookies</Link>.
      </p>
      <div className="mt-2 flex gap-2">
        <button onClick={accept} className="btn btn-primary px-5 py-2 text-sm">Aceitar</button>
        <Link to="/privacidade" onClick={accept} className="btn btn-ghost px-5 py-2 text-sm">Saber mais</Link>
      </div>
    </div>
  );
}
