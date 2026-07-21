// Temporary design-system verification screen.
// Confirms Direction B tokens + fonts render before we build the real Home.
export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="font-display text-xl font-extrabold tracking-tight text-brand-dark">
            Mundo
            <span className="ml-1 align-middle text-[10px] font-semibold text-muted">
              dos Brinquedos
            </span>
          </span>
          <div className="ml-auto flex items-center gap-3 text-lg">
            <span>♡</span>
            <span>🛒</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-brand to-sun p-8 text-white shadow-[var(--shadow-pop)]">
          <span className="inline-block rounded-full bg-pix px-3 py-1 text-xs font-extrabold text-white">
            💠 Pix com desconto
          </span>
          <h1 className="mt-4 max-w-md text-4xl font-extrabold">
            Diversão que chega em todo o Brasil
          </h1>
          <p className="mt-2 font-body text-white/95">
            Varejo &amp; atacado · entrega nacional
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn bg-white px-5 py-2.5 text-brand-dark">
              Comprar agora
            </button>
            <button className="btn border border-white/60 bg-white/20 px-5 py-2.5 text-white">
              Ver ofertas
            </button>
          </div>
        </div>

        <p className="mt-8 text-sm font-semibold text-muted">
          Sistema de design (Direção B · Confete) — fundação pronta. Próximo:
          componentes + home.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            ["brand", "bg-brand"],
            ["sun", "bg-sun"],
            ["sky", "bg-sky"],
            ["mint", "bg-mint"],
            ["grape", "bg-grape"],
            ["ink", "bg-ink"],
          ].map(([name, cls]) => (
            <div key={name} className="text-center">
              <div
                className={`h-12 w-16 rounded-xl ${cls} shadow-[var(--shadow-card)]`}
              />
              <span className="text-[11px] font-bold text-muted">{name}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
