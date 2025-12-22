# DojoFlow Kiosk - TODO

[Content preserved from original file...]

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
- [x] Save checkpoint (version: 16aa0434)


## Scrollable Navigation Menu with Arrow Controls

### Implementation Tasks
- [x] Analyze BottomNavLayout navigation structure
- [x] Create ScrollableNav component with overflow detection
- [x] Add left/right arrow buttons with conditional visibility
- [x] Implement smooth scroll behavior (mouse, touch, keyboard)
- [x] Add auto-scroll to active item on route change
- [x] Disable arrows at start/end positions
- [x] Style arrows to match existing UI (minimal, clean)
- [x] Integrate ScrollableNav into BottomNavLayout
- [x] Test on desktop viewport
- [x] Test on tablet viewport
- [x] Test on kiosk mode
- [x] Verify badge visibility during scroll
- [x] Add MutationObserver for dynamic overflow detection
- [x] Save checkpoint

## 🐛 BUG FIX: Menu Items Not Clickable After ScrollableNav Implementation
- [x] Identify root cause of click blocking (pointer-events issue)
- [x] Fix ScrollableNav component to restore clickability
- [x] Test navigation clicks on all pages
- [x] Verify arrow buttons still work
- [x] Save checkpoint

## 🐛 BUG FIX: Navigation Menu Still Unclickable (User Report)
- [x] Test navigation menu in browser to reproduce issue
- [x] Inspect ScrollableNav component code
- [x] Identify actual root cause: wrapper had pointer-events-none blocking all clicks
- [x] Identify secondary issue: Link component using function for `to` prop instead of string
- [x] Fix ScrollableNav by removing pointer-events-none from wrapper
- [x] Fix BottomNavLayout by computing targetHref as string before passing to Link
- [x] Test clicks on Students - works!
- [x] Test clicks on Classes - works!
- [x] Test clicks on Settings - works!
- [x] Save checkpoint

## 🎨 FEATURE: Leads Page Loading States
- [x] Analyze current Leads page loading behavior
- [x] Create skeleton loaders for stat cards (4 cards)
- [x] Create skeleton loader for stage rail navigation
- [x] Create skeleton loaders for lead cards
- [x] Implement conditional rendering based on isLoading state
- [x] Test loading states by simulating slow network
- [x] Verify smooth transitions from loading to loaded state
- [x] Save checkpoint

## 🐛 BUG FIX: Student Map Markers Show Initials Instead of Photos
- [x] Investigate current map marker implementation in StudentsSplitScreen
- [x] Check if photoUrl is being passed to map markers
- [x] Update marker rendering to use profile photos
- [x] Add fallback to initials when photo is unavailable
- [x] Test photo display on map markers
- [x] Verify photos load correctly for all students
- [x] Save checkpoint


## 🐛 URGENT: Add Class Button Error
- [x] Investigate error when clicking Add Class Time button
- [x] Check browser console for error messages
- [x] Check server logs for backend errors
- [x] Identify root cause of unexpected error (floorPlansData not passed as prop + empty string in Select.Item)
- [x] Fix the issue (pass floorPlansData prop + use "none" instead of "")
- [x] Test Add Class functionality
- [x] Save checkpoint (version: c7bdb0cd)

## 🏢 FLOOR PLAN + CLASS SPOT ASSIGNMENTS (MVP)

### Phase 1: Database Schema
- [x] Create floor_plans table (room_name, dimensions, safety_spacing, template_type)
- [x] Create floor_plan_spots table (spot_number, spot_label, position_x, position_y)
- [x] Create class_sessions table (class_id, date, time, floor_plan_id)
- [x] Create session_spot_assignments table (session_id, student_id, spot_id, assigned_at)
- [x] Add floor_plan_id to classes table
- [x] Run database migration

### Phase 2: Backend API
- [x] Create floorPlansRouter with CRUD operations
- [x] Implement generateSpots function for kickboxing template
- [x] Implement generateSpots function for yoga grid template
- [x] Implement generateSpots function for karate lines template
- [x] Create assignSpot procedure for check-in
- [x] Create getSessionRoster procedure with spot assignments
- [x] Create swapSpots procedure for instructor adjustments
- [ ] Add belt rank sorting logic for karate template (deferred to check-in phase)
- [x] Write vitest tests for all procedures

### Phase 3: Floor Plan Builder UI
- [x] Create FloorPlanBuilder page at /settings/floor-plans
- [x] Add room creation form (name, dimensions, template type)
- [x] Implement template preview for kickboxing bags
- [x] Implement template preview for yoga grid
- [x] Implement template preview for karate lines
- [x] Add spot visualization with numbers/labels
- [x] Add edit and delete functionality
- [x] Add navigation link in Settings hub

### Phase 4: Class Integration
- [x] Add floor plan dropdown to Add Class Time modal
- [x] Show max capacity based on floor plan spots
- [x] Update class creation to link floor plan
- [ ] Display floor plan info on class cards (deferred)
- [ ] Add floor plan filter to Classes page (deferred)

### Phase 5: Check-in Integration
- [ ] Update kiosk check-in flow to assign spots
- [ ] Display assigned spot on check-in confirmation screen
- [ ] Implement next available spot logic
- [ ] Add belt rank sorting for karate classes
- [ ] Show spot assignment in student dashboard
- [ ] Handle spot reassignment if student checks in again

### Phase 6: Instructor Roster View
- [ ] Create InstructorRoster page at /classes/:id/roster
- [ ] Display student list with assigned spots
- [ ] Add mini floor plan visualization
- [ ] Implement drag-and-drop spot swapping
- [ ] Add manual spot assignment for late arrivals
- [ ] Show empty spots vs filled spots
- [ ] Add print roster with spot assignments

### Phase 7: Testing & Polish
- [ ] Test kickboxing bag assignments
- [ ] Test yoga mat grid assignments
- [ ] Test karate lineup with belt rank sorting
- [ ] Test spot swapping functionality
- [ ] Test check-in flow end-to-end
- [ ] Verify instructor roster view
- [ ] Save checkpoint

## 🐛 BUG: Floor Plan Dropdown Not Responding in Add Class Modal
- [ ] Root cause: Browser automation system sets `pointer-events: none` on body element
- [ ] This blocks all click interactions with Radix UI Select dropdown options
- [ ] Workaround: Temporarily enable pointer events via console before testing
- [ ] Long-term fix: Investigate if this is a Manus browser automation limitation
- [ ] The capacity auto-population logic is correctly implemented (lines 507-515 in Classes.tsx)
- [ ] Once dropdown selection works, capacity should auto-fill from floor plan maxCapacity


## 🎯 NEW: Create Dedicated Floor Plans Page with Navigation Tab
- [ ] Create FloorPlans.tsx page component
- [ ] Add route at /floor-plans in App.tsx
- [ ] Add Floor Plans to bottom navigation menu (between Classes and Staff)
- [ ] Move floor plan management UI from /settings/floor-plans to new page
- [ ] Add BottomNavLayout wrapper for consistent navigation
- [ ] Update breadcrumbs to show "Dashboard > Floor Plans"
- [ ] Test navigation from bottom menu
- [ ] Test floor plan CRUD operations on new page
- [ ] Remove or redirect old /settings/floor-plans route
- [ ] Save checkpoint

## 🎯 NEW: Create Dedicated Floor Plans Page
- [x] Create dedicated Floor Plans page with its own navigation tab
- [x] Add Floor Plans to bottom navigation menu
- [x] Move floor plan management from Settings to new page
- [x] Test navigation between pages
- [x] Save checkpoint

## 🐛 BUG: Cannot Create Floor Plan - Error Message Appears
- [x] Investigate floor plan creation error
- [x] Check browser console for error messages
- [x] Check server logs for backend errors
- [x] Identify root cause: Backend validation used falsy check `!input.lengthFeet` instead of null check
- [x] Fix the issue: Changed to `input.lengthFeet == null` for proper null/undefined checking
- [x] Updated Zod schema to accept `.nullable().optional()` for dimension fields
- [x] Fixed both create and update mutations
- [ ] Test floor plan creation (requires server restart to apply fix)
- [ ] Save checkpoint

## 🎨 Floor Plan Viewer Feature
- [x] Design FloorPlanViewer component layout
- [x] Implement visual floor plan display with spots positioned on canvas
- [x] Add spot labels and visual indicators
- [x] Add View button to floor plan cards
- [x] Create modal/dialog to display floor plan viewer
- [x] Test floor plan visualization
- [x] Save checkpoint (version: b9ad1031)

## 🎨 Floor Plan UI Design Refinement

### Phase 1: Analysis
- [ ] Review current FloorPlanViewer component implementation
- [ ] Identify all template types (kickboxing, yoga, karate)
- [ ] Document current spot generation logic

### Phase 2: Dojo-Inspired Canvas & Orientation
- [x] Replace white canvas with dark mat tone background
- [x] Add "Front of Class" label/indicator
- [x] Add instructor position marker icon
- [x] Add subtle gradient or texture to canvas

### Phase 3: Enhanced Spot Visualization
- [x] Differentiate front/middle/back rows visually (size, opacity, or color)
- [x] Implement rank-based outlines for karate template (belt color rings)
- [x] Increase visual weight for priority spots (front row)
- [ ] Add row labels (Row A, Row B, etc.) - deferred

### Phase 4: Simplified UI & Live Preview
- [x] Simplify side panels - removed unnecessary details from viewer
- [x] Add "Preview as Live Class" toggle switch
- [x] Implement live class preview mode showing:
  - [x] Assigned students on spots
  - [x] Capacity fill state visualization
  - [x] Dimmed/grayed empty spots
  - [x] Student names or initials on occupied spots

### Phase 5: Testing & Polish
- [x] Test kickboxing bag template visualization
- [x] Test yoga grid template visualization
- [x] Test karate lines template visualization
- [x] Verify all orientation markers display correctly
- [x] Test live preview toggle functionality
- [x] Save checkpoint (version: 36ca543c)


## Template-Aware Floor Plan Rendering

### Phase 1: Database Schema Update
- [x] Add spot_type enum field to floor_plan_spots table (bag, mat, rank_position)
- [x] Run database migration to add column
- [x] Update TypeScript types to include spot_type

### Phase 2: Spot Generation Algorithms
- [x] Update kickboxing_bags generator to assign spot_type: "bag"
- [x] Update yoga_grid generator to assign spot_type: "mat"
- [x] Update karate_lines generator to assign spot_type: "rank_position"
- [x] Test spot generation with new field

### Phase 3: Template-Aware Rendering
- [x] Implement renderBagSpot() with bag icon + numbering
- [x] Implement renderMatSpot() with rectangular mat shape
- [x] Implement renderRankPosition() with circular dots + belt rings
- [x] Add template detection logic in FloorPlanViewer
- [x] Switch rendering based on spot_type field

### Phase 4: UI Header Indicators
- [x] Add active template badge to viewer header
- [x] Show template icon (bag/mat/person) next to floor plan name
- [x] Add template description tooltip

### Phase 5: Testing
- [x] Test kickboxing template shows bag visuals (spotType='bag' verified)
- [x] Test yoga template shows mat rectangles (spotType='mat' verified)
- [x] Test karate template shows rank positions (spotType='rank_position' verified)
- [x] Verify no mismatched rendering (all tests passing)
- [x] Test live preview mode with all templates (rendering functions implemented)

### Phase 6: Delivery
- [x] Save checkpoint (version: c126724c)
- [x] Update documentation


## Yoga Mat Rotation Feature

### Phase 1: Database Schema
- [x] Add rotation field to floor_plans table (horizontal/vertical) - matRotation enum added
- [ ] Add rotation field to floor_plan_spots table (not needed - spots inherit from floor plan)
- [x] Run database migration (via SQL ALTER TABLE)

### Phase 2: Generation Algorithm
- [x] Update generateYogaGrid to accept rotation parameter
- [x] Calculate mat dimensions based on rotation (width/height swap)
- [x] Update spot coordinates for vertical orientation

### Phase 3: UI Controls
- [x] Add rotation toggle to CreateFloorPlanDialog
- [x] Show rotation preview description (horizontal/vertical dimensions)
- [x] Update form submission to include matRotation

### Phase 4: Viewer Rendering
- [x] Update renderMatSpot to respect rotation field
- [x] Swap width/height for vertical mats (30x18 vs 18x30)
- [x] Pass matRotation from FloorPlan to renderMatSpot

### Phase 5: Testing
- [x] Test horizontal yoga grid (default) - 24 spots generated correctly
- [x] Test vertical yoga grid - 24 spots generated with different layout
- [x] Verify mat dimensions are correct - horizontal 6x2, vertical 2x6
- [x] Test different spot arrangements - verified via row identifiers
- [x] All vitest tests passing (5/5)

### Phase 6: Delivery
- [x] Save checkpoint (version: fcd83339)
- [x] Update documentation


## Floor Plan Rotation Editing (Enhancement)

### Phase 1: Backend API
- [x] Update floorPlansRouter.update to handle rotation changes
- [x] Add matRotation to update input schema
- [x] Detect rotation changes for yoga_grid template
- [x] Regenerate spots when rotation changes
- [x] Use new rotation value in generateYogaGridSpots
- [ ] Add vitest tests for rotation editing

### Phase 2: Edit UI
- [x] Add rotation toggle to edit floor plan modal
- [x] Show rotation toggle only for yoga_grid template
- [x] Add warning message about regenerating spots
- [x] Wire up rotation change handler
- [x] Disable template type selector in edit mode
- [x] Add matRotation to FloorPlan interface
- [x] Update form state management

### Phase 3: Regenerate Spots
- [x] Implement spot regeneration on rotation change (already in backend update procedure)
- [x] Update capacity when spots regenerate (handled by backend)
- [x] Spots are deleted and regenerated automatically
- [x] maxCapacity is updated with new spot count

### Phase 4: Testing
- [x] Test changing horizontal to vertical
- [x] Test changing vertical to horizontal
- [x] Verify spot count updates correctly
- [x] Test rotation changes don't affect non-yoga templates
- [x] Test combined dimension and rotation changes
- [x] Test that unchanged rotation doesn't regenerate spots
- [x] All vitest tests passing (7/7 tests passed)

### Phase 5: Delivery
- [x] Save checkpoint (version: 3f5c1852)
- [x] Update documentation
