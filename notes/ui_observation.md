# UI Observation - Students Page

## Current State (2026-01-01)

The Students page currently shows:
1. **Split view layout** - Map on left (50%), Student list on right (50%)
2. **Student cards** - Showing name, status badge, program, belt, and alert indicators
3. **Megan White is highlighted** (first card) with action icons visible (phone, message, email)

## Issue
- When clicking a student card, it opens the old StudentModal component as a full-screen overlay
- The new StudentDetailCard component is not being rendered

## Design Reference Requirements
- Student detail should appear as a **right panel** alongside the student list
- Should show: photo with fade, name, status badge, action buttons, attendance chart, timeline
- Should NOT be a modal overlay

## Next Steps
1. Verify the StudentDetailCard component is properly integrated
2. Check if the layout changes are being applied correctly
3. Debug why the panel is not showing when student is selected
