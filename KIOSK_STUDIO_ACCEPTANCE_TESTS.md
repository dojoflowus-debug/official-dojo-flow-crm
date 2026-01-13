# Kiosk Studio Acceptance Tests

## Test Environment Setup
- Browser: Chromium (latest)
- Test User: Authenticated with organization access
- Test Data: At least 1 location with 1 kiosk

## Test Scenarios

### Scenario 1: Complete Workflow - Solid Color Background
**Objective:** Verify the complete workflow from location selection through save/publish with a solid color background.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select a location from the Location dropdown
3. Select a kiosk from the Kiosk dropdown
4. In Background tab, select "Solid Color" from dropdown
5. Pick a color using the color picker (e.g., blue #0000ff)
6. Verify the preview updates to show the blue background
7. Modify accent color to green #00ff00
8. Verify buttons in preview turn green
9. Click "Save Draft" button
10. Verify success toast appears: "Draft saved"
11. Click "Publish" button
12. Verify success toast appears: "Published successfully"
13. Navigate to public kiosk route (/kiosk/:slug)
14. Verify the published config loads with blue background and green buttons

**Expected Results:**
- ✅ Preview updates in real-time as controls change
- ✅ Save Draft persists config to database
- ✅ Publish makes config live on public route
- ✅ Toast notifications appear for save and publish
- ✅ Public route loads published config correctly

---

### Scenario 2: Background Preset Selection
**Objective:** Verify preset background selection works end-to-end.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and kiosk
3. In Background tab, select "Preset Theme" from dropdown
4. Click on "Martial Arts Dojo" preset thumbnail
5. Verify preview updates to show the dojo background image
6. Adjust blur slider to 12px
7. Adjust dim slider to 50%
8. Verify preview shows blurred, dimmed background
9. Click "Save Draft"
10. Verify success toast appears
11. Reload the page
12. Verify the preset and blur/dim settings are still selected

**Expected Results:**
- ✅ Preset thumbnails display correctly
- ✅ Clicking preset updates preview immediately
- ✅ Blur and dim sliders affect preview
- ✅ Settings persist after save and reload
- ✅ Toast notifications work correctly

---

### Scenario 3: Background Image Upload
**Objective:** Verify custom background image upload works end-to-end.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and kiosk
3. In Background tab, select "Custom Image" from dropdown
4. Click "Choose Image" button
5. Select a valid image file (JPG, PNG, under 5MB)
6. Verify preview shows image preview in upload component
7. Verify upload completes (button shows "Choose Image" again)
8. Verify preview updates to show the uploaded image
9. Verify success toast appears: "Background uploaded successfully"
10. Click "Save Draft"
11. Reload the page
12. Verify the custom image is still selected

**Expected Results:**
- ✅ File picker opens and accepts image files
- ✅ Image preview displays before upload
- ✅ Upload completes successfully
- ✅ Success toast appears after upload
- ✅ Preview updates with uploaded image
- ✅ Settings persist after save and reload

---

### Scenario 4: Upload Error Handling
**Objective:** Verify error handling for invalid file uploads.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and kiosk
3. In Background tab, select "Custom Image"
4. Try to upload a non-image file (e.g., .txt file)
5. Verify error toast appears: "Please select an image file"
6. Try to upload a file larger than 5MB
7. Verify error toast appears: "Image must be smaller than 5MB"

**Expected Results:**
- ✅ Non-image files are rejected with clear error message
- ✅ Large files are rejected with clear error message
- ✅ Error toasts appear and persist until dismissed
- ✅ Upload button remains functional after errors

---

### Scenario 5: Typography Controls
**Objective:** Verify all typography controls update the preview in real-time.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and kiosk
3. In Appearance tab, adjust Title Size slider from 48 to 72
4. Verify preview titles get larger
5. Adjust Title Size back to 24
6. Verify preview titles get smaller
7. Adjust Title Weight slider to 900
8. Verify preview titles appear bolder
9. Adjust Letter Spacing to 2
10. Verify preview titles have more letter spacing
11. Adjust Button Font Size to 24
12. Verify preview button text gets larger
13. Click "Save Draft"
14. Reload the page
15. Verify all typography settings are preserved

**Expected Results:**
- ✅ All sliders update preview in real-time
- ✅ Changes are visible immediately
- ✅ Settings persist after save and reload
- ✅ No console errors during adjustments

---

### Scenario 6: Content Customization
**Objective:** Verify content text fields update the preview.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and kiosk
3. In Content tab, change Headline to "Welcome to My Dojo"
4. Verify preview updates with new headline
5. Change Left Tile Title to "Student Check-In"
6. Verify preview updates with new title
7. Change Button Text to "TAP TO CHECK IN"
8. Verify preview button text updates
9. Click "Save Draft"
10. Reload the page
11. Verify all content changes are preserved

**Expected Results:**
- ✅ Text fields update preview in real-time
- ✅ Changes are visible immediately
- ✅ Settings persist after save and reload
- ✅ No console errors during edits

---

### Scenario 7: Multi-Kiosk Management
**Objective:** Verify switching between kiosks preserves state correctly.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and first kiosk
3. Set background to blue color
4. Set accent color to red
5. Click "Save Draft"
6. Select second kiosk from dropdown
7. Verify preview resets to second kiosk's config (or default)
8. Set background to green color
9. Click "Save Draft"
10. Switch back to first kiosk
11. Verify blue background and red accent are still there
12. Switch to second kiosk
13. Verify green background is still there

**Expected Results:**
- ✅ Switching kiosks loads correct config
- ✅ Each kiosk's settings are preserved independently
- ✅ Save Draft saves to correct kiosk
- ✅ No cross-contamination between kiosks

---

### Scenario 8: Dirty State and Save Button
**Objective:** Verify dirty state tracking and save button enable/disable.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and kiosk
3. Verify "Save Draft" and "Publish" buttons are disabled (grayed out)
4. Change accent color
5. Verify "Save Draft" button becomes enabled
6. Click "Save Draft"
7. Verify buttons return to disabled state
8. Change typography
9. Verify "Save Draft" button becomes enabled again
10. Click "Publish"
11. Verify buttons return to disabled state

**Expected Results:**
- ✅ Save/Publish buttons are disabled when no changes
- ✅ Buttons enable when config changes
- ✅ Buttons disable after save/publish
- ✅ Dirty state tracking works correctly

---

### Scenario 9: Public Route Access
**Objective:** Verify public kiosk route loads published config correctly.

**Steps:**
1. Navigate to Kiosk Studio page
2. Select location and kiosk
3. Set a unique configuration (e.g., specific color, preset, text)
4. Click "Publish"
5. Copy the kiosk slug
6. Open a new tab and navigate to /kiosk/{slug}
7. Verify the published config loads
8. Verify all settings match what was published
9. Go back to Kiosk Studio and make changes to draft
10. Refresh the public route
11. Verify the public route still shows the old published config (not the draft changes)

**Expected Results:**
- ✅ Public route loads published config
- ✅ All settings display correctly
- ✅ Draft changes don't affect published config
- ✅ Public route is accessible without authentication

---

### Scenario 10: Multi-Tenant Isolation
**Objective:** Verify users only see their organization's kiosks.

**Steps:**
1. Log in as user from Organization A
2. Navigate to Kiosk Studio
3. Verify only Organization A's locations and kiosks appear
4. Log out and log in as user from Organization B
5. Navigate to Kiosk Studio
6. Verify only Organization B's locations and kiosks appear
7. Verify Organization B cannot see Organization A's kiosks

**Expected Results:**
- ✅ Users only see their organization's data
- ✅ No cross-organization data leakage
- ✅ Multi-tenant isolation is enforced

---

## Test Execution Checklist

- [ ] All 10 scenarios pass
- [ ] No console errors or warnings
- [ ] No 500 errors from backend
- [ ] Toast notifications appear for all actions
- [ ] Preview updates are smooth and responsive
- [ ] Database persistence verified
- [ ] Public routes load correctly
- [ ] Multi-tenant isolation verified
- [ ] Responsive design works on mobile/tablet/desktop

## Known Issues Found During Testing

(To be filled in during actual testing)

## Sign-Off

- [ ] QA Lead: _______________
- [ ] Product Owner: _______________
- [ ] Date: _______________
