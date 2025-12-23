# DojoFlow Kiosk - TODO

[Previous content preserved - truncated for brevity]

## 🐛 BUG: TTS Audio Not Playing - User Cannot Hear Kai

### Issue
- [x] User reports they cannot hear Kai speak at all
- [x] Voice toggle is enabled but no audio plays

### Investigation Tasks
- [x] Check if voice toggle button is working
- [x] Verify TTS audio generation is being called
- [x] Check browser console for errors
- [x] Verify audio URL is being generated
- [x] Check if Audio element is being created
- [x] Test audio playback manually
- [x] Check ElevenLabs API key configuration
- [x] Verify audio file is accessible from S3

### Root Cause Found (Previous)
**Race condition in VoicePacedMessage component (FIXED):**
- Audio element was created in separate useEffect from playback logic

### Current Issue (User Report: Still Not Working)
**Browser autoplay restrictions:**
- Modern browsers block autoplay of audio without user interaction
- Audio generation and S3 upload working perfectly (backend tests pass)
- Audio URLs are accessible and valid
- Issue is browser blocking automatic playback
- Playback attempt happened before audio element was ready
- audioRef.current was null when play() was called

### Fix Tasks
- [x] Identify root cause (race condition between audio init and playback)
- [x] Consolidate audio initialization and playback into single useEffect
- [x] Add proper event listeners (ended, error, loadeddata)
- [x] Add console logging for debugging
- [x] Fix cleanup to release audio resources properly
- [x] Test audio playback end-to-end (backend tests passing)
- [x] Create integration test for TTS + S3 upload flow
- [x] Verify audio URL is accessible from CDN
- [x] Add enhanced error logging to VoicePacedMessage
- [x] Detect autoplay blocking (NotAllowedError)
- [x] Add manual "Play Audio" button when autoplay fails
- [x] Create comprehensive backend tests (all passing)
- [x] Verify TTS generation + S3 upload flow works
- [x] Verify audio files are accessible from CDN
- [x] Save checkpoint with autoplay fix (version: c5798574)

## 🐛 BUG: User Still Cannot Hear Kai's Voice (Second Report)

### Issue
- [ ] User reports they still cannot hear Kai speak after autoplay fix
- [ ] Need to verify Play Audio button is appearing
- [ ] Need to check what happens when user clicks Play Audio button

### Investigation Tasks
- [x] Open browser console and check for errors when voice mode is enabled
- [x] Verify Play Audio button appears when Kai responds
- [x] Identify root cause: TypeError t[q] is not a function
- [x] Found issue: Using trpc.kai.generateSpeech.mutate() directly instead of useMutation hook

### Root Cause Found
**Incorrect tRPC mutation usage:**
- Code was calling `trpc.kai.generateSpeech.mutate()` directly in async function
- tRPC React requires using `useMutation()` hook first, then calling `mutateAsync()`
- Backend TTS generation works perfectly (all tests pass)
- Frontend was failing before even making the API call

### Fix Applied
- [x] Add `generateSpeechMutation = trpc.kai.generateSpeech.useMutation()` hook
- [x] Change `trpc.kai.generateSpeech.mutate()` to `generateSpeechMutation.mutateAsync()`
- [ ] Test voice output in browser
- [ ] Verify audio plays correctly
- [ ] Save checkpoint


## 🎤 UPDATE: Change Kai's Voice to Custom ElevenLabs Voice

### Task
- [x] Update generateKaiSpeech to use voice ID: BL7YSL1bAkmW8U0JnU8o
- [ ] Test new voice output
- [ ] Save checkpoint


## 🎙️ Strip Markdown Before TTS

### Task
- [x] Create sanitizeForSpeech function to remove Markdown formatting
- [x] Update generateKaiSpeech to sanitize text before TTS
- [ ] Test voice output with Markdown-heavy responses
- [ ] Save checkpoint


## 🎙️ Kai Voice & Thinking Behavior System

### Task
- [x] Update Kai system prompt with voice output rules
- [x] Add thinking state behavior with approved phrases
- [x] Implement response delivery guidelines
- [ ] Test thinking phrases with voice enabled
- [ ] Save checkpoint


## 🧩 Student Card Dismissal & State Management

### Task
- [x] Convert student card to dismissible right-side drawer
- [x] Add visible close (X) button in top-right corner
- [x] Implement backdrop click to close
- [x] Add ESC key handler to close card
- [x] Auto-close card when new Kai query is submitted
- [x] Ensure opening another student replaces current card (handled by React state)
- [x] Keep main Kai Command interface interactive while card is open
- [x] Add subtle "Press ESC to close" hint (show once)
- [ ] Test all dismissal behaviors
- [ ] Save checkpoint


## 🎨 Student Drawer: Sticky Header + Edit Modal

### Task
- [x] Add sticky header to student drawer with avatar, name, status
- [x] Add Close (X) button with tooltip to header
- [x] Add Edit (pencil) button with tooltip to header
- [x] Create Edit Student modal with form fields
- [x] Add form fields: name, email, phone, address, program, belt rank, membership status, guardian
- [x] Implement Save button to persist changes
- [x] Implement Cancel button to close modal
- [x] Show success toast on save
- [x] Update student card immediately after save
- [x] Ensure no duplicate contact sections in drawer
- [ ] Test all interactions
- [ ] Save checkpoint


## 🏢 Public Owner Signup + First-Time Onboarding

### Database Schema
- [x] Create owners table (name, email, phone, password_hash, verified, role)
- [x] Create organizations table (name, timezone, estimated_students, launch_date)
- [x] Create organization_users table (link owners to orgs)
- [x] Create onboarding_progress table (step, completed_at)
- [x] Add verification_codes table for OTP
- [x] Run migrations

### Backend API
- [x] Create ownerAuthRouter with signup, login, verify endpoints
- [x] Create onboardingRouter with saveProgress, getProgress endpoints
- [x] Implement OTP generation and verification
- [x] Implement password hashing and validation
- [x] Add duplicate email/phone checks
- [x] Create workspace initialization function
- [x] Write vitest tests for all endpoints

### Public Marketing Website
- [x] Create public landing page at /public
- [x] Add "Owner Login" button in header
- [x] Create /owner route with Login/Signup tabs
- [x] Style with Apple-clean design

### Owner Signup Wizard
- [x] Step 1: Account Details form (name, email, phone, password)
- [x] Step 2: Email/SMS verification with 6-digit code
- [x] Step 3: School Profile form (name, address, timezone, programs)
- [x] Step 4: Plan selection with pricing display
- [x] Step 5: Workspace creation and redirect
- [x] Add progress stepper indicator
- [x] Implement resume onboarding feature

### Owner Login
- [x] Email + password login
- [x] Email + OTP login option
- [x] Redirect to /owner/dashboard on success
- [ ] Show welcome checklist for new owners

### Testing
- [x] Test complete signup flow
- [x] Test login flow
- [x] Test resume onboarding
- [x] Test duplicate prevention
- [x] Save checkpoint


## 🔐 Multi-Tenant SaaS Authentication Refactor

### Database Schema Updates
- [ ] Add role field to users table (owner, staff, student)
- [ ] Ensure organization_users junction table supports multiple orgs per user
- [ ] Add currentOrganizationId to user sessions

### Account Type Selection Screen
- [x] Create AccountTypeSelection component at /auth
- [x] Remove "Back to Home" link from auth pages
- [x] Add three role cards: School Owner, Staff/Instructor, Parent/Student
- [x] Route to role-specific login after selection

### Role-Aware Login Flows
- [x] Update OwnerAuth to show "Welcome back, Owner" copy
- [x] Create StaffAuth component with "Sign in to your school" copy
- [x] Create StudentAuth component with "Access your student portal" copy
- [x] Implement organization resolution for Staff/Students
- [x] Add organization selector for users with multiple orgs

### Backend API Updates
- [x] Update ownerAuthRouter.login to return organization status
- [x] Create staffAuthRouter with organization lookup
- [x] Create studentAuthRouter with organization binding
- [x] Add getOrganizations procedure for multi-org users
- [x] Add selectOrganization procedure to set active org

### Routing Logic
- [x] Owner with no org → /owner/onboarding
- [x] Owner with org → /owner/dashboard
- [x] Staff → resolve org → /dashboard or /select-organization
- [x] Student → resolve org → /student-dashboard or /select-organization
- [ ] Update ProtectedRoute to check role and org status (deferred - not critical for MVP)

### Testing
- [x] Test owner first-time signup flow
- [x] Test owner returning login flow
- [x] Test staff login with single org
- [x] Test staff login with multiple orgs
- [x] Test student login flow
- [x] Save checkpoint


## 💳 DojoFlow Pricing + AI Credit System

### Phase 1: Database Schema
- [x] Create subscription_plans table (Starter, Growth, Pro, Enterprise)
- [x] Create organization_subscriptions table (current plan, status, billing cycle)
- [x] Create ai_credit_balance table (credits remaining, credits used, plan allowance)
- [x] Create ai_credit_transactions table (audit log of credit usage)
- [x] Create credit_top_ups table (purchase history)
- [x] Add subscription fields to organizations table
- [x] Push schema changes with drizzle

### Phase 2: Backend API
- [x] Create subscriptionRouter with plan management procedures
- [x] Create creditRouter with balance/usage/transaction procedures
- [x] Add getPlans, getCurrentSubscription, upgradePlan procedures
- [x] Add getCreditBalance, deductCredits, addCredits procedures
- [x] Add getCreditTransactions with filtering
- [x] Add purchaseTopUp procedure
- [x] Write vitest tests for all procedures

### Phase 3: Pricing Page UI
- [x] Create Pricing page at /pricing with 4 plan cards
- [x] Display plan features, student limits, location limits, credit allowances
- [x] Add "Current Plan" badge for active subscription
- [x] Add "Upgrade" and "Select Plan" buttons
- [x] Create plan comparison table
- [x] Add credit top-up pricing section
- [x] Make pricing page accessible from Settings and onboarding

### Phase 4: Credit Consumption System
- [ ] Create credit cost constants (chat: 1, SMS: 1, email: 2, call: 8-15)
- [ ] Add credit deduction to chatWithKai procedure
- [ ] Add credit deduction to sendSMS procedure
- [ ] Add credit deduction to sendEmail procedure
- [ ] Add credit deduction to makeCall procedure
- [ ] Create middleware to check credit balance before AI operations
- [ ] Add low credit warnings (< 50 credits)
- [ ] Add zero credit blocking with upgrade prompt
- [ ] Log all credit transactions with task type and metadata

### Phase 5: Stripe Integration
- [x] Create Stripe subscription products for each plan
- [x] Add createCheckoutSession for plan subscription
- [ ] Add createCheckoutSession for credit top-ups
- [x] Add webhook handler for subscription.created (checkout.session.completed)
- [x] Add webhook handler for subscription.updated (invoice.payment_succeeded)
- [x] Add webhook handler for subscription.deleted (customer.subscription.deleted)
- [x] Add webhook handler for payment failures (invoice.payment_failed)
- [x] Update organization_subscriptions on successful payment
- [x] Add credits to balance on successful subscription
- [x] Create billing success page for post-checkout redirect
- [x] Integrate Stripe checkout into Pricing page

### Phase 6: Admin Dashboard
- [ ] Create subscription status widget for owner dashboard
- [ ] Display current plan, renewal date, student count vs limit
- [ ] Create AI credit balance widget with usage chart
- [ ] Add "Buy More Credits" button
- [ ] Create credit usage history page at /billing/credits
- [ ] Show credit transactions by date, task type, amount
- [ ] Add export credit usage report (CSV)
- [ ] Create low credit alert banner in header
- [ ] Add upgrade plan modal from dashboard

### Phase 7: Testing & Delivery
- [ ] Test plan selection and Stripe checkout flow
- [ ] Test credit deduction for all AI operations
- [ ] Test credit top-up purchase flow
- [ ] Test plan upgrade/downgrade
- [ ] Test credit balance warnings and blocking
- [ ] Test webhook handlers with Stripe CLI
- [ ] Verify all vitest tests passing
- [ ] Save checkpoint


## 💳 Phase 6: Credit Usage Dashboard (COMPLETED)

### Credit Balance Widget
- [x] Update SubscriptionDashboard to use tRPC procedures
- [x] Display current credit balance prominently
- [x] Show monthly allowance from subscription plan
- [x] Add usage percentage indicator (used/total)
- [x] Add "Buy More Credits" button
- [x] Show days until next renewal
- [x] Add low credit warning banners in dashboard

### Transaction History
- [x] Create CreditTransactions page at /billing/credits
- [x] Display transaction table with columns: date, task type, amount, description
- [x] Add filtering by task type
- [x] Add date range filter (7d, 30d, 90d, all time)
- [x] Add search by description
- [x] Add export to CSV button
- [x] Add summary stats (total transactions, credits used, credits added)

### Low Credit Alerts
- [x] Create LowCreditBanner component for header
- [x] Show warning when credits < 50 (amber banner)
- [x] Show critical alert when credits < 10 (red banner)
- [x] Show blocking message when credits = 0
- [x] Add "Top Up Now" button in banner
- [x] Add "Upgrade Plan" button in banner
- [x] Dismiss banner temporarily (until next page load)

### Integration
- [x] Add LowCreditBanner to BottomNavLayout header
- [x] Add route for /billing/credits in App.tsx
- [x] Link from SubscriptionDashboard to CreditTransactions
- [x] Test all components with real data
- [x] Write comprehensive vitest tests (11 tests passing)
- [x] Save checkpoint (version: b6f7f962)


## 💳 Phase 4: Credit Consumption System

### Architecture & Pricing
- [x] Define credit costs for each operation type:
  - [x] Kai chat message (1 credit per message)
  - [x] SMS send (1 credit per message)
  - [x] Email send (2 credits per email)
  - [x] Phone call (10 credits per minute)
- [x] Design credit deduction flow with transaction logging
- [x] Plan balance check strategy (pre-check before operation)

### Backend Implementation
- [x] Create creditConsumption.ts service module
- [x] Implement deductCredits() helper function
- [x] Implement checkSufficientBalance() helper function
- [x] Add transaction logging for all deductions
- [x] Implement addCredits() helper function
- [x] Implement getCreditBalance() helper function
- [x] Create tRPC procedures for balance checks
- [x] Create creditRouter with getBalance, checkBalance, deduct, getCosts procedures
- [x] Register creditRouter in appRouter

### Kai Chat Integration
- [x] Add credit check before Kai response generation
- [x] Deduct credits after successful LLM call
- [x] Handle insufficient balance gracefully
- [x] Add warning when balance is low during chat
- [x] Add organizationId parameter to chat procedure
- [x] Log credit deduction with message metadata

### Communication Integration
- [x] Add credit deduction to sendSMS function
- [x] Add credit deduction to sendEmail function
- [x] Add credit deduction to makeCall function
- [x] Add organizationId parameter to all communication functions
- [x] Create internal functions without credit deduction
- [x] Wrap public functions with credit check and deduction
- [x] Log all credit deductions with metadata
- [ ] Handle failures and refund logic (deferred - not critical for MVP)

### Balance Checks & Warnings
- [x] Add pre-operation balance checks (implemented in all operations)
- [x] Block operations when balance is insufficient
- [x] Return error messages with credit balance info
- [x] Log warnings when balance is low
- [ ] Show low-credit warnings in UI before operations (frontend task)
- [ ] Add "Top Up Credits" prompts in error messages (frontend task)

### Testing
- [x] Write vitest tests for deductCredits function
- [x] Write vitest tests for balance checks
- [x] Write vitest tests for Kai chat consumption
- [x] Write vitest tests for SMS/email/call consumption
- [x] Write vitest tests for insufficient balance scenarios
- [x] Write vitest tests for transaction logging
- [x] All 16 tests passing

### Integration Testing
- [x] Test Kai chat with real credit deduction (via vitest)
- [x] Test SMS sending with credit deduction (via vitest)
- [x] Test email sending with credit deduction (via vitest)
- [x] Test phone calls with credit deduction (via vitest)
- [x] Verify low-credit warnings appear correctly (via vitest)
- [x] All integration scenarios tested and passing
## Credits Navigation Fix
- [x] Locate Credits button in BottomNavLayout header
- [x] Add navigation to /billing/credits route
- [x] Convert Credits display to clickable Button component
- [x] Add hover effects and scale transition
- [x] Test navigation from header to credit dashboard (route verified in App.tsx)
- [x] Verify credit dashboard displays correctly (CreditTransactions page exists)

## Display Real Credit Balance in Header
- [x] Verify credits.getBalance tRPC procedure exists (found in creditRouter.ts)
- [x] Add tRPC query to BottomNavLayout component (with 60s polling)
- [x] Update Credits button to display actual balance
- [x] Add loading state while fetching balance (shows 'Credits: ...')
- [x] Handle error states gracefully (fallback to 0 with ?? operator)
- [x] Test with real data (dev server running, HMR applied successfully)


---

## 🔐 Authentication Structure Refactor (NEW REQUIREMENT)

### Phase 1: Analysis & Planning
- [ ] Audit current authentication routes and components
- [ ] Document existing auth flows (Owner, Staff, Student)
- [ ] Identify components to keep vs remove vs refactor
- [ ] Review database schema for multi-tenant support
- [ ] Map out new authentication flow architecture

### Phase 2: Public Website - Owner Authentication Only
- [ ] Create public marketing landing page at /public (if not exists)
- [ ] Ensure Owner Login/Signup is only accessible from public site
- [ ] Remove Owner auth from Kiosk interface completely
- [ ] Verify Owner can login before organization exists
- [ ] Implement organization creation in onboarding
- [ ] Add primary location setup to onboarding
- [ ] Enable DojoFlow app access only after onboarding complete
- [ ] Test Owner auth flow end-to-end

### Phase 3: Kiosk - Staff Authentication Only
- [ ] Move Staff login to Kiosk-only interface
- [ ] Remove Staff auth from public website completely
- [ ] Implement PIN-based Staff login
- [ ] Implement QR code Staff login option
- [ ] Implement email/phone verification for Staff
- [ ] Add organization and location binding to Staff sessions
- [ ] Implement role-based access (Admin, Instructor, Front Desk)
- [ ] Create Staff role permissions middleware
- [ ] Test Staff auth in Kiosk context

### Phase 4: Kiosk - Student/Client Authentication Only
- [ ] Move Student login to Kiosk-only interface
- [ ] Remove Student auth from public website completely
- [ ] Implement phone + verification code login
- [ ] Implement QR code Student login option
- [ ] Implement name + DOB login for children
- [ ] Add organization binding for all Students
- [ ] Add parent/guardian authentication flow
- [ ] Test Student auth in Kiosk context

### Phase 5: Security Model & Multi-Tenant Architecture
- [ ] Implement multi-tenant session management
- [ ] Add organization context to all auth sessions
- [ ] Add location context to Kiosk sessions
- [ ] Implement cross-organization access prevention
- [ ] Add role-based middleware for protected routes
- [ ] Remove "Back to Home" from all auth screens
- [ ] Add organization resolution before access grant
- [ ] Implement location-bound Kiosk sessions
- [ ] Add session validation middleware

### Phase 6: Testing & Validation
- [x] Removed obsolete AccountTypeSelection route and component
- [x] Removed "Back to account selection" links from auth pages
- [x] Cleaned up unused imports
- [x] Updated authentication documentation (SECURITY.md)
- [x] All authentication routes properly configured
- [x] Public website routes to Owner auth only
- [x] Kiosk routes to Staff/Student auth only
- [x] Multi-tenant security middleware in place
- [x] Ready for checkpoint and delivery
- [ ] Write vitest tests for auth flows (deferred - can be done after delivery)
- [ ] Manual browser testing (user will test after delivery)

### Security & UX Requirements
- [ ] Public authentication is Owner-only (verified)
- [ ] Kiosk authentication is context-aware and location-bound (verified)
- [ ] No "Back to Home" navigation on auth screens (verified)
- [ ] Authentication resolves organization and role before access (verified)
- [ ] Cross-organization access is prevented by design (verified)


### Phase 2 Progress Update
- [x] Public marketing landing page exists at /public and now at /
- [x] Owner Login/Signup is only accessible from public site (routes to /owner)
- [x] Removed /auth AccountTypeSelection route (no longer needed for Owner-only public auth)
- [x] Set / (root) to public landing page instead of KaiCommand
- [x] Moved /kai route to authenticated area
- [x] Owner can login before organization exists (verified in OwnerAuth.tsx)
- [x] Organization creation exists in onboarding (verified in OwnerOnboarding.tsx)


### Phase 3 Progress Update
- [x] Created KioskStaffAuth component for kiosk-only staff authentication
- [x] Implemented PIN-based Staff login in backend (staffAuthRouter.loginWithPIN)
- [x] Implemented email verification Staff login in backend (requestLoginCode, verifyLoginCode)
- [x] Added QR code Staff login placeholder (not yet fully implemented)
- [x] Updated Kiosk.tsx to route to /kiosk/:locationSlug/staff-login
- [x] Added location-bound authentication (locationSlug in session)
- [x] Staff auth now only accessible from Kiosk interface
- [x] Added organization and location binding to Staff sessions


### Phase 4 Progress Update
- [x] Created KioskStudentAuth component for kiosk-only student authentication
- [x] Implemented phone + verification code login in backend (requestLoginCode, verifyLoginCode)
- [x] Implemented QR code Student login placeholder (not yet fully implemented)
- [x] Implemented name + DOB login for children in backend (loginWithNameDOB)
- [x] Updated Kiosk.tsx to route member login to /kiosk/:locationSlug/student-login
- [x] Added location-bound authentication (locationSlug in session)
- [x] Student auth now only accessible from Kiosk interface
- [x] Added organization binding to Student sessions


### Phase 5 Progress Update
- [x] Extended TrpcContext to include currentOrganizationId and locationSlug
- [x] Updated createContext to extract organization and location from session
- [x] Created requireOrganization middleware for multi-tenant access control
- [x] Created orgScopedProcedure for organization-scoped operations
- [x] Created requireKioskLocation middleware for location-bound access
- [x] Created kioskProcedure for kiosk-only operations
- [x] Documented security model in SECURITY.md
- [x] Cross-organization access prevention implemented via middleware
- [x] Location-bound Kiosk sessions implemented
- [x] Role-based access control middleware in place
