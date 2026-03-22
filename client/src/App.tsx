import { Suspense, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import './App.css';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FocusModeProvider } from "./contexts/FocusModeContext";
import { EnvironmentProvider } from "./contexts/EnvironmentContext";
import { KioskProvider } from "./contexts/KioskContext";
import { AppShellGuard } from "./components/AppShellGuard";
import { DebugOverlay } from "./components/DebugOverlay";
import { CreditsRefreshOnReturn } from "./components/CreditsRefreshOnReturn";
import { BillingReturnHandler } from "./components/BillingReturnHandler";
import { ModalProvider } from "./contexts/ModalContext";
import { appRoutes } from "./routes/appRoutes";
import { IndustryEnvironmentInitializer } from "./components/IndustryEnvironmentInitializer";
import { CookieNotice } from "./components/CookieNotice";
import { SplashLoader } from "./components/SplashLoader";
import { trpc } from "@/lib/trpc";

// Public routes where auth errors are expected and should not be logged
const PUBLIC_ROUTES = [
  '/',
  '/public', '/public-old', '/schools', '/fitness', '/studios', '/kai-onboarding', '/welcome',
  '/owner', '/staff/login', '/student-login', '/login', '/forgot-password', '/reset-password', '/select-organization',
  '/onboarding', '/owner/onboarding', '/onboarding/setup',
  '/kiosk', '/kiosk-home', '/kiosk-live', '/checkin',
  '/lead-capture', '/lead-capture-location', '/locations',
  '/student', '/enrollment', '/waiver', '/payment', '/new-visitor', '/events', '/shop', '/referral', '/feedback',
];

// ─── Splash-aware root component ─────────────────────────────────────────────
// Sits inside the tRPC provider so it can call trpc.auth.me directly.
function AppWithSplashInner() {
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.some(
    r => location.pathname === r || location.pathname.startsWith(r + '/')
  );
  // Use the auth.me query to determine when the app is truly ready.
  // We set staleTime to 0 so it always fires on first mount.
  const { isLoading: authLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Suppress error reporting on public/login pages where UNAUTHORIZED is expected
    meta: { suppressError: isPublicRoute },
  });

  // Give the splash a minimum display time of 800 ms so it never flashes.
  const [minTimePassed, setMinTimePassed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 800);
    return () => clearTimeout(t);
  }, []);

  const appReady = !authLoading && minTimePassed;

  return (
    <>
      <SplashLoader ready={appReady} />
      <div id="app-shell">
        <IndustryEnvironmentInitializer />
        <DebugOverlay />
        <CreditsRefreshOnReturn />
        <BillingReturnHandler />
        <AppShellGuard>
          <Suspense fallback={null}>
            <Routes>
              {appRoutes.map((route, index) => (
                <Route key={route.path || index} path={route.path} element={route.element} />
              ))}
            </Routes>
          </Suspense>
        </AppShellGuard>
        <CookieNotice />
      </div>
    </>
  );
}

function AppWithSplash() {
  return (
    <BrowserRouter>
      <AppWithSplashInner />
    </BrowserRouter>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  console.log('DojoFlow - App component rendering');
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <EnvironmentProvider>
          <KioskProvider>
            <FocusModeProvider>
              <ModalProvider>
                <TooltipProvider>
                  <Toaster />
                  <AppWithSplash />
                </TooltipProvider>
              </ModalProvider>
            </FocusModeProvider>
          </KioskProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
