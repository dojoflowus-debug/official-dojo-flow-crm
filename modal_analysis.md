# Student Modal Analysis

## Issues Identified from Screenshots

### 1. Ghost Text Issue
Looking at the modal, the form fields show placeholder text like "123 Main St", "City", "State", "12345" but they appear very faint/ghost-like. This is because the input fields have light gray placeholder text that is hard to see against the white background.

### 2. Bottom Cutoff Issue
The modal content is cut off at the bottom. The "Program & Enrollment" section is visible but the buttons at the bottom ("View Profile" and "Save Changes") are partially visible. The modal needs:
- Better max-height calculation
- Proper overflow-y-auto on the content area
- The content area needs to scroll properly

### 3. No Photo Upload
The modal shows "Change Logo" button at the top right, but there's no way to add/change the student's photo. The student avatar shows "MW" initials but no photo upload option.

### 4. No Dojo Logo on Card
The modal header shows a red dojo icon placeholder, but the actual school logo should be displayed here.

## Files to Modify
1. `/home/ubuntu/dojoflow/client/src/components/StudentModal.tsx` - Main modal component
   - Fix overflow/scrolling
   - Add photo upload functionality
   - Improve text contrast

## Solution Plan
1. Fix the modal container to have proper max-height and scrolling
2. Add a photo upload button near the student avatar
3. Ensure the dojo logo is properly displayed
4. Fix text contrast for form fields
