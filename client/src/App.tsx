import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FocusModeProvider } from "./contexts/FocusModeContext";
import { EnvironmentProvider } from "./contexts/EnvironmentContext";
import { KioskProvider } from "./contexts/KioskContext";
import Home from "./pages/Home";
import CheckIn from "./pages/CheckIn";
import Kiosk from "./pages/Kiosk";
import TestBrand from "./pages/TestBrand";
import KioskCheckIn from "./pages/KioskCheckIn";
import KioskNewStudent from "./pages/KioskNewStudent";
import KioskMemberLogin from "./pages/KioskMemberLogin";
import EnrollmentStart from "./pages/EnrollmentStart";
import EnrollmentForm from "./pages/EnrollmentForm";
import KaiEnrollment from "./pages/KaiEnrollment";
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
import StudentForgotPassword from "./pages/StudentForgotPassword";
import StudentResetPassword from "./pages/StudentResetPassword";
import StudentRegister from "./pages/StudentRegister";
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
import Programs from "./pages/Programs";
import Staff from "./pages/Staff";
import Billing from "./pages/Billing";
import BillingStructure from "./pages/BillingStructure";
import BillingSetup from "./pages/BillingSetup";
import PCBancardApplication from "./pages/PCBancardApplication";
import StripeSetup from "./pages/StripeSetup";
import BillingApplications from "./pages/BillingApplications";
import Reports from "./pages/Reports";
import Marketing from "./pages/MarketingUnified";
import MarketingTest from "./pages/MarketingTest";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import SetupWizard from "./pages/SetupWizard";
import SettingsHub from "./pages/SettingsHub";
import VirtualReceptionist from "./pages/VirtualReceptionist";
import Themes from "./pages/Themes";
import ThemesTest from "./pages/ThemesTest";
import ThemesMinimal from "./pages/ThemesMinimal";
import SettingsTest from "./pages/SettingsTest";
import CommunicationSettings from "./pages/CommunicationSettings";
import WebhookSettings from "./pages/WebhookSettings";
import KioskSettings from "./pages/KioskSettings";
import Campaigns from "./pages/Campaigns";
import CampaignCreate from "./pages/CampaignCreate";
import CampaignDetail from "./pages/CampaignDetail";
import Automation from "./pages/Automation";
import AutomationCreate from "./pages/AutomationCreate";
import AutomationBuilder from "./pages/AutomationBuilder";
import Conversations from "./pages/Conversations";
import FloorPlanBuilder from "./pages/FloorPlanBuilder";
import FloorPlans from "./pages/FloorPlans";
import Operations from "./pages/Operations";
import PrintFulfillmentSheet from "./pages/PrintFulfillmentSheet";
import ConfirmReceipt from "./pages/ConfirmReceipt";
import AlertSettings from "./pages/AlertSettings";
import AISetup from "./pages/AISetup";
// KioskSetup removed
import Security from "./pages/Security";
import TestSimple from "./pages/TestSimple";
import PublicChat from "./pages/PublicChat";
import PublicHome from "./pages/PublicHome";
import OwnerAuth from "./pages/OwnerAuth";
import OwnerOnboarding from "./pages/OwnerOnboarding";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/public" element={<PublicHome />} />
      <Route path="/owner" element={<OwnerAuth />} />
      <Route path="/owner/onboarding" element={<OwnerOnboarding />} />
      <Route path="/owner/dashboard" element={<MinimalDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<KaiCommand />} />
      <Route path="/stats" element={<MinimalDashboard />} />
      <Route path="/checkin" element={<CheckIn />} />
      <Route path="/kiosk/:locationSlug" element={<Kiosk />} />
      <Route path="/test-brand" element={<TestBrand />} />
      <Route path="/kiosk/checkin" element={<KioskCheckIn />} />
      <Route path="/kiosk/member-login" element={<KioskMemberLogin />} />
      <Route path="/kiosk/new-student" element={<KioskNewStudent />} />
      <Route path="/enrollment" element={<EnrollmentStart />} />
      <Route path="/enrollment/form" element={<EnrollmentForm />} />
      <Route path="/enrollment/kai" element={<KaiEnrollment />} />
      <Route path="/new-visitor" element={<NewVisitor />} />
      <Route path="/waiver" element={<Waiver />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/events" element={<Events />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/referral" element={<Referral />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/student-register" element={<StudentRegister />} />
      <Route path="/student-forgot-password" element={<StudentForgotPassword />} />
      <Route path="/student-reset-password" element={<StudentResetPassword />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-schedule" element={<StudentSchedule />} />
      <Route path="/student-belt-tests" element={<StudentBeltTests />} />
      <Route path="/chat" element={<PublicChat />} />
      <Route path="/student-payments" element={<StudentPayments />} />
      <Route path="/student-messages" element={<StudentMessages />} />
      <Route path="/student-profile" element={<StudentProfile />} />
      <Route path="/student-settings" element={<StudentSettings />} />
      <Route path="/kai-dashboard" element={<KaiDashboard />} />
      <Route path="/kai" element={<KaiCommand />} />
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
      <Route path="/floor-plans" element={<FloorPlans />} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/billing/structure" element={<BillingStructure />} />
      <Route path="/billing/setup" element={<BillingSetup />} />
      <Route path="/billing/pcbancard-application" element={<PCBancardApplication />} />
      <Route path="/billing/stripe-setup" element={<StripeSetup />} />
      <Route path="/billing/applications" element={<BillingApplications />} />
      <Route path="/operations" element={<Operations />} />
      <Route path="/operations/merchandise" element={<Operations />} />
      <Route path="/operations/merchandise/manage" element={<Operations />} />
      <Route path="/operations/merchandise/alert-settings" element={<AlertSettings />} />
      <Route path="/print-fulfillment-sheet" element={<PrintFulfillmentSheet />} />
      <Route path="/confirm-receipt/:token" element={<ConfirmReceipt />} />
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
      <Route path="/settings/kiosk" element={<KioskSettings />} />
      <Route path="/settings/floor-plans" element={<FloorPlanBuilder />} />
      <Route path="/campaigns" element={<Campaigns />} />
      <Route path="/campaigns/create" element={<CampaignCreate />} />
      <Route path="/campaigns/:id" element={<CampaignDetail />} />
      <Route path="/automation" element={<Automation />} />
      <Route path="/automation/create" element={<AutomationCreate />} />
      <Route path="/automation/:id" element={<AutomationBuilder />} />
      <Route path="/conversations" element={<Conversations />} />
      <Route path="/setup-wizard" element={<ProtectedRoute requireSetup={false}><SetupWizard /></ProtectedRoute>} />
      <Route path="/setup" element={<SettingsHub />} />
      <Route path="/settings" element={<SettingsHub />} />
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
          <KioskProvider>
            <FocusModeProvider>
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                  <Router />
                </BrowserRouter>
              </TooltipProvider>
            </FocusModeProvider>
          </KioskProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
