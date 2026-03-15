import { Suspense } from "react";
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
import { DevVerificationHooks } from "./components/DevVerificationHooks";
import { CreditsRefreshOnReturn } from "./components/CreditsRefreshOnReturn";
import { BillingReturnHandler } from "./components/BillingReturnHandler";
import { ModalProvider } from "./contexts/ModalContext";
import { appRoutes } from "./routes/appRoutes";
import { IndustryEnvironmentInitializer } from "./components/IndustryEnvironmentInitializer";
import { CookieNotice } from "./components/CookieNotice";

// Full-page loader component for Suspense fallback
function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          {appRoutes.map((route, index) => (
            <Route key={route.path || index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Suspense>
    </ErrorBoundary>
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
                  <BrowserRouter>
                    <IndustryEnvironmentInitializer />
                    <DebugOverlay />
                    <CreditsRefreshOnReturn />
                    <BillingReturnHandler />
                    <AppShellGuard>
                      <Router />
                    </AppShellGuard>
                    <CookieNotice />
                  </BrowserRouter>
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
