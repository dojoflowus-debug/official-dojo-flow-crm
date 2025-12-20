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
- [ ] Save checkpoint
