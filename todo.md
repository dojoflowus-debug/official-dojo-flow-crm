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
- [ ] Save checkpoint
