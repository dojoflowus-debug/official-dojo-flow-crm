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
- [ ] Add image upload UI component to Create Item dialog
- [ ] Implement file selection and preview
- [ ] Add S3 upload functionality for merchandise images
- [ ] Update createItem mutation to accept imageUrl
- [ ] Test image upload with real files
- [ ] Save checkpoint

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
- [ ] Save checkpoint
