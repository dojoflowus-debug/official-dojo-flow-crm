import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FocusModeProvider } from "./contexts/FocusModeContext";
import { EnvironmentProvider } from "./contexts/EnvironmentContext";
import Home from "./pages/Home";
import CheckIn from "./pages/CheckIn";
import NewVisitor from "./pages/NewVisitor";
import Waiver from "./pages/Waiver";
import Payment from "./pages/Payment";
import Admin from "./pages/Admin";
import Events from "./pages/Events";
import Shop from "./pages/Shop";
import Referral from "./pages/Referral";
import Feedback from "./pages/Feedback";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import StudentSchedule from "./pages/StudentSchedule";
import StudentBeltTests from "./pages/StudentBeltTests";
import StudentPayments from "./pages/StudentPayments";
import StudentMessages from "./pages/StudentMessages";
import StudentProfile from "./pages/StudentProfile";
import StudentSettings from "./pages/StudentSettings";
import KaiDashboard from "./pages/KaiDashboard";
import KaiCommand from "./pages/KaiCommand";
import CRMDashboard from "./pages/CRMDashboard";
import StudentsNew from "./pages/StudentsNew";
import StudentsSplitScreen from "./pages/StudentsSplitScreen";
import StudentPortal from "./pages/StudentPortal";
import Leads from "./pages/Leads";
import TestData from "./pages/TestData";
import SimpleDashboard from "./pages/SimpleDashboard";
import DataDashboard from "./pages/DataDashboard";
import MinimalDashboard from "./pages/MinimalDashboard";
// Kiosk removed - Kai Command is the central focus
import Classes from "./pages/Classes";
import Staff from "./pages/Staff";
import Billing from "./pages/Billing";
import BillingSetup from "./pages/BillingSetup";
import PCBancardApplication from "./pages/PCBancardApplication";
import StripeSetup from "./pages/StripeSetup";
import BillingApplications from "./pages/BillingApplications";
import Reports from "./pages/Reports";
import Marketing from "./pages/MarketingUnified";
import MarketingTest from "./pages/MarketingTest";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import SetupWizard from "./pages/SetupWizard";
import VirtualReceptionist from "./pages/VirtualReceptionist";
import Themes from "./pages/Themes";
import ThemesTest from "./pages/ThemesTest";
import ThemesMinimal from "./pages/ThemesMinimal";
import SettingsTest from "./pages/SettingsTest";
import CommunicationSettings from "./pages/CommunicationSettings";
import WebhookSettings from "./pages/WebhookSettings";
import Campaigns from "./pages/Campaigns";
import CampaignCreate from "./pages/CampaignCreate";
import CampaignDetail from "./pages/CampaignDetail";
import Automation from "./pages/Automation";
import AutomationCreate from "./pages/AutomationCreate";
import AutomationBuilder from "./pages/AutomationBuilder";
import Conversations from "./pages/Conversations";
import AISetup from "./pages/AISetup";
// KioskSetup removed
import Security from "./pages/Security";
import TestSimple from "./pages/TestSimple";
import PublicChat from "./pages/PublicChat";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<KaiCommand />} />
      <Route path="/stats" element={<MinimalDashboard />} />
      <Route path="/checkin" element={<CheckIn />} />
      <Route path="/new-visitor" element={<NewVisitor />} />
      <Route path="/waiver" element={<Waiver />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/events" element={<Events />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/referral" element={<Referral />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-schedule" element={<StudentSchedule />} />
      <Route path="/student-belt-tests" element={<StudentBeltTests />} />
      <Route path="/chat" element={<PublicChat />} />
      <Route path="/student-payments" element={<StudentPayments />} />
      <Route path="/student-messages" element={<StudentMessages />} />
      <Route path="/student-profile" element={<StudentProfile />} />
      <Route path="/student-settings" element={<StudentSettings />} />
      <Route path="/kai-dashboard" element={<KaiDashboard />} />
      <Route path="/kai" element={<KaiDashboard />} />
      <Route path="/kai-command" element={<KaiCommand />} />
      <Route path="/crm-dashboard" element={<CRMDashboard />} />
      <Route path="/dashboard" element={<ProtectedRoute><MinimalDashboard /></ProtectedRoute>} />
      <Route path="/simple-dashboard" element={<SimpleDashboard />} />
      <Route path="/students" element={<StudentsSplitScreen />} />
      <Route path="/students-old" element={<StudentsNew />} />
      <Route path="/student-portal" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/test-data" element={<TestData />} />
      {/* Kiosk removed - Kai Command is the central focus */}
      <Route path="/classes" element={<Classes />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/billing/setup" element={<BillingSetup />} />
      <Route path="/billing/pcbancard-application" element={<PCBancardApplication />} />
      <Route path="/billing/stripe-setup" element={<StripeSetup />} />
      <Route path="/billing/applications" element={<BillingApplications />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/marketing" element={<Marketing />} />
      <Route path="/marketing-test" element={<MarketingTest />} />
      <Route path="/subscription" element={<SubscriptionDashboard />} />
      <Route path="/themes" element={<Themes />} />
      <Route path="/preferences" element={<Themes />} />
      <Route path="/themes-test" element={<ThemesTest />} />
      <Route path="/themes-minimal" element={<ThemesMinimal />} />
      <Route path="/settings-test" element={<SettingsTest />} />
      <Route path="/settings/communication" element={<CommunicationSettings />} />
      <Route path="/settings/webhooks" element={<WebhookSettings />} />
      <Route path="/campaigns" element={<Campaigns />} />
      <Route path="/campaigns/create" element={<CampaignCreate />} />
      <Route path="/campaigns/:id" element={<CampaignDetail />} />
      <Route path="/automation" element={<Automation />} />
      <Route path="/automation/create" element={<AutomationCreate />} />
      <Route path="/automation/:id" element={<AutomationBuilder />} />
      <Route path="/conversations" element={<Conversations />} />
      <Route path="/setup-wizard" element={<ProtectedRoute requireSetup={false}><SetupWizard /></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute requireSetup={false}><SetupWizard /></ProtectedRoute>} />
      <Route path="/ai-setup" element={<AISetup />} />
      {/* KioskSetup removed */}
      <Route path="/security" element={<Security />} />
      <Route path="/test-simple" element={<TestSimple />} />
      <Route path="/receptionist" element={<VirtualReceptionist />} />
      <Route path="/test-page" element={<VirtualReceptionist />} />
      <Route path="/404" element={<NotFound />} />
      {/* Final fallback route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
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
        defaultTheme="dark"
        switchable
      >
        <EnvironmentProvider>
          <FocusModeProvider>
            <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Router />
            </BrowserRouter>
          </TooltipProvider>
          </FocusModeProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
