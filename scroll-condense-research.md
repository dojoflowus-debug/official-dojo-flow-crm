# Scroll-Condense Hero Video Effect Research

## TesoroXP Analysis
The TesoroXP website has an animated hero section with a phone mockup that transitions as you scroll. However, the specific "video condense into floating icon" effect described by the user is a custom implementation pattern.

## Implementation Plan for DojoFlow

### Effect Behavior:
1. **Initial State**: Full hero video background covering the hero section
2. **Scroll Trigger**: When user scrolls past ~70% of hero (120-220px scroll)
3. **Transition**: Video smoothly shrinks and morphs into DojoFlow icon silhouette
4. **Condensed State**: Floating video-inside-icon pinned to bottom-right
5. **Reverse**: Expands back to full hero when scrolling up

### Technical Approach:
1. **SVG Mask**: Convert DojoFlow swirl icon to SVG clipPath
2. **Two Video Elements**: 
   - Main hero video (full screen)
   - Floating video (masked to icon shape)
3. **Scroll-based Animation**: Use Intersection Observer + CSS transforms
4. **Framer Motion**: For smooth 60fps animations

### Visual Specs:
- Floating icon size: 72-120px (responsive)
- Opacity: 0.75-0.9 with soft glow
- Position: Fixed bottom-right (desktop), bottom-center (mobile)
- Soft shadow matching site cards
- Optional breathing glow animation
- Hover: brighten + scale 2%

### DojoFlow Icon SVG Path:
Need to convert the swirl logo PNG to SVG path for masking.
The icon is a spiral/swirl shape that will be used as a clip-path.
