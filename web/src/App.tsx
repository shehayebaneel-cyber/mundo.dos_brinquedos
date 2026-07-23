import { createBrowserRouter, Link, RouterProvider } from "react-router-dom";
import { I18nProvider, useI18n } from "./lib/i18n";
import { StoreProvider } from "./lib/store";
import { CartProvider } from "./lib/cart";
import { WishlistProvider } from "./lib/wishlist";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { Product } from "./pages/Product";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { Atacado } from "./pages/Atacado";
import { Favoritos } from "./pages/Favoritos";
import { Conta } from "./pages/Conta";
import { Contato, FAQ, Policy, Sobre } from "./pages/Static";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminProductEdit } from "./pages/admin/AdminProductEdit";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminContent } from "./pages/admin/AdminContent";

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-6xl">🧸</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">{t("Página não encontrada")}</h1>
      <Link to="/" className="btn btn-primary mt-4 px-6 py-3">{t("Voltar à loja")}</Link>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/produtos", element: <Shop mode="all" /> },
      { path: "/categoria/:slug", element: <Shop mode="all" /> },
      { path: "/ofertas", element: <Shop mode="ofertas" /> },
      { path: "/busca", element: <Shop mode="search" /> },
      { path: "/produto/:slug", element: <Product /> },
      { path: "/carrinho", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/pedido/:code", element: <OrderConfirmation /> },
      { path: "/atacado", element: <Atacado /> },
      { path: "/favoritos", element: <Favoritos /> },
      { path: "/conta", element: <Conta /> },
      { path: "/sobre", element: <Sobre /> },
      { path: "/contato", element: <Contato /> },
      { path: "/faq", element: <FAQ /> },
      { path: "/privacidade", element: <Policy which="privacidade" /> },
      { path: "/termos", element: <Policy which="termos" /> },
      { path: "/trocas", element: <Policy which="trocas" /> },
      { path: "/reembolso", element: <Policy which="reembolso" /> },
      { path: "/pagamento", element: <Policy which="pagamento" /> },
      { path: "/cookies", element: <Policy which="cookies" /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "produtos", element: <AdminProducts /> },
      { path: "produtos/:id", element: <AdminProductEdit /> },
      { path: "pedidos", element: <AdminOrders /> },
      { path: "clientes", element: <AdminCustomers /> },
      { path: "atacado", element: <AdminCustomers wholesaleOnly /> },
      { path: "avaliacoes", element: <AdminReviews /> },
      { path: "conteudo", element: <AdminContent /> },
    ],
  },
]);

export default function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <WishlistProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </WishlistProvider>
      </StoreProvider>
    </I18nProvider>
  );
}
