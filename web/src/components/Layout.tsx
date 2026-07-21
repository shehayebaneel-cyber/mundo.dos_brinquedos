import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { CookieConsent } from "./CookieConsent";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppFloat />
      <CookieConsent />
      <ScrollRestoration />
    </div>
  );
}
