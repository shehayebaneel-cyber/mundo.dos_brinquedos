import { useStore, waLink } from "../lib/store";

// Floating WhatsApp — sits above the mobile bottom nav so it never covers buttons.
export function WhatsAppFloat() {
  const { settings } = useStore();
  if (!settings.whatsapp) return null;
  return (
    <a
      href={waLink(settings.whatsapp, "Olá! Vim pelo site e gostaria de mais informações. 🧸")}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-20 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-3xl shadow-[var(--shadow-pop)] transition-transform active:scale-90 md:bottom-6"
    >
      💬
    </a>
  );
}
