import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSite } from './context/SiteContext';
import { useAuth } from './context/AuthContext';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import AccountPage from './pages/AccountPage';
import FavoritesPage from './pages/FavoritesPage';
import ReturnPage from './pages/ReturnPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AnnouncementPopup from './components/ui/AnnouncementPopup';
import AuthGuard from './components/AuthGuard';

function ScrollToTop() {
  return null;
}

function WhatsAppButton() {
  const { settings } = useSite();
  const wa = settings.whatsappFloating;

  // Eski ayara fallback (uyumluluk için)
  const phone = wa?.isActive ? wa.phone : (settings.contact?.whatsapp || settings.contact?.phone || '');
  const isActive = wa?.isActive || !!settings.contact?.whatsapp;

  if (!isActive || !phone) return null;

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  const message = wa?.message || 'Merhaba, bilgi almak istiyorum.';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  const positionClass = wa?.position === 'left' ? 'left-6' : 'right-6';

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 ${positionClass} z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5C] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group`}
      title="WhatsApp ile mesaj gönder"
      id="whatsapp-float-btn"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-current">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.96A15.89 15.89 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.32 22.608c-.39 1.098-1.928 2.01-3.16 2.276-.844.178-1.946.32-5.658-1.218-4.752-1.966-7.808-6.79-8.044-7.104-.226-.314-1.904-2.536-1.904-4.838s1.204-3.43 1.632-3.898c.428-.468.936-.586 1.248-.586.312 0 .624.002.898.016.288.014.674-.11 1.054.804.39.936 1.328 3.238 1.446 3.472.118.234.196.508.038.82-.156.314-.234.51-.468.784-.234.274-.492.612-.702.822-.234.234-.478.488-.204.958.274.468 1.218 2.01 2.614 3.258 1.794 1.604 3.306 2.1 3.774 2.334.468.234.742.196 1.016-.118.274-.314 1.172-1.368 1.484-1.836.312-.468.624-.39 1.054-.234.43.156 2.73 1.288 3.198 1.522.468.234.78.352.898.546.118.194.118 1.132-.272 2.23z" />
      </svg>
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 group-hover:opacity-0" />
    </a>
  );
}

function GoogleSEO() {
  const { settings } = useSite();
  const consoleId = settings.seo?.googleConsoleId;

  useEffect(() => {
    if (settings.siteName) document.title = settings.siteName;

    // Favicon güncelleme (Madde 15/17)
    const faviconUrl = settings.favicon || '/favicon.ico';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }, [settings.siteName, settings.favicon]);

  useEffect(() => {
    if (consoleId) {
      let meta = document.querySelector('meta[name="google-site-verification"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = "google-site-verification";
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
      meta.content = consoleId;
    }
  }, [consoleId]);

  return null;
}

function LiveChat() {
  const { settings } = useSite();
  const script = settings?.seo?.liveChatScript;
  if (!script) return null;

  const scriptContent = script.replace(/<\/?script>/g, '');
  return (
    <div
      id="live-chat-init"
      dangerouslySetInnerHTML={{ __html: `<script>${scriptContent}</script>` }}
    />
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  const { settings, loading: settingsLoading } = useSite();
  const { customer } = useAuth();
  const googleClientId = settings.seo?.googleClientId;

  // Settings yüklenene kadar sayfa render edilmez (flash of default content önlenir)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!settingsLoading) setReady(true);
  }, [settingsLoading]);

  // Apply theme colors from admin panel as CSS variables
  useEffect(() => {
    const c = settings.colors || {};
    const root = document.documentElement;
    if (c.primary)   root.style.setProperty('--primary-color', c.primary);
    if (c.secondary) root.style.setProperty('--secondary-color', c.secondary);
    if (c.accent)    root.style.setProperty('--accent-color', c.accent);
    if (c.bodyBg)    root.style.setProperty('--surface-color', c.bodyBg);
    if (c.headerBg)  root.style.setProperty('--header-bg', c.headerBg);
    if (c.footerBg)  root.style.setProperty('--footer-bg', c.footerBg);
  }, [settings.colors]);

  // Kayıtsız kullanıcı kontrolü (Madde 20)
  const isLoggedIn = !!customer;
  const allowedRoutes = ['/', '/product', '/category', '/search', '/login', '/forgot-password', '/reset-password'];

  const currentPath = window.location.pathname;
  const isAllowed = allowedRoutes.some(route => currentPath.startsWith(route));

  if (!isLoggedIn && !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-primary mb-3">Giriş Gerekli</h1>
          <p className="text-sm text-muted mb-6">Bu sayfaya erişmek için lütfen giriş yapın veya hesap oluşturun.</p>
          <div className="space-y-3">
            <a href="/login" className="block w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-secondary transition-colors">
              Giriş Yap
            </a>
            <a href="/login" className="block w-full py-3 bg-surface-alt text-primary font-semibold rounded-xl hover:bg-surface transition-colors">
              Kayıt Ol
            </a>
          </div>
        </div>
      </div>
    );
  }

  const AppContent = (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={
            <AuthGuard requireAuth={true}>
              <CheckoutPage />
            </AuthGuard>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={
            <AuthGuard requireAuth={true}>
              <AccountPage />
            </AuthGuard>
          } />
          <Route path="/favorites" element={
            <AuthGuard requireAuth={true}>
              <FavoritesPage />
            </AuthGuard>
          } />
          <Route path="/tracking" element={<OrderTrackingPage />} />
          <Route path="/return-exchange" element={
            <AuthGuard requireAuth={true}>
              <ReturnPage />
            </AuthGuard>
          } />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
      <AnnouncementPopup />
      <GoogleSEO />
      <LiveChat />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#000000',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
    </div>
  );

  return (
    <Router>
      <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.15s ease' }}>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {AppContent}
          </GoogleOAuthProvider>
        ) : AppContent}
      </div>
    </Router>
  );
}
