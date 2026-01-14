# Student Card Issues Analysis

## Current State
The student card is a right-side drawer panel (not a modal) showing:
- Student name and belt rank at top
- Trial badge
- Follow up message
- View full profile / View billing / Attendance history links
- Call / SMS / Email buttons
- Insights section with 30-day attendance
- Risk Drivers section
- Timeline section

## Issues Identified from Screenshot
1. **Ghost text** - The text in the card appears to have visibility issues (likely dark text on dark background in some areas)
2. **Bottom cutoff** - The card content extends beyond the visible area
3. **No photo upload** - No visible way to add/change student photo
4. **No logo display** - The dojo logo is not shown on the student card

## Components to Fix
- StudentDetailPanel.tsx - This is the right-side drawer panel
- StudentModal.tsx - This is the edit modal (Profile/Details tabs)

## Solution
1. Fix text contrast in StudentDetailPanel
2. Add proper scrolling to the panel
3. Add photo upload button to the panel header
4. Add dojo logo to the card header
5. Redesign for better UX
