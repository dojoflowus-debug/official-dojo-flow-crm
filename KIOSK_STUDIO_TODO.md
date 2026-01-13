# Kiosk Studio Integration TODO

## Phase 1: Fix Imports and Toast Notifications ✅ COMPLETED
- [x] Add useToast hook with success/error convenience methods
- [x] Update KioskBackgroundUpload component props to match KioskStudioSimplified
- [x] Integrate KioskBackgroundUpload into KioskStudioSimplified
- [x] Add toast container rendering in KioskStudioSimplified
- [x] Fix Toast component to support all toast types (success, error, info, warning)
- [x] Fix KioskConfig background type to use 'solid' instead of 'color'
- [x] Fix background type references in KioskStudioSimplified
- [x] Add type annotations to map parameters

## Phase 2: Test Background Upload Integration ✅ COMPLETED
- [x] Create comprehensive test for KioskBackgroundUpload component
- [x] Test file type validation
- [x] Test file size validation
- [x] Test successful upload flow
- [x] Test error handling

## Phase 3: Test Save/Publish Persistence
- [ ] Verify saveDraft persists config to database
- [ ] Verify publishMutation copies draft to published
- [ ] Verify isDirty flag works correctly
- [ ] Test switching between kiosks preserves state
- [ ] Test public kiosk route loads published config
- [ ] Test unpublished kiosks return 404 on public route

## Phase 4: Verify Typography Controls Work Visually
- [ ] Test titleSize slider updates preview
- [ ] Test titleWeight slider updates preview
- [ ] Test letterSpacing slider updates preview
- [ ] Test buttonFontSize slider updates preview
- [ ] Verify all typography changes are visible in real-time

## Phase 5: Run Comprehensive Acceptance Tests
- [ ] Test complete workflow: select location → select kiosk → modify config → save → publish
- [ ] Test background upload workflow: select custom → upload image → verify in preview
- [ ] Test preset selection workflow: select preset → verify in preview
- [ ] Test color selection workflow: select solid → pick color → verify in preview
- [ ] Test toast notifications for all actions (save, publish, upload)
- [ ] Test error scenarios (network failure, invalid file, etc.)

## Phase 6: Polish and Cleanup
- [ ] Remove debug console.log statements
- [ ] Add loading states for upload/save/publish
- [ ] Test error scenarios comprehensively
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Save checkpoint with all features working

## Known Working Features
- ✅ Location and kiosk selection with database integration
- ✅ Real-time preview with accent color changes
- ✅ Background preset system with 7 curated images
- ✅ All appearance controls wired to preview
- ✅ Save/Publish TRPC mutations defined
- ✅ Toast notifications rendering
- ✅ Background upload component integrated
- ✅ Multi-tenancy isolation (ctx.currentOrganizationId)

## Known Issues
- None currently identified

## Testing Strategy
1. Manual testing through UI (click through all workflows)
2. Verify database persistence (check kiosk config in DB)
3. Verify public route loads published config
4. Test error scenarios (network failures, invalid files)
5. Test multi-tenant isolation (different orgs can't see each other's kiosks)

## Success Criteria
- [ ] All controls update preview in real-time
- [ ] Save Draft persists config to database
- [ ] Publish makes config live on public route
- [ ] Background upload works end-to-end
- [ ] Toast notifications appear for all actions
- [ ] No console errors or warnings
- [ ] Multi-tenant isolation verified
- [ ] Public route loads published config correctly
