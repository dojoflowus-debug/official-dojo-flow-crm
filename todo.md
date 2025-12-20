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
