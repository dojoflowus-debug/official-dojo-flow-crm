import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ReleaseNotes from "./pages/ReleaseNotes";
import KaiCommandDashboard from "./pages/KaiCommandDashboard";
import CRMDashboard from "./pages/CRMDashboard";
import KaiDebugHarnessMock from "./pages/KaiDebugHarnessMock";
import StudentsNew from "./pages/StudentsNew";
import StudentsSplitScreen from "./pages/StudentsSplitScreen";
import StudentsCommandCenter from "./pages/StudentsCommandCenter";
import StudentsManagement from "./pages/StudentsManagement";
import StudentsDashboard from "./pages/StudentsDashboard";
import Students from "./pages/Students";
import StudentsElevated from "./pages/StudentsElevated";
import StudentCommandProfile from "./pages/StudentCommandProfile";
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
import CreditTransactions from "./pages/CreditTransactions";
import ProfileSettings from "./pages/ProfileSettings";
import OwnerProfile from "./pages/OwnerProfile";
import SetupWizard from "./pages/SetupWizard";
import { KaiSetupMode } from "./pages/KaiSetupMode";
import SettingsHub from "./pages/SettingsHub";
import VirtualReceptionist from "./pages/VirtualReceptionist";
import Themes from "./pages/Themes";
import ThemesTest from "./pages/ThemesTest";
import ThemesMinimal from "./pages/ThemesMinimal";
import SettingsTest from "./pages/SettingsTest";
import CommunicationSettings from "./pages/CommunicationSettings";
import { OwnerCommandCenter } from "./pages/OwnerCommandCenter";
import WebhookSettings from "./pages/WebhookSettings";
import KioskSettings from "./pages/KioskSettings";
import KioskStudio from "./pages/KioskStudio";
import KioskStudioBuilder2 from "./pages/KioskStudioBuilder2";
import KioskStudioSimplified from "./pages/KioskStudioSimplified";
import KioskStudioExact from "./pages/KioskStudioExact";
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
import { KioskDesigner } from "./pages/KioskDesigner";
import PublicHome from "./pages/PublicHome";
import PublicLanding from "./pages/PublicLanding";
import WelcomeDashboard from "./pages/WelcomeDashboard";
import OwnerAuth from "./pages/OwnerAuth";
import OwnerOnboarding from "./pages/OwnerOnboarding";
import StaffAuth from "./pages/StaffAuth";
import StudentAuthNew from "./pages/StudentAuthNew";
import KioskStaffAuth from "./pages/KioskStaffAuth";
import KioskStudentAuth from "./pages/KioskStudentAuth";
import SelectOrganization from "./pages/SelectOrganization";
import Pricing from "./pages/Pricing";
import KaiHeroOnboarding from "./pages/KaiHeroOnboarding";
import BillingSuccess from "./pages/BillingSuccess";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppShellGuard } from "./components/AppShellGuard";
import { DebugOverlay } from "./components/DebugOverlay";
import PlatformAdminLogin from "./pages/PlatformAdminLogin";
import OrganizationList from "./pages/OrganizationList";
import OrganizationDetail from "./pages/OrganizationDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import CookiePolicy from "./pages/CookiePolicy";
import DMCAPolicy from "./pages/DMCAPolicy";
import ForSchools from "./pages/ForSchools";
import ForFitness from "./pages/ForFitness";
import ForStudios from "./pages/ForStudios";
import MasterDashboard from "./pages/MasterDashboard";
import MasterSchools from "./pages/MasterSchools";
import MasterAnalytics from "./pages/MasterAnalytics";
import MasterAIUsage from "./pages/MasterAIUsage";
import MasterBilling from "./pages/MasterBilling";
import MasterSupport from "./pages/MasterSupport";
import MasterSettings from "./pages/MasterSettings";
import MasterSchoolDetail from "./pages/MasterSchoolDetail";
import KioskDashboard from "./pages/KioskDashboard";
import KioskManager from "./pages/KioskManager";
import { Onboarding } from "./pages/Onboarding";
import AppShell from "./components/AppShell";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLanding />} />
      <Route path="/public" element={<PublicLanding />} />
      <Route path="/public-old" element={<PublicHome />} />
      <Route path="/schools" element={<ForSchools />} />
      <Route path="/fitness" element={<ForFitness />} />
      <Route path="/studios" element={<ForStudios />} />
      <Route path="/owner" element={<OwnerAuth />} />
      <Route path="/owner/onboarding" element={<OwnerOnboarding />} />
      <Route path="/onboarding/setup" element={<OwnerOnboarding />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/owner/dashboard" element={<Navigate to="/kai" replace />} />
      <Route path="/dashboard/command-center" element={<OwnerCommandCenter />} />
      <Route path="/welcome" element={<WelcomeDashboard />} />
      <Route path="/staff/login" element={<StaffAuth />} />
      <Route path="/student-login" element={<StudentAuthNew />} />
      <Route path="/select-organization" element={<SelectOrganization />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/kai/release-notes/v0-9-0-beta" element={<ReleaseNotes />} />
      <Route path="/kai" element={<AppShell><KaiCommand /></AppShell>} />
      <Route path="/kai-command" element={<Navigate to="/kai" replace />} />
      <Route path="/command" element={<Navigate to="/kai" replace />} />
      <Route path="/kai-onboarding" element={<KaiHeroOnboarding />} />
      <Route path="/stats" element={<MinimalDashboard />} />
      {process.env.NODE_ENV !== 'production' && <Route path="/dev/kai-debug-mock" element={<KaiDebugHarnessMock />} />}
      <Route path="/checkin" element={<CheckIn />} />
      <Route path="/test-brand" element={<TestBrand />} />
      
      {/* Kiosk Routes - Specific routes BEFORE dynamic routes to avoid collisions */}
      {/* Kiosk Studio Builder - New Location/Kiosk Management - CANONICAL ENTRY POINT */}
      <Route path="/kiosk-studio" element={<AppShell><ProtectedRoute requireSetup={false}><KioskStudioExact /></ProtectedRoute></AppShell>} />
      <Route path="/kiosk-studio/:locationId" element={<AppShell><ProtectedRoute requireSetup={false}><KioskStudioExact /></ProtectedRoute></AppShell>} />
      {/* Redirect old /kiosk to /kiosk-studio */}
      <Route path="/kiosk" element={<Navigate to="/kiosk-studio" replace />} />
      <Route path="/kiosk-manager" element={<KioskManager />} />
      
      {/* Kiosk Runtime - Tablet Interface */}
      <Route path="/kiosk/:locationSlug" element={<Kiosk />} />
      <Route path="/kiosk/:locationSlug/staff-login" element={<KioskStaffAuth />} />
      <Route path="/kiosk/:locationSlug/member-login" element={<KioskMemberLogin />} />
      <Route path="/kiosk/:locationSlug/student-login" element={<KioskStudentAuth />} />
      <Route path="/kiosk/:locationSlug/checkin" element={<KioskCheckIn />} />
      <Route path="/kiosk/:locationSlug/new-student" element={<KioskNewStudent />} />
      <Route path="/enrollment" element={<EnrollmentStart />} />
      <Route path="/enrollment/form" element={<EnrollmentForm />} />
      <Route path="/enrollment/kai" element={<KaiEnrollment />} />
      <Route path="/new-visitor" element={<NewVisitor />} />
      <Route path="/waiver" element={<Waiver />} />
      <Route path="/payment" element={<Payment />} />
      {/* Master Dashboard (Internal DojoFlow Admin) */}
      <Route path="/master" element={<MasterDashboard />} />
      <Route path="/master/schools" element={<MasterSchools />} />
      <Route path="/master/schools/onboarding" element={<MasterSchools />} />
      <Route path="/master/schools/at-risk" element={<MasterSchools />} />
      <Route path="/master/schools/:id" element={<MasterSchoolDetail />} />
      <Route path="/master/analytics" element={<MasterAnalytics />} />
      <Route path="/master/ai-usage" element={<MasterAIUsage />} />
      <Route path="/master/billing" element={<MasterBilling />} />
      <Route path="/master/support" element={<MasterSupport />} />
      <Route path="/master/settings" element={<MasterSettings />} />
      
      {/* Platform Admin CRM (Internal DojoFlow) */}
      <Route path="/admin" element={<PlatformAdminLogin />} />
      <Route path="/admin/organizations" element={<OrganizationList />} />
      <Route path="/admin/organizations/:id" element={<OrganizationDetail />} />
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
      <Route path="/crm-dashboard" element={<CRMDashboard />} />

      <Route path="/simple-dashboard" element={<SimpleDashboard />} />
      <Route path="/students" element={<AppShell><StudentsElevated /></AppShell>} />
      <Route path="/students/:id" element={<StudentCommandProfile />} />
      <Route path="/students-classic" element={<Students />} />
      <Route path="/students-old" element={<StudentsDashboard />} />
      <Route path="/students-management" element={<StudentsManagement />} />
      <Route path="/students-command" element={<StudentsCommandCenter />} />
      <Route path="/students-split" element={<StudentsSplitScreen />} />
      <Route path="/student-portal" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />
      <Route path="/leads" element={<AppShell><Leads /></AppShell>} />
      <Route path="/test-data" element={<TestData />} />
      <Route path="/classes" element={<AppShell><Classes /></AppShell>} />
      <Route path="/floor-plans" element={<AppShell><FloorPlans /></AppShell>} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/staff" element={<AppShell><Staff /></AppShell>} />
      <Route path="/billing" element={<AppShell><Billing /></AppShell>} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/billing/success" element={<BillingSuccess />} />
      {/* Legal pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/dmca" element={<DMCAPolicy />} />
      <Route path="/billing/structure" element={<BillingStructure />} />
      <Route path="/billing/setup" element={<BillingSetup />} />
      <Route path="/billing/pcbancard-application" element={<PCBancardApplication />} />
      <Route path="/billing/stripe-setup" element={<StripeSetup />} />
      <Route path="/billing/applications" element={<BillingApplications />} />
      <Route path="/operations" element={<AppShell><Operations /></AppShell>} />
      <Route path="/operations/merchandise" element={<AppShell><Operations /></AppShell>} />
      <Route path="/operations/merchandise/manage" element={<AppShell><Operations /></AppShell>} />
      <Route path="/operations/merchandise/alert-settings" element={<AlertSettings />} />
      <Route path="/print-fulfillment-sheet" element={<PrintFulfillmentSheet />} />
      <Route path="/confirm-receipt/:token" element={<ConfirmReceipt />} />
      <Route path="/reports" element={<AppShell><Reports /></AppShell>} />
      <Route path="/marketing" element={<AppShell><Marketing /></AppShell>} />
      <Route path="/marketing-test" element={<MarketingTest />} />
      <Route path="/subscription" element={<SubscriptionDashboard />} />
      <Route path="/billing/credits" element={<CreditTransactions />} />
      <Route path="/themes" element={<Themes />} />
      <Route path="/preferences" element={<Themes />} />
      <Route path="/themes-test" element={<ThemesTest />} />
      <Route path="/themes-minimal" element={<ThemesMinimal />} />
      <Route path="/settings-test" element={<SettingsTest />} />
      <Route path="/settings/communication" element={<CommunicationSettings />} />
      <Route path="/settings/webhooks" element={<WebhookSettings />} />
      <Route path="/settings/kiosk" element={<KioskSettings />} />
      <Route path="/settings/kiosk/studio" element={<ProtectedRoute><KioskStudioBuilder2 /></ProtectedRoute>} />
      <Route path="/kiosk-studio-builder/:locationId" element={<ProtectedRoute><KioskStudioBuilder2 /></ProtectedRoute>} />
      <Route path="/settings/floor-plans" element={<FloorPlanBuilder />} />
      <Route path="/settings/profile" element={<ProfileSettings />} />
      <Route path="/settings/owner-profile" element={<OwnerProfile />} />
      <Route path="/campaigns" element={<Campaigns />} />
      <Route path="/campaigns/create" element={<CampaignCreate />} />
      <Route path="/campaigns/:id" element={<CampaignDetail />} />
      <Route path="/automation" element={<Automation />} />
      <Route path="/automation/create" element={<AutomationCreate />} />
      <Route path="/automation/:id" element={<AutomationBuilder />} />
      <Route path="/conversations" element={<Conversations />} />
      <Route path="/setup-wizard" element={<ProtectedRoute requireSetup={false}><SetupWizard /></ProtectedRoute>} />
      <Route path="/kai-setup" element={<ProtectedRoute><KaiSetupMode /></ProtectedRoute>} />
      <Route path="/setup" element={<SettingsHub />} />
      <Route path="/settings" element={<AppShell><SettingsHub /></AppShell>} />
      <Route path="/ai-setup" element={<AISetup />} />
      {/* KioskSetup removed */}
      <Route path="/security" element={<Security />} />
      <Route path="/test-simple" element={<TestSimple />} />
      <Route path="/receptionist" element={<VirtualReceptionist />} />
      <Route path="/test-page" element={<VirtualReceptionist />} />
      <Route path="/kiosk-designer" element={<ProtectedRoute><KioskDesigner /></ProtectedRoute>} />
      <Route path="/settings/kiosk/designer" element={<ProtectedRoute><KioskDesigner /></ProtectedRoute>} />
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
        defaultTheme="light"
        switchable
      >
        <EnvironmentProvider>
          <KioskProvider>
            <FocusModeProvider>
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                  <DebugOverlay />
                  <AppShellGuard>
                    <Router />
                  </AppShellGuard>
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
