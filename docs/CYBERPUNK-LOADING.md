# Cyberpunk Loading Components

This document describes the cyberpunk-themed loading indicators and animations added to the Wheelhouse Dashboard.

## Components

### CyberpunkSpinner

A loading spinner with rotating neon rings and glitch effects. Features multiple concentric rings with staggered rotation speeds and pulsing glow effects.

**Location:** `src/components/ui/cyberpunk-spinner.tsx`

#### Basic Usage

```tsx
import { CyberpunkSpinner } from "@/components/ui/cyberpunk-spinner"

// Simple spinner
<CyberpunkSpinner />

// With size
<CyberpunkSpinner size="lg" />
```

#### Sizes

- `sm` - 8x8 (32px) - For inline use or small spaces
- `md` - 12x12 (48px) - Default size, good for most loading states
- `lg` - 16x16 (64px) - For prominent loading indicators
- `xl` - 24x24 (96px) - For full-page loading states

#### Variants

**CyberpunkSpinnerText**
Spinner with accompanying text label below it.

```tsx
<CyberpunkSpinnerText text="Loading data..." size="md" />
```

**CyberpunkSpinnerInline**
Compact inline spinner for buttons and small spaces.

```tsx
<CyberpunkSpinnerInline />
```

### Enhanced Skeleton Component

The existing `Skeleton` component has been enhanced with cyberpunk styling that automatically activates when the cyberpunk theme is enabled.

**Features:**
- Animated gradient shimmer effect
- Neon border glow
- Color scheme matches cyberpunk theme

```tsx
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-4 w-3/4" />
```

### Enhanced Button Component

The `Button` component now supports a `loading` state with an animated spinner.

```tsx
import { Button } from "@/components/ui/button"

<Button loading={isSubmitting}>
  Submit
</Button>

<Button loading={isSubmitting} loadingText="Submitting...">
  Submit
</Button>
```

### Enhanced ProgressIndicator

The planning chat `ProgressIndicator` component has been enhanced with cyberpunk effects:
- Glowing borders and shadows
- Pulsing indicators
- Gradient backgrounds

## CSS Animations

### Spinner Animations

**cyber-spin** - Clockwise rotation for outer and inner rings
```css
@keyframes cyber-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**cyber-spin-reverse** - Counter-clockwise rotation for middle ring
```css
@keyframes cyber-spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
```

**cyber-pulse** - Pulsing glow effect
```css
@keyframes cyber-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary) / 0.5);
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 16px hsl(var(--primary)), 0 0 32px hsl(var(--primary) / 0.7), 0 0 48px hsl(var(--accent) / 0.3);
  }
}
```

**cyber-glitch-spin** - Glitch effect overlay
```css
@keyframes cyber-glitch-spin {
  0%, 49%, 51%, 100% { opacity: 0; }
  50% { opacity: 1; transform: rotate(180deg) scale(1.1); }
}
```

**shimmer** - Skeleton shimmer animation
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## Theme Integration

All loading components automatically adapt to the active theme:

- **Default/Dark theme:** Standard muted colors with subtle animations
- **Cyberpunk theme:** Neon colors (cyan, magenta, yellow) with glowing effects

The cyberpunk styling is applied using Tailwind's variant system:
```tsx
className="cyberpunk:shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
```

## Updated Components

The following components have been updated to use the new cyberpunk loading indicators:

1. **PlanningChat** - Uses `CyberpunkSpinnerText` for initial loading
2. **ExecutionControls** - Buttons show loading state with spinner
3. **TaskComments** - Uses `CyberpunkSpinner` for loading state
4. **ActivityFeed** - Uses `CyberpunkSpinner` for loading states
5. **CardSkeleton** - Uses enhanced `Skeleton` component
6. **ProgressIndicator** - Enhanced with cyberpunk glow effects

## Visual Design

### Color Palette

The cyberpunk spinner uses the theme's color variables:
- **Primary ring:** `hsl(var(--primary))` - Cyan (#00ffff)
- **Middle ring:** `hsl(var(--accent))` - Magenta (#ff00ff)
- **Inner ring:** `hsl(var(--warning))` - Yellow (#ffff00)
- **Core:** Radial gradient from primary to transparent

### Animation Timing

- **Outer ring:** 2s linear rotation + 2s pulse
- **Middle ring:** 1.5s reverse rotation
- **Inner ring:** 1s fast rotation
- **Glitch overlay:** 3s periodic flash
- **Shimmer:** 2s linear sweep

### Effects

1. **Neon Glow:** Multi-layer box-shadow for neon tube effect
2. **Rotation:** Three rings spinning at different speeds and directions
3. **Pulse:** Opacity and glow intensity variation
4. **Glitch:** Occasional flash and scale effect
5. **Core:** Pulsing center light source

## Best Practices

1. **Size Selection:**
   - Use `sm` for buttons and inline loading states
   - Use `md` (default) for card loading states
   - Use `lg` for modal or prominent loading
   - Use `xl` for full-page loading screens

2. **Accessibility:**
   - All spinners include `role="status"` and `aria-label="Loading"`
   - Screen reader text is provided via `sr-only` class

3. **Performance:**
   - Animations use CSS transforms for GPU acceleration
   - Opacity changes are hardware-accelerated
   - No JavaScript animation loops

4. **Loading States:**
   - Use `CyberpunkSpinner` for general loading indicators
   - Use `Button` with `loading` prop for action buttons
   - Use `Skeleton` for content placeholders
   - Use `CyberpunkSpinnerText` when you need descriptive text

## Examples

### Full Page Loading
```tsx
<div className="flex items-center justify-center h-screen">
  <CyberpunkSpinnerText text="Initializing dashboard..." size="xl" />
</div>
```

### Card Loading
```tsx
<Card>
  <CardContent className="flex items-center justify-center py-8">
    <CyberpunkSpinner size="md" />
  </CardContent>
</Card>
```

### Button Loading
```tsx
<Button loading={isSubmitting} loadingText="Processing...">
  Process Data
</Button>
```

### List Loading Skeleton
```tsx
<div className="space-y-4">
  <CardSkeleton count={3} />
</div>
```

## Future Enhancements

Potential improvements for future iterations:

1. **Progress Spinner:** Add percentage-based progress indicator
2. **Custom Colors:** Allow override of ring colors
3. **Animation Speed:** Configurable rotation speeds
4. **Glitch Intensity:** Variable glitch effect intensity
5. **Sound Effects:** Optional audio feedback (cyberpunk beeps/boops)
