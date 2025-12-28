# Anima Website - Animated Background Analysis

## Visual Design Elements

### Background Characteristics
1. **Dark base color**: Deep charcoal/navy background (#1a1a2e or similar)
2. **Organic shapes**: Large circular/blob shapes with soft edges
3. **Gradient fills**: Purple-to-blue gradients on shapes
4. **Flowing curves**: Smooth curved lines that traverse the canvas
5. **Subtle glow**: Soft blur/glow effects on shapes for depth
6. **Layered composition**: Multiple elements at different z-indexes

### Animation Behavior
1. **Slow continuous movement**: Shapes drift slowly across the viewport
2. **Different speeds**: Multiple layers moving at varying velocities (parallax effect)
3. **Smooth transitions**: No abrupt movements, everything flows organically
4. **Infinite loop**: Seamless animation that repeats indefinitely
5. **Non-distracting**: Movement is subtle enough not to compete with content

### Color Palette (from screenshot)
- Background: Dark navy/charcoal (#1a1a2e, #2a2a3e)
- Shape gradients: Purple (#6366f1, #8b5cf6) to Blue (#3b82f6, #06b6d4)
- Accent lines: Light purple/blue with low opacity
- Glow effects: Soft purple/blue halos

## Technical Implementation Strategy

### Approach 1: CSS Animations + SVG
- Create SVG shapes with gradient definitions
- Use CSS keyframe animations for movement
- Apply blur filters for glow effects
- Use transform: translate3d() for GPU acceleration

### Approach 2: Framer Motion (Recommended)
- More control over complex animations
- Better performance optimization
- Easier to create parallax effects
- Smoother easing functions

### Key Technical Considerations
1. **Performance**: Use GPU-accelerated transforms (translate3d, scale)
2. **Accessibility**: Respect prefers-reduced-motion media query
3. **Responsiveness**: Scale shapes appropriately for mobile
4. **Z-index layering**: Background (-1), content (0+)
5. **Overflow handling**: Ensure shapes don't create scrollbars

## Implementation Plan

### Component Structure
```
AnimatedBackground.tsx
├── Multiple shape layers (3-5 shapes)
├── Curved line elements (2-3 paths)
├── Gradient definitions (SVG defs)
└── Animation logic (Framer Motion or CSS)
```

### Animation Parameters
- **Duration**: 20-40 seconds per cycle (slow drift)
- **Easing**: easeInOut or custom cubic-bezier
- **Direction**: Diagonal movements (top-left to bottom-right, etc.)
- **Scale variation**: Subtle scaling (0.9 to 1.1) for depth
- **Opacity**: 0.3-0.6 for background shapes

### Integration Points
- Apply to PublicLanding.tsx hero section
- Position as absolute/fixed background layer
- Ensure text remains readable (sufficient contrast)
- Test on various screen sizes
