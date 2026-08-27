import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { CurrencyProvider } from "./components/CurrencySelector";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import NewsletterPopup from "./components/NewsletterPopup";
import GameFloatingButton from "./components/GameFloatingButton";
import WhatsAppButton from "./components/WhatsAppButton";
import MobileBottomNav from "./components/MobileBottomNav";
// LiveChat removed per user request (overlapping with WhatsApp button)
// PushNotificationPrompt removed per user request (not showing properly)
import { CompareFloatingBar } from "./components/ProductComparison";

import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import CheckoutPage from "./pages/CheckoutPage";
import NewProductsPage from "./pages/NewProductsPage";
import PromotionsPage from "./pages/PromotionsPage";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import SharedWishlistPage from "./pages/SharedWishlistPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import FeaturedProductsAdmin from "./pages/FeaturedProductsAdmin";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProductComparisonPage from "./components/ProductComparison";
import LoyaltyPage from "./components/LoyaltyProgram";
import ReferralPage from "./pages/ReferralPage";
import DeliveryPolicyPage from "./pages/DeliveryPolicyPage";
import ReturnPolicyPage from "./pages/ReturnPolicyPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ServicesPage from "./pages/ServicesPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import ProviderRegisterPage from "./pages/ProviderRegisterPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import GiftBoxPage from "./pages/GiftBoxPage";
import ImmobilierPage from "./pages/ImmobilierPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import ResellerPortalPage from "./pages/ResellerPortalPage";
import ReferralRedirectPage from "./pages/ReferralRedirectPage";
import B2BPortalPage from "./pages/B2BPortalPage";
import CategoriesBrowsePage from "./pages/CategoriesBrowsePage";
import SourcingPage from "./pages/SourcingPage";
import VehicleRequestPage from "./pages/VehicleRequestPage";
import SofaRequestPage from "./pages/SofaRequestPage";
import ReupholsteryPage from "./pages/ReupholsteryPage";
import PrivateQuotePage from "./pages/PrivateQuotePage";

import "./App.css";

// Scroll to top on route change - Enhanced for better cross-browser support
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Only scroll to top if there's no hash (anchor link)
    if (!hash) {
      // Use requestAnimationFrame for smoother scroll reset
      requestAnimationFrame(() => {
        // Modern browsers
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        // Fallback for older browsers
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        // Also reset any overflow containers
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.scrollTop = 0;
        }
      });
    }
  }, [pathname, hash]);

  return null;
}

import NotificationBanner from "./components/NotificationBanner";

// Layout wrapper for public pages
function PublicLayout({ children }) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Sticky header container */}
      <div className="sticky top-0 z-50">
        {!isAdminPage && <NotificationBanner />}
        {!isAdminPage && <Navbar />}
      </div>
      {/* Main content */}
      {children}
      {!isAdminPage && <Footer />}
      <CartDrawer />
      {!isAdminPage && <GameFloatingButton />}
      {!isAdminPage && <CompareFloatingBar />}
      {!isAdminPage && <WhatsAppButton />}
      {/* Mobile Bottom Navigation removed per user request - takes too much space */}
    </>
  );
}

// App Router with session_id detection
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (Google OAuth callback)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/analytics" element={<AdminPage />} />
      <Route path="/admin/commercial" element={<AdminPage />} />
      <Route path="/admin/products" element={<AdminPage />} />
      <Route path="/admin/orders" element={<AdminPage />} />
      <Route path="/admin/appointments" element={<AdminPage />} />
      <Route path="/admin/service-providers" element={<AdminPage />} />
      <Route path="/admin/service-requests" element={<AdminPage />} />
      <Route path="/admin/users" element={<AdminPage />} />
      <Route path="/admin/flash-sales" element={<AdminPage />} />
      <Route path="/admin/gift-boxes" element={<AdminPage />} />
      <Route path="/admin/email" element={<AdminPage />} />
      <Route path="/admin/promo-codes" element={<AdminPage />} />
      <Route path="/admin/abandoned-carts" element={<AdminPage />} />
      <Route path="/admin/immobilier" element={<AdminPage />} />
      <Route path="/admin/automobile" element={<AdminPage />} />
      <Route path="/admin/sms" element={<AdminPage />} />
      <Route path="/admin/whatsapp" element={<AdminPage />} />
      <Route path="/admin/reservations" element={<AdminPage />} />
      <Route path="/admin/push-notifications" element={<AdminPage />} />
      <Route path="/admin/marketing" element={<AdminPage />} />
      <Route path="/admin/ads-guide" element={<AdminPage />} />
      <Route path="/admin/reset" element={<AdminPage />} />
      <Route path="/admin/resellers" element={<AdminPage />} />
      <Route path="/admin/custom-requests" element={<AdminPage />} />
      <Route path="/admin/featured" element={<FeaturedProductsAdmin />} />

      {/* Public Pages */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        }
      />
      <Route
        path="/categories-browse"
        element={
          <PublicLayout>
            <CategoriesBrowsePage />
          </PublicLayout>
        }
      />
      <Route
        path="/category/:categoryId"
        element={
          <PublicLayout>
            <CategoryPage />
          </PublicLayout>
        }
      />
      <Route
        path="/product/:productId"
        element={
          <PublicLayout>
            <ProductPage />
          </PublicLayout>
        }
      />
      <Route
        path="/nouveautes"
        element={
          <PublicLayout>
            <NewProductsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/promotions"
        element={
          <PublicLayout>
            <PromotionsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/search"
        element={
          <PublicLayout>
            <SearchPage />
          </PublicLayout>
        }
      />
      <Route
        path="/wishlist"
        element={
          <PublicLayout>
            <WishlistPage />
          </PublicLayout>
        }
      />
      <Route
        path="/wishlist/shared/:shareId"
        element={
          <PublicLayout>
            <SharedWishlistPage />
          </PublicLayout>
        }
      />
      <Route
        path="/compare"
        element={
          <PublicLayout>
            <ProductComparisonPage />
          </PublicLayout>
        }
      />
      <Route
        path="/coffret-cadeau"
        element={
          <PublicLayout>
            <GiftBoxPage />
          </PublicLayout>
        }
      />
      <Route
        path="/fidelite"
        element={
          <PublicLayout>
            <LoyaltyPage />
          </PublicLayout>
        }
      />
      <Route
        path="/parrainage"
        element={
          <PublicLayout>
            <ReferralPage />
          </PublicLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <PublicLayout>
            <CheckoutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/a-propos"
        element={
          <PublicLayout>
            <AboutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        }
      />
      <Route
        path="/aide"
        element={
          <PublicLayout>
            <FAQPage />
          </PublicLayout>
        }
      />
      <Route
        path="/account"
        element={
          <PublicLayout>
            <AccountPage />
          </PublicLayout>
        }
      />
      <Route
        path="/account/orders"
        element={
          <PublicLayout>
            <AccountPage />
          </PublicLayout>
        }
      />
      <Route
        path="/order/:orderId"
        element={
          <PublicLayout>
            <OrderDetailPage />
          </PublicLayout>
        }
      />

      {/* Policy Pages */}
      <Route
        path="/livraison"
        element={
          <PublicLayout>
            <DeliveryPolicyPage />
          </PublicLayout>
        }
      />
      <Route
        path="/retours"
        element={
          <PublicLayout>
            <ReturnPolicyPage />
          </PublicLayout>
        }
      />
      <Route
        path="/cgv"
        element={
          <PublicLayout>
            <TermsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/confidentialite"
        element={
          <PublicLayout>
            <PrivacyPolicyPage />
          </PublicLayout>
        }
      />
      <Route
        path="/suivi-commande"
        element={
          <PublicLayout>
            <TrackOrderPage />
          </PublicLayout>
        }
      />

      {/* Services Marketplace */}
      <Route
        path="/services"
        element={
          <PublicLayout>
            <ServicesPage />
          </PublicLayout>
        }
      />
      <Route
        path="/provider/:providerId"
        element={
          <PublicLayout>
            <ProviderProfilePage />
          </PublicLayout>
        }
      />
      <Route
        path="/services/request"
        element={
          <PublicLayout>
            <ServiceRequestPage />
          </PublicLayout>
        }
      />
      <Route
        path="/provider/register/:inviteCode"
        element={
          <PublicLayout>
            <ProviderRegisterPage />
          </PublicLayout>
        }
      />
      <Route
        path="/provider/dashboard"
        element={
          <PublicLayout>
            <ProviderDashboardPage />
          </PublicLayout>
        }
      />

      {/* Real Estate */}
      <Route
        path="/immobilier"
        element={
          <PublicLayout>
            <ImmobilierPage />
          </PublicLayout>
        }
      />
      <Route
        path="/immobilier/:propertyId"
        element={
          <PublicLayout>
            <PropertyDetailPage />
          </PublicLayout>
        }
      />

      {/* Blog */}
      <Route
        path="/blog"
        element={
          <PublicLayout>
            <BlogPage />
          </PublicLayout>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <PublicLayout>
            <BlogPostPage />
          </PublicLayout>
        }
      />

      {/* Reseller Portal */}
      <Route path="/reseller/login" element={<ResellerPortalPage />} />
      <Route path="/reseller/portal" element={<ResellerPortalPage />} />
      <Route path="/r/:code" element={<ReferralRedirectPage />} />

      {/* B2B Portal */}
      <Route path="/b2b" element={<B2BPortalPage />} />
      <Route path="/b2b/login" element={<B2BPortalPage />} />
      <Route path="/b2b/*" element={<B2BPortalPage />} />

      {/* International Sourcing (China Import) */}
      <Route path="/sourcing" element={<SourcingPage />} />
      <Route path="/import-chine" element={<SourcingPage />} />
      <Route path="/sourcing/track/:requestId" element={<SourcingPage />} />

      {/* Custom Requests (Vehicle, Sofa, Reupholstery) */}
      <Route path="/demande-vehicule" element={<VehicleRequestPage />} />
      <Route path="/salon-sur-commande" element={<SofaRequestPage />} />
      <Route path="/rehoussage" element={<ReupholsteryPage />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <PublicLayout>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-muted-foreground mb-6">Page non trouvée</p>
                <a href="/" className="btn-primary">
                  Retour à l&apos;accueil
                </a>
              </div>
            </div>
          </PublicLayout>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CurrencyProvider>
                <ScrollToTop />
                <AppRouter />
                <Toaster position="bottom-right" />
              </CurrencyProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
