# DojoFlow Kiosk - TODO

[Previous content preserved - truncating for brevity...]

## Merchandise Visual Photos & View Toggle
- [x] Add imageUrl field to merchandise_items table schema
- [x] Extract product images from Century Martial Arts website
- [x] Update existing merchandise items with product photos (placeholder images added)
- [x] Create card view component with product images
- [x] Add list/card view toggle button in Manage Items header
- [x] Implement view state management (list vs card)
- [x] Test both views display correctly
- [x] Save checkpoint (version: 9b8c7b2a)

## Image Upload Feature for Create Item Dialog
- [x] Add image upload UI component to Create Item dialog
- [x] Implement file selection and preview
- [x] Add S3 upload functionality for merchandise images  
- [x] Update createItem mutation to accept imageUrl
- [x] Install multer dependency for file uploads
- [x] Create upload router with S3 integration
- [x] Test Create Item dialog displays image upload UI
- [x] Save checkpoint (version: e87f3c20)

## Extract Real Product Images from Century Martial Arts
- [x] Browse Century Martial Arts uniform catalog
- [x] Extract product image URLs
- [x] Download high-quality product images
- [x] Upload images to S3 storage
- [x] Update merchandise items with real product photos
- [x] Verify images display correctly in card view
- [x] Save checkpoint (version: 91d13afb)

## Theme-Aware Logo Rendering
- [x] Update dojo_settings schema to support logo_dark_url and logo_light_url
- [x] Push database schema changes
- [x] Find and update logo component to be theme-aware
- [x] Implement logo switching logic (light mode → dark logo, dark mode → light logo)
- [x] Add fallback to DojoFlow default logos when custom logos missing
- [x] Ensure logo updates immediately on theme toggle
- [x] Test logo contrast in light mode
- [x] Test logo contrast in dark mode
- [x] Test logo on Kai Command page
- [x] Test logo on all pages with header
- [x] Save checkpoint (version: 597f4083)

## Update Light Mode Logo with User-Provided Dark Text Version
- [x] Copy Darkdojoflow.png to /client/public/logo-light.png
- [x] Update useThemeAwareLogo hook to use local logo files
- [x] Verify logo displays in light mode with dark text
- [x] Verify logo switches correctly when toggling themes
- [x] Test logo on Kai Command page
- [x] Test logo on Students page
- [x] Save checkpoint with updated logo

## Fix Logo Display Issue in Light Mode
- [x] Investigate why logo shows only red swirl icon instead of full DojoFlow logo
- [x] Check which component is rendering the logo in BottomNavLayout
- [x] Verify logo file path and image source
- [x] Logo works correctly in dev environment
- [ ] Investigate why logo not reflecting on published site after publish
- [ ] Check if logo file is being deployed correctly
- [ ] Implement cache-busting solution if needed
- [ ] Verify logo displays on published site
- [ ] Save checkpoint with fix

## Add Bottom Navigation to Reports Page
- [x] Check current Reports page layout
- [x] Reports page already has BottomNavLayout
- [x] Bottom navigation working on Reports page

## Add Bottom Navigation to Settings Page
- [x] Check Settings page layout
- [x] Add BottomNavLayout wrapper to Settings page
- [x] Test navigation on Settings page
- [x] Save checkpoint

## Add /settings Route Alias
- [x] Add redirect route from /settings to /setup in App.tsx
- [x] Test both /settings and /setup URLs work
- [x] Save checkpoint

## Update Bottom Navigation Settings Link
- [x] Find Settings link in BottomNavLayout component
- [x] Change route from /setup to /settings
- [x] Fix Focus Mode button overlap with Settings button
- [x] Test Settings navigation from bottom menu
- [x] Save checkpoint

## Restore Cinematic Mode to Kai Command
- [x] Investigate why Cinematic mode disappeared from theme toggle
- [x] Check for route-specific theme restrictions in BottomNavLayout
- [x] Check ThemeContext and ThemeProvider implementation
- [x] Restore Cinematic option to theme toggle on all pages
- [x] Verify theme persistence in localStorage
- [x] Test Cinematic mode on Kai Command page
- [x] Test Cinematic mode on other pages (Students, Leads, Classes, etc.)
- [x] Ensure theme selection persists after refresh and navigation
- [x] Save checkpoint

## Fix Kai Conversation Logic - Solo vs Group
- [x] Investigate current Kai response logic in backend
- [x] Check kai_conversations table schema for participant tracking
- [x] Find where @kai mention requirement is enforced (line 1541 in KaiCommand.tsx)
- [x] Implement participant counting logic (solo vs group)
- [x] Update Kai response logic: auto-respond in solo, require @kai in group
- [x] Test solo conversation (1 human + Kai) - Kai should respond automatically
- [ ] Test group conversation (2+ humans + Kai) - Kai should require @kai mention
- [x] Verify behavior in Focus Mode
- [x] Verify behavior in standard Kai Command mode
- [x] Save checkpoint

## Kai Command Data Integration (Student/Lead Cards)

### Backend API Tools
- [x] Implement search_students procedure with location/permission filtering
- [x] Implement get_student procedure with full card payload
- [x] Implement list_at_risk_students procedure
- [x] Implement list_late_payments procedure
- [x] Implement search_leads procedure
- [x] Implement get_lead procedure
- [x] Add vitest tests for all API procedures

### Structured UI Blocks
- [x] Design UI block response format (student_card, student_list, lead_list, chip)
- [x] Create student_card_payload shape matching existing Student Card UI
- [x] Create lead_card_payload shape
- [x] Implement UI block parser in frontend

### Results Panel Component
- [x] Create ResultsPanel component (right-side drawer)
- [x] Add student card rendering in Results Panel
- [x] Add student list rendering in Results Panel
- [x] Add lead list rendering in Results Panel
- [x] Add close/minimize functionality
- [x] Ensure panel doesn't lose chat context when closed

### Kai Message Rendering Integration
- [x] Update message renderer to detect UI blocks
- [x] Render clickable chips for student/lead references
- [x] Wire chip clicks to open Results Panel
- [x] Add summary text in chat with "View Details" action
- [x] Ensure PII is limited in chat, full details only in panel

### Testing & Polish
- [x] Test "Show me who is late on payments" query (via vitest)
- [x] Test "Find students at risk" query (via vitest)
- [x] Test "Show me John Smith's card" query (via vitest)
- [x] Test permission filtering (role-based access)
- [x] Test location context filtering
- [x] Save checkpoint

## 🐛 FIX: Kai Cannot Find Students or Pull Cards

### Diagnosis
- [x] Check if Kai's system prompt includes instructions for using kaiData API
- [x] Verify kaiData router is registered in appRouter
- [x] Test kaiData.searchStudents endpoint directly via tRPC
- [x] Check if Kai has access to tool/function calling for data queries
- [x] Verify students exist in database

### Fix Implementation
- [x] Update Kai system prompt with data query instructions
- [x] Add tool definitions for student/lead search functions
- [x] Configure LLM to use function calling for data queries
- [x] Update formatFunctionResults to format responses with UI block markers

### Verification
- [x] Test "Show me all students" query - LLM responds conversationally, no function call
- [x] Test "Find Emma" query - LLM starts response but doesn't complete/call function
- [ ] Debug why LLM is not calling functions
- [ ] Check server logs for function call errors
- [ ] Test with tool_choice: 'required' to force function calls
- [ ] Verify UI blocks render correctly
- [ ] Verify Results Panel opens with student cards
- [ ] Save checkpoint

### Current Issue
**LLM is not calling the search functions** - it's responding conversationally instead of using the tools we defined. Need to investigate:
1. Are function calls being attempted but failing?
2. Is the system prompt clear enough about when to use tools?
3. Should we use `tool_choice: 'required'` instead of `'auto'`?

## 🐛 FIX: Conversation List Not Displaying Older Conversations
- [x] Add "Older" section to conversation list (currently only shows Today/Yesterday)
- [x] Add olderConversations filter for conversations older than yesterday
- [x] Render "Older" section in sidebar after Yesterday section
- [x] Test that all conversations display correctly regardless of age
- [x] Save checkpoint (version: d2a79fa7)

## 🎯 IMPLEMENT: Active/Archived Tabs for Conversation List
- [x] Analyze current tab implementation in KaiCommand.tsx
- [x] Check if archivedAt column exists in kai_conversations table (added to schema)
- [x] Add archivedAt column to database via SQL migration
- [x] Add archive/unarchive mutation to backend (updated to use archivedAt)
- [x] Implement tab state management (activeTab: 'active' | 'archived' | 'all')
- [x] Filter conversations based on selected tab
- [x] Add archive/unarchive action to conversation dropdown menu (already exists)
- [x] Test tab switching functionality
- [x] Verify archived conversations don't show in Active tab
- [x] Test archive action removes conversation from Active tab
- [x] Test archived conversation appears in Archived tab
- [x] Test All tab shows both active and archived conversations
- [x] Test Restore action moves conversation back to Active tab
- [x] Save checkpoint (version: f2df8abf)

## Navigation Badge System (Actionable Notifications)

### Backend API
- [x] Create navBadgesRouter with getActionableCounts procedure
- [x] Implement Students count logic (late payments + missing waiver + at-risk + failed autopay)
- [x] Implement Leads count logic (new/uncontacted/overdue follow-ups)
- [x] Implement Billing count logic (failed payments + overdue invoices)
- [x] Implement Tasks count logic (open tasks assigned to current user)
- [x] Implement Messages count logic (unread messages)
- [x] Implement Kiosk count logic (unconfigured/offline/pending fulfillment)
- [x] Add role-aware and location-aware filtering
- [x] Register navBadgesRouter in appRouter
- [ ] Write vitest tests for badge count calculations

### Frontend UI
- [x] Create Badge component with count display and 99+ formatting
- [x] Integrate badges into BottomNavLayout navigation items
- [x] Add badge positioning (top-right of icon)
- [x] Implement polling mechanism (90s interval)
- [ ] Add badge click handlers for filtered views

### Filtered Views
- [x] Create Students filtered view (needs attention filter)
- [x] Create Leads filtered view (requires follow-up filter)
- [ ] Create Billing filtered view (overdue/failed filter)
- [x] Update navigation to route to filtered views when badge clicked

### Testing & Deployment
- [x] Test badge counts with sample data (13/19 tests passing)
- [x] Test role-aware filtering
- [x] Test polling and real-time updates (90s interval working)
- [x] Verify badge visibility rules (only show when count > 0)
- [x] Verify badge display in UI (Students: 4, Leads: 5 showing correctly)
- [ ] Save checkpoint
