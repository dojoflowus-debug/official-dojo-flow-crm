import { lazy, ComponentType } from "react";
import { Navigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";

// Lazy-load all page components
const Home = lazy(() => import("../pages/Home"));
const CheckIn = lazy(() => import("../pages/CheckIn"));
const Kiosk = lazy(() => import("../pages/Kiosk"));
const TestBrand = lazy(() => import("../pages/TestBrand"));
const KioskCheckIn = lazy(() => import("../pages/KioskCheckIn"));
const KioskNewStudent = lazy(() => import("../pages/KioskNewStudent"));
const KioskMemberLogin = lazy(() => import("../pages/KioskMemberLogin"));
const EnrollmentStart = lazy(() => import("../pages/EnrollmentStart"));
const EnrollmentForm = lazy(() => import("../pages/EnrollmentForm"));
const KaiEnrollment = lazy(() => import("../pages/KaiEnrollment"));
const NewVisitor = lazy(() => import("../pages/NewVisitor"));
const Waiver = lazy(() => import("../pages/Waiver"));
const Payment = lazy(() => import("../pages/Payment"));
const Admin = lazy(() => import("../pages/Admin"));
const Events = lazy(() => import("../pages/Events"));
const Shop = lazy(() => import("../pages/Shop"));
const Referral = lazy(() => import("../pages/Referral"));
const Feedback = lazy(() => import("../pages/Feedback"));
const StudentLogin = lazy(() => import("../pages/StudentLogin"));
const StudentDashboard = lazy(() => import("../pages/StudentDashboard"));
const StudentSchedule = lazy(() => import("../pages/StudentSchedule"));
const StudentBeltTests = lazy(() => import("../pages/StudentBeltTests"));
const StudentPayments = lazy(() => import("../pages/StudentPayments"));
const StudentMessages = lazy(() => import("../pages/StudentMessages"));
const StudentProfile = lazy(() => import("../pages/StudentProfile"));
const StudentSettings = lazy(() => import("../pages/StudentSettings"));
const StudentForgotPassword = lazy(() => import("../pages/StudentForgotPassword"));
const StudentResetPassword = lazy(() => import("../pages/StudentResetPassword"));
const StudentRegister = lazy(() => import("../pages/StudentRegister"));
const KaiDashboard = lazy(() => import("../pages/KaiDashboard"));
const KaiCommand = lazy(() => import("../pages/KaiCommand"));
const ReleaseNotes = lazy(() => import("../pages/ReleaseNotes"));
const KaiCommandDashboard = lazy(() => import("../pages/KaiCommandDashboard"));
const CRMDashboard = lazy(() => import("../pages/CRMDashboard"));
const KaiDebugHarnessMock = lazy(() => import("../pages/KaiDebugHarnessMock"));
const StudentsNew = lazy(() => import("../pages/StudentsNew"));
const StudentsSplitScreen = lazy(() => import("../pages/StudentsSplitScreen"));
const StudentsCommandCenter = lazy(() => import("../pages/StudentsCommandCenter"));
const StudentsManagement = lazy(() => import("../pages/StudentsManagement"));
const StudentsDashboard = lazy(() => import("../pages/StudentsDashboard"));
const Students = lazy(() => import("../pages/Students"));
const StudentsElevated = lazy(() => import("../pages/StudentsElevated"));
const StudentCommandProfile = lazy(() => import("../pages/StudentCommandProfile"));
const StudentPortal = lazy(() => import("../pages/StudentPortal"));
const Leads = lazy(() => import("../pages/Leads"));
const TestData = lazy(() => import("../pages/TestData"));
const SimpleDashboard = lazy(() => import("../pages/SimpleDashboard"));
const DataDashboard = lazy(() => import("../pages/DataDashboard"));
const MinimalDashboard = lazy(() => import("../pages/MinimalDashboard"));
const Classes = lazy(() => import("../pages/Classes"));
const Programs = lazy(() => import("../pages/Programs"));
const Staff = lazy(() => import("../pages/Staff"));
const Billing = lazy(() => import("../pages/Billing"));
const BillingStructure = lazy(() => import("../pages/BillingStructure"));
const PCBancardApplication = lazy(() => import("../pages/PCBancardApplication"));
const StripeSetup = lazy(() => import("../pages/StripeSetup"));
const BillingApplications = lazy(() => import("../pages/BillingApplications"));
const Reports = lazy(() => import("../pages/Reports"));
const Marketing = lazy(() => import("../pages/MarketingUnified"));
const MarketingTest = lazy(() => import("../pages/MarketingTest"));
const SubscriptionDashboard = lazy(() => import("../pages/SubscriptionDashboard"));
const CreditTransactions = lazy(() => import("../pages/CreditTransactions"));
const ProfileSettings = lazy(() => import("../pages/ProfileSettings"));
const OwnerProfile = lazy(() => import("../pages/OwnerProfile"));
const SetupWizard = lazy(() => import("../pages/SetupWizard"));
const KaiSetupMode = lazy(() => import("../pages/KaiSetupMode").then(m => ({ default: m.KaiSetupMode })));
const VirtualReceptionist = lazy(() => import("../pages/VirtualReceptionist"));
const Themes = lazy(() => import("../pages/Themes"));
const ThemesTest = lazy(() => import("../pages/ThemesTest"));
const ThemesMinimal = lazy(() => import("../pages/ThemesMinimal"));
const SettingsTest = lazy(() => import("../pages/SettingsTest"));
const CommunicationSettings = lazy(() => import("../pages/CommunicationSettings"));
const OwnerCommandCenter = lazy(() => import("../pages/OwnerCommandCenter").then(m => ({ default: m.OwnerCommandCenter })));
const WebhookSettings = lazy(() => import("../pages/WebhookSettings"));
const KioskSettings = lazy(() => import("../pages/KioskSettings"));

const KioskStudio = lazy(() => import("../pages/KioskStudio"));
const KioskStudioBuilder2 = lazy(() => import("../pages/KioskStudioBuilder2"));
const KioskStudioSimplified = lazy(() => import("../pages/KioskStudioSimplified"));
const KioskStudioExact = lazy(() => import("../pages/KioskStudioExact"));
const KioskHome = lazy(() => import("../pages/KioskHome"));
const KioskLive = lazy(() => import("../pages/KioskLive").then(m => ({ default: m.KioskLive })));
const LeadCapture = lazy(() => import("../pages/LeadCapture").then(m => ({ default: m.LeadCapture })));
const LeadCaptureLocation = lazy(() => import("../pages/LeadCaptureLocation"));
const Campaigns = lazy(() => import("../pages/Campaigns"));
const CampaignCreate = lazy(() => import("../pages/CampaignCreate"));
const CampaignDetail = lazy(() => import("../pages/CampaignDetail"));
const Automation = lazy(() => import("../pages/Automation"));
const AutomationCreate = lazy(() => import("../pages/AutomationCreate"));
const AutomationBuilder = lazy(() => import("../pages/AutomationBuilder"));
const Conversations = lazy(() => import("../pages/Conversations"));
const FloorPlanBuilder = lazy(() => import("../pages/FloorPlanBuilder"));
const FloorPlans = lazy(() => import("../pages/FloorPlans"));
const FloorPlansCinematic = lazy(() => import("../pages/FloorPlansCinematic"));
const Operations = lazy(() => import("../pages/Operations"));
const PrintFulfillmentSheet = lazy(() => import("../pages/PrintFulfillmentSheet"));
const ConfirmReceipt = lazy(() => import("../pages/ConfirmReceipt"));
const AlertSettings = lazy(() => import("../pages/AlertSettings"));
const AISetup = lazy(() => import("../pages/AISetup"));
const Security = lazy(() => import("../pages/Security"));
const TestSimple = lazy(() => import("../pages/TestSimple"));
const PublicChat = lazy(() => import("../pages/PublicChat"));
const KioskDesigner = lazy(() => import("../pages/KioskDesigner").then(m => ({ default: m.KioskDesigner })));
const PublicHome = lazy(() => import("../pages/PublicHome"));
const PublicLanding = lazy(() => import("../pages/PublicLanding"));
const WelcomeDashboard = lazy(() => import("../pages/WelcomeDashboard"));
const OwnerAuth = lazy(() => import("../pages/OwnerAuth"));
const OwnerOnboarding = lazy(() => import("../pages/OwnerOnboarding"));
const StaffAuth = lazy(() => import("../pages/StaffAuth"));
const StudentAuthNew = lazy(() => import("../pages/StudentAuthNew"));
const KioskStaffAuth = lazy(() => import("../pages/KioskStaffAuth"));
const KioskStudentAuth = lazy(() => import("../pages/KioskStudentAuth"));
const SelectOrganization = lazy(() => import("../pages/SelectOrganization"));
const Pricing = lazy(() => import("../pages/Pricing"));
const KaiHeroOnboarding = lazy(() => import("../pages/KaiHeroOnboarding"));
const BillingSuccess = lazy(() => import("../pages/BillingSuccess"));
const Login = lazy(() => import("../pages/Login"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const PlatformAdminLogin = lazy(() => import("../pages/PlatformAdminLogin"));
const OrganizationList = lazy(() => import("../pages/OrganizationList"));
const OrganizationDetail = lazy(() => import("../pages/OrganizationDetail"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("../pages/TermsOfUse"));
const CookiePolicy = lazy(() => import("../pages/CookiePolicy"));
const DMCAPolicy = lazy(() => import("../pages/DMCAPolicy"));
const ForSchools = lazy(() => import("../pages/ForSchools"));
const ForFitness = lazy(() => import("../pages/ForFitness"));
const ForStudios = lazy(() => import("../pages/ForStudios"));
const MasterDashboard = lazy(() => import("../pages/MasterDashboard"));
const MasterSchools = lazy(() => import("../pages/MasterSchools"));
const MasterAnalytics = lazy(() => import("../pages/MasterAnalytics"));
const MasterAIUsage = lazy(() => import("../pages/MasterAIUsage"));
const MasterBilling = lazy(() => import("../pages/MasterBilling"));
const MasterSupport = lazy(() => import("../pages/MasterSupport"));
const MasterSettings = lazy(() => import("../pages/MasterSettings"));
const MasterSchoolDetail = lazy(() => import("../pages/MasterSchoolDetail"));
const KioskDashboard = lazy(() => import("../pages/KioskDashboard"));
const KioskManager = lazy(() => import("../pages/KioskManager"));
const Onboarding = lazy(() => import("../pages/Onboarding").then(m => ({ default: m.Onboarding })));
const TestSettingsModal = lazy(() => import("../pages/TestSettingsModal"));
const NotFound = lazy(() => import("../pages/NotFound"));

export interface RouteConfig {
  path: string;
  element: JSX.Element;
  label?: string;
}

export const appRoutes: RouteConfig[] = [
  // Public routes
  { path: "/", element: <PublicLanding />, label: "Landing" },
  { path: "/public", element: <PublicLanding />, label: "Public Landing" },
  { path: "/public-old", element: <PublicHome />, label: "Public Home (Old)" },
  { path: "/schools", element: <ForSchools />, label: "For Schools" },
  { path: "/fitness", element: <ForFitness />, label: "For Fitness" },
  { path: "/studios", element: <ForStudios />, label: "For Studios" },
  { path: "/owner", element: <OwnerAuth />, label: "Owner Auth" },
  { path: "/owner/onboarding", element: <OwnerOnboarding />, label: "Owner Onboarding" },
  { path: "/onboarding/setup", element: <OwnerOnboarding />, label: "Onboarding Setup" },
  { path: "/onboarding", element: <Onboarding />, label: "Onboarding" },
  { path: "/owner/dashboard", element: <Navigate to="/kai" replace />, label: "Owner Dashboard Redirect" },
  { path: "/dashboard/command-center", element: <OwnerCommandCenter />, label: "Command Center" },
  { path: "/welcome", element: <WelcomeDashboard />, label: "Welcome" },
  { path: "/staff/login", element: <StaffAuth />, label: "Staff Login" },
  { path: "/student-login", element: <StudentAuthNew />, label: "Student Login" },
  { path: "/select-organization", element: <SelectOrganization />, label: "Select Organization" },
  { path: "/login", element: <Login />, label: "Login" },
  { path: "/forgot-password", element: <ForgotPassword />, label: "Forgot Password" },
  { path: "/reset-password", element: <ResetPassword />, label: "Reset Password" },
  { path: "/kai/release-notes/v0-9-0-beta", element: <AppShell><ReleaseNotes /></AppShell>, label: "Release Notes" },
  { path: "/test-settings", element: <TestSettingsModal />, label: "Test Settings Modal" },
  { path: "/kai", element: <AppShell><KaiCommand /></AppShell>, label: "Kai Command" },
  { path: "/kai-command", element: <Navigate to="/kai" replace />, label: "Kai Command Redirect" },
  { path: "/command", element: <Navigate to="/kai" replace />, label: "Command Redirect" },
  { path: "/kai-onboarding", element: <KaiHeroOnboarding />, label: "Kai Onboarding" },
  { path: "/stats", element: <MinimalDashboard />, label: "Stats" },
  ...(process.env.NODE_ENV !== 'production' ? [{ path: "/dev/kai-debug-mock", element: <KaiDebugHarnessMock />, label: "Kai Debug Mock" }] : []),
  { path: "/checkin", element: <CheckIn />, label: "Check In" },
  { path: "/test-brand", element: <TestBrand />, label: "Test Brand" },
  
  // Kiosk Routes
  { path: "/lead-capture", element: <LeadCapture />, label: "Lead Capture" },
  { path: "/lead-capture-location", element: <LeadCaptureLocation />, label: "Lead Capture Location" },
  { path: "/locations/:slug/chat", element: <LeadCaptureLocation />, label: "Location Chat" },
  { path: "/kiosk-home", element: <KioskHome />, label: "Kiosk Home" },
  { path: "/kiosk-studio", element: <AppShell><ProtectedRoute requireSetup={false}><KioskStudioExact /></ProtectedRoute></AppShell>, label: "Kiosk Studio" },
  { path: "/kiosk-studio/:locationId", element: <AppShell><ProtectedRoute requireSetup={false}><KioskStudioExact /></ProtectedRoute></AppShell>, label: "Kiosk Studio Location" },
  { path: "/kiosk", element: <Navigate to="/kiosk-home" replace />, label: "Kiosk Redirect" },
  { path: "/kiosk-manager", element: <KioskManager />, label: "Kiosk Manager" },
  { path: "/kiosk/live/:locationId", element: <KioskLive />, label: "Kiosk Live" },
  { path: "/kiosk/:locationSlug", element: <Kiosk />, label: "Kiosk" },
  { path: "/kiosk/:locationSlug/staff-login", element: <KioskStaffAuth />, label: "Kiosk Staff Login" },
  { path: "/kiosk/:locationSlug/member-login", element: <KioskMemberLogin />, label: "Kiosk Member Login" },
  { path: "/kiosk/:locationSlug/student-login", element: <KioskStudentAuth />, label: "Kiosk Student Login" },
  { path: "/kiosk/:locationSlug/checkin", element: <KioskCheckIn />, label: "Kiosk Check In" },
  { path: "/kiosk/:locationSlug/new-student", element: <KioskNewStudent />, label: "Kiosk New Student" },
  { path: "/enrollment", element: <EnrollmentStart />, label: "Enrollment Start" },
  { path: "/enrollment/form", element: <EnrollmentForm />, label: "Enrollment Form" },
  { path: "/enrollment/kai", element: <KaiEnrollment />, label: "Kai Enrollment" },
  { path: "/new-visitor", element: <NewVisitor />, label: "New Visitor" },
  { path: "/waiver", element: <Waiver />, label: "Waiver" },
  { path: "/payment", element: <Payment />, label: "Payment" },
  
  // Master Dashboard (Internal DojoFlow Admin)
  { path: "/master", element: <MasterDashboard />, label: "Master Dashboard" },
  { path: "/master/schools", element: <MasterSchools />, label: "Master Schools" },
  { path: "/master/schools/onboarding", element: <MasterSchools />, label: "Master Schools Onboarding" },
  { path: "/master/schools/at-risk", element: <MasterSchools />, label: "Master Schools At Risk" },
  { path: "/master/schools/:id", element: <MasterSchoolDetail />, label: "Master School Detail" },
  { path: "/master/analytics", element: <MasterAnalytics />, label: "Master Analytics" },
  { path: "/master/ai-usage", element: <MasterAIUsage />, label: "Master AI Usage" },
  { path: "/master/billing", element: <MasterBilling />, label: "Master Billing" },
  { path: "/master/support", element: <MasterSupport />, label: "Master Support" },
  { path: "/master/settings", element: <MasterSettings />, label: "Master Settings" },
  
  // Platform Admin CRM
  { path: "/admin", element: <PlatformAdminLogin />, label: "Platform Admin Login" },
  { path: "/admin/organizations", element: <OrganizationList />, label: "Organizations" },
  { path: "/admin/organizations/:id", element: <OrganizationDetail />, label: "Organization Detail" },
  { path: "/events", element: <Events />, label: "Events" },
  { path: "/shop", element: <Shop />, label: "Shop" },
  { path: "/referral", element: <Referral />, label: "Referral" },
  { path: "/feedback", element: <Feedback />, label: "Feedback" },
  { path: "/student-login", element: <StudentLogin />, label: "Student Login (Old)" },
  { path: "/student-register", element: <StudentRegister />, label: "Student Register" },
  { path: "/student-forgot-password", element: <StudentForgotPassword />, label: "Student Forgot Password" },
  { path: "/student-reset-password", element: <StudentResetPassword />, label: "Student Reset Password" },
  { path: "/student-dashboard", element: <StudentDashboard />, label: "Student Dashboard" },
  { path: "/student-schedule", element: <StudentSchedule />, label: "Student Schedule" },
  { path: "/student-belt-tests", element: <StudentBeltTests />, label: "Student Belt Tests" },
  { path: "/chat", element: <PublicChat />, label: "Public Chat" },
  { path: "/student-payments", element: <StudentPayments />, label: "Student Payments" },
  { path: "/student-messages", element: <StudentMessages />, label: "Student Messages" },
  { path: "/student-profile", element: <StudentProfile />, label: "Student Profile" },
  { path: "/student-settings", element: <StudentSettings />, label: "Student Settings" },
  { path: "/crm-dashboard", element: <CRMDashboard />, label: "CRM Dashboard" },
  { path: "/simple-dashboard", element: <SimpleDashboard />, label: "Simple Dashboard" },
  { path: "/students", element: <AppShell><StudentsElevated /></AppShell>, label: "Students" },
  { path: "/students/:id", element: <AppShell><StudentCommandProfile /></AppShell>, label: "Student Profile" },
  { path: "/students-classic", element: <Students />, label: "Students Classic" },
  { path: "/students-old", element: <StudentsDashboard />, label: "Students Old" },
  { path: "/students-management", element: <StudentsManagement />, label: "Students Management" },
  { path: "/students-command", element: <StudentsCommandCenter />, label: "Students Command" },
  { path: "/students-split", element: <StudentsSplitScreen />, label: "Students Split" },
  { path: "/student-portal", element: <ProtectedRoute><StudentPortal /></ProtectedRoute>, label: "Student Portal" },
  { path: "/leads", element: <AppShell><Leads /></AppShell>, label: "Leads" },
  { path: "/test-data", element: <TestData />, label: "Test Data" },
  { path: "/classes", element: <AppShell><Classes /></AppShell>, label: "Classes" },
  { path: "/floor-plans", element: <AppShell><FloorPlansCinematic /></AppShell>, label: "Floor Plans" },
  { path: "/floor-plans-old", element: <AppShell><FloorPlans /></AppShell>, label: "Floor Plans Old" },
  { path: "/programs", element: <AppShell><Programs /></AppShell>, label: "Programs" },
  { path: "/staff", element: <AppShell><Staff /></AppShell>, label: "Staff" },
  { path: "/billing", element: <AppShell><Billing /></AppShell>, label: "Billing" },
  { path: "/pricing", element: <Pricing />, label: "Pricing" },
  { path: "/billing/success", element: <BillingSuccess />, label: "Billing Success" },
  
  // Legal pages
  { path: "/privacy", element: <PrivacyPolicy />, label: "Privacy Policy" },
  { path: "/terms", element: <TermsOfUse />, label: "Terms of Use" },
  { path: "/cookies", element: <CookiePolicy />, label: "Cookie Policy" },
  { path: "/dmca", element: <DMCAPolicy />, label: "DMCA Policy" },
  
  { path: "/billing/structure", element: <BillingStructure />, label: "Billing Structure" },
  { path: "/billing/pcbancard-application", element: <PCBancardApplication />, label: "PCBancard Application" },
  { path: "/billing/stripe-setup", element: <StripeSetup />, label: "Stripe Setup" },
  { path: "/billing/applications", element: <BillingApplications />, label: "Billing Applications" },
  { path: "/operations", element: <AppShell><Operations /></AppShell>, label: "Operations" },
  { path: "/operations/merchandise", element: <AppShell><Operations /></AppShell>, label: "Operations Merchandise" },
  { path: "/operations/merchandise/manage", element: <AppShell><Operations /></AppShell>, label: "Operations Merchandise Manage" },
  { path: "/operations/merchandise/alert-settings", element: <AlertSettings />, label: "Alert Settings" },
  { path: "/print-fulfillment-sheet", element: <PrintFulfillmentSheet />, label: "Print Fulfillment Sheet" },
  { path: "/confirm-receipt/:token", element: <ConfirmReceipt />, label: "Confirm Receipt" },
  { path: "/reports", element: <AppShell><Reports /></AppShell>, label: "Reports" },
  { path: "/marketing", element: <AppShell><Marketing /></AppShell>, label: "Marketing" },
  { path: "/marketing-test", element: <MarketingTest />, label: "Marketing Test" },
  { path: "/subscription", element: <SubscriptionDashboard />, label: "Subscription" },
  { path: "/billing/credits", element: <AppShell><ProtectedRoute><CreditTransactions /></ProtectedRoute></AppShell>, label: "Credit Transactions" },
  { path: "/themes", element: <Themes />, label: "Themes" },
  { path: "/preferences", element: <Themes />, label: "Preferences" },
  { path: "/themes-test", element: <ThemesTest />, label: "Themes Test" },
  { path: "/themes-minimal", element: <ThemesMinimal />, label: "Themes Minimal" },
  { path: "/settings-test", element: <SettingsTest />, label: "Settings Test" },
  { path: "/settings/communication", element: <CommunicationSettings />, label: "Communication Settings" },
  { path: "/settings/webhooks", element: <WebhookSettings />, label: "Webhook Settings" },
  { path: "/settings/kiosk", element: <KioskSettings />, label: "Kiosk Settings" },
  { path: "/settings/kiosk/studio", element: <ProtectedRoute><KioskStudioBuilder2 /></ProtectedRoute>, label: "Kiosk Studio" },
  { path: "/kiosk-studio-builder/:locationId", element: <ProtectedRoute><KioskStudioBuilder2 /></ProtectedRoute>, label: "Kiosk Studio Builder" },
  { path: "/settings/floor-plans", element: <FloorPlanBuilder />, label: "Floor Plan Builder" },
  { path: "/settings/profile", element: <ProfileSettings />, label: "Profile Settings" },
  { path: "/settings/owner-profile", element: <OwnerProfile />, label: "Owner Profile" },

  { path: "/campaigns", element: <Campaigns />, label: "Campaigns" },
  { path: "/campaigns/create", element: <CampaignCreate />, label: "Create Campaign" },
  { path: "/campaigns/:id", element: <CampaignDetail />, label: "Campaign Detail" },
  { path: "/automation", element: <Automation />, label: "Automation" },
  { path: "/automation/create", element: <AutomationCreate />, label: "Create Automation" },
  { path: "/automation/:id", element: <AutomationBuilder />, label: "Automation Builder" },
  { path: "/conversations", element: <Conversations />, label: "Conversations" },
  { path: "/setup-wizard", element: <ProtectedRoute requireSetup={false}><SetupWizard /></ProtectedRoute>, label: "Setup Wizard" },
  { path: "/kai-setup", element: <ProtectedRoute><KaiSetupMode /></ProtectedRoute>, label: "Kai Setup" },
  { path: "/ai-setup", element: <AISetup />, label: "AI Setup" },
  { path: "/security", element: <Security />, label: "Security" },
  { path: "/test-simple", element: <TestSimple />, label: "Test Simple" },
  { path: "/receptionist", element: <VirtualReceptionist />, label: "Virtual Receptionist" },
  { path: "/test-page", element: <VirtualReceptionist />, label: "Test Page" },
  { path: "/kiosk-designer", element: <ProtectedRoute><KioskDesigner /></ProtectedRoute>, label: "Kiosk Designer" },
  { path: "/settings/kiosk/designer", element: <ProtectedRoute><KioskDesigner /></ProtectedRoute>, label: "Kiosk Designer Settings" },
  { path: "/404", element: <NotFound />, label: "Not Found" },
  { path: "*", element: <NotFound />, label: "Fallback Not Found" },
];
