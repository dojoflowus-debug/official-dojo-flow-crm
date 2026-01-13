# Kiosk Studio Premium - Design Transformation

## Overview

Kiosk Studio has been transformed from a functional dev panel into a premium, high-end design experience. The new design follows Apple device preview + Figma canvas + Peloton polish principles.

## Key Design Changes

### 1. Command Bar (Top)

**Before:** Simple header with scattered controls
**After:** Premium command bar with:
- Left: Branding (Kiosk Studio + Location name)
- Center: Status indicator (Unsaved changes / All saved)
- Right: Save, Publish, and Open Public buttons

**Design Details:**
- Gradient background: `from-slate-900 via-slate-950 to-black`
- Backdrop blur for depth
- Subtle border with slate-800/50 for definition
- Status dot with pulse animation for unsaved changes

### 2. Layout Structure

**Before:** Cluttered single-column layout with all controls mixed
**After:** Three-panel premium layout:
- **Left Panel (96 units):** Design modules (collapsible)
- **Center:** Gap for breathing room
- **Right Panel (flex):** Hero preview canvas

**Design Details:**
- Gradient background for entire page
- 8px padding and gaps for premium spacing
- Scrollable left panel with custom scrollbar
- Centered preview as the hero element

### 3. Design Modules (Left Panel)

**Before:** Flat form fields with minimal grouping
**After:** Beautiful collapsible design modules with:

#### Module Structure:
- **Icon + Header:** Gradient icon (unique color per module) + title + description
- **Collapsible:** Click to expand/collapse
- **Content Area:** Organized controls with proper spacing

#### Modules:
1. **Background** (Orange-Red gradient icon)
   - Type selector (Solid, Custom, Preset)
   - Color picker with hex input
   - Blur and dim sliders
   - Preset gallery
   - Upload component

2. **Appearance** (Purple-Pink gradient icon)
   - Accent color picker
   - Font family selector
   - Future: More styling options

3. **Typography** (Blue-Cyan gradient icon)
   - Title size slider (24-72px)
   - Title weight selector
   - Letter spacing slider
   - Button font size slider

4. **Content** (Green-Emerald gradient icon)
   - Left tile title input
   - Right tile title input
   - Future: More content options

**Design Details:**
- Each module: `bg-slate-800/30 border border-slate-700/50 rounded-xl p-6`
- Hover effect: `hover:border-slate-600/50 transition-colors`
- Backdrop blur for depth
- Smooth chevron rotation on expand/collapse

### 4. Preview Canvas (Right Panel)

**Before:** Small preview with no visual hierarchy
**After:** Hero preview experience with:
- Centered canvas with max-width constraint
- Rounded corners (rounded-2xl)
- Shadow depth (shadow-2xl)
- Gradient background container
- Backdrop blur effect
- Device emulator dock above preview

**Design Details:**
- Container: `rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50`
- Preview wrapper: `rounded-xl overflow-hidden shadow-2xl`
- Padding for breathing room: `p-8`
- Max-width: `max-w-4xl` for optimal viewing

### 5. Device Emulator Dock

**Before:** Scattered device controls
**After:** Compact, premium dock with:
- Clean device selector tabs
- Orientation toggle
- Zoom controls (50%, 75%, 100%, Fit)
- Frame ON/OFF toggle
- Touch simulation toggle
- "Open Public Kiosk" button

**Design Details:**
- Single row above preview
- Consolidated controls
- Premium button styling
- Clear visual hierarchy

### 6. Color Palette

**Primary Colors:**
- Background: `from-slate-900 via-slate-950 to-black`
- Surfaces: `slate-800/30` with backdrop blur
- Borders: `slate-700/50`
- Text: `slate-200` (labels), `white` (headings)
- Accents: `blue-600` (primary action)

**Module Icon Gradients:**
- Background: `from-orange-500 to-red-600`
- Appearance: `from-purple-500 to-pink-600`
- Typography: `from-blue-500 to-cyan-600`
- Content: `from-green-500 to-emerald-600`

### 7. Typography & Spacing

**Font Hierarchy:**
- Command bar: `text-xs` (labels), `text-sm` (values)
- Module headers: `font-semibold text-white`
- Module descriptions: `text-xs text-slate-400`
- Form labels: `text-sm font-medium text-slate-200`

**Spacing System:**
- Gap between panels: `gap-8`
- Module gap: `gap-4`
- Internal padding: `p-6`
- Control spacing: `space-y-2` or `space-y-4`

### 8. Interactive States

**Buttons:**
- Save: `border-slate-700 hover:border-slate-600 hover:bg-slate-800`
- Publish: `bg-blue-600 hover:bg-blue-700`
- Ghost: `text-slate-400 hover:text-slate-200`

**Inputs:**
- Background: `bg-slate-900/50 border-slate-700`
- Hover: `hover:border-slate-600`
- Focus: Standard focus ring

**Module Expansion:**
- Chevron rotates 180° on expand
- Content fades in smoothly
- Border-top separator for visual clarity

## Functional Preservation

All core functionality remains intact:
- ✅ Live binding (controls update preview instantly)
- ✅ Save/Publish persistence (writes to DB)
- ✅ Reload restores config (loads from DB)
- ✅ Public kiosk reflects published state
- ✅ Device emulator works seamlessly
- ✅ All controls remain functional

## Component Architecture

**New Component:** `KioskStudioPremium.tsx`
- Replaces `KioskStudioSimplified.tsx` in routing
- Maintains same TRPC integration
- Uses existing UI components from library
- Adds premium styling and layout

**Styling Approach:**
- Tailwind CSS with custom utility classes
- Gradient backgrounds for depth
- Backdrop blur for premium feel
- Smooth transitions and animations
- Responsive design (adapts to different screen sizes)

## Next Steps

1. **Theme Packs:** Create pre-configured design themes for different dojo types
2. **Franchise Branding:** Add multi-location branding options
3. **Multi-Kiosk Profiles:** Support multiple kiosk configurations per location
4. **Advanced Effects:** Add more visual effects (glow, shadows, animations)
5. **Preset Templates:** Create industry-specific design templates

## Design System Notes

- All colors use CSS custom properties for easy theming
- Spacing follows 4px base unit (4, 8, 12, 16, 20, 24...)
- Rounded corners: `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px)
- Shadows: `shadow-xl` (large), `shadow-2xl` (extra large)
- Transitions: `transition-colors`, `transition-transform` for smooth interactions
- Backdrop blur: `backdrop-blur-sm`, `backdrop-blur-xl` for depth

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox for layout
- CSS custom properties for theming
- Backdrop filter support required for blur effects
