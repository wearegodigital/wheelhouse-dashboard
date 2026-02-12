# Loading Components - Quick Reference

Quick guide for using loading indicators in the Wheelhouse Dashboard.

## Choose the Right Component

| Scenario | Component | Example |
|----------|-----------|---------|
| General loading state | `CyberpunkSpinner` | Page sections, modals |
| Loading with message | `CyberpunkSpinnerText` | "Loading projects..." |
| Button action | `Button` with `loading` | Form submit, API calls |
| Content placeholder | `Skeleton` | Text, images, cards |
| List loading | `CardSkeleton` | Project/sprint/task lists |
| Inline loading | `CyberpunkSpinnerInline` | Small spaces, status indicators |

## Quick Examples

### Basic Spinner

```tsx
import { CyberpunkSpinner } from "@/components/ui/cyberpunk-spinner"

{isLoading && <CyberpunkSpinner />}
```

### Loading with Text

```tsx
import { CyberpunkSpinnerText } from "@/components/ui/cyberpunk-spinner"

{isLoading && (
  <CyberpunkSpinnerText text="Loading tasks..." size="md" />
)}
```

### Button Loading

```tsx
import { Button } from "@/components/ui/button"

<Button
  loading={isSubmitting}
  loadingText="Saving..."
  onClick={handleSubmit}
>
  Save Changes
</Button>
```

### Skeleton Placeholder

```tsx
import { Skeleton } from "@/components/ui/skeleton"

{isLoading ? (
  <div className="space-y-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-1/2" />
  </div>
) : (
  <Content />
)}
```

### List Loading

```tsx
import { CardSkeleton } from "@/components/ui/card-skeleton"

{isLoading ? (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <CardSkeleton count={6} />
  </div>
) : (
  <ProjectGrid projects={projects} />
)}
```

## Size Guide

### CyberpunkSpinner Sizes

```tsx
<CyberpunkSpinner size="sm" />  // 32px - Buttons, inline
<CyberpunkSpinner size="md" />  // 48px - Default, cards
<CyberpunkSpinner size="lg" />  // 64px - Modals, sections
<CyberpunkSpinner size="xl" />  // 96px - Full page
```

## Common Patterns

### Card with Loading State

```tsx
<Card>
  <CardContent className="flex items-center justify-center py-8">
    {isLoading ? (
      <CyberpunkSpinner />
    ) : (
      <DataContent />
    )}
  </CardContent>
</Card>
```

### Full Page Loading

```tsx
{isLoading ? (
  <div className="flex items-center justify-center h-screen">
    <CyberpunkSpinnerText text="Loading..." size="xl" />
  </div>
) : (
  <PageContent />
)}
```

### Inline Status

```tsx
<div className="flex items-center gap-2">
  <span>Processing</span>
  {isProcessing && <CyberpunkSpinner size="sm" />}
</div>
```

### Form Submission

```tsx
<form onSubmit={handleSubmit}>
  {/* form fields */}
  <Button type="submit" loading={isSubmitting}>
    Submit
  </Button>
</form>
```

## Tips

1. **Use size appropriately:**
   - `sm` for buttons and inline
   - `md` for cards and sections
   - `lg` for modals
   - `xl` for full page

2. **Add descriptive text:**
   - Use `CyberpunkSpinnerText` for better UX
   - Use `loadingText` prop on buttons

3. **Consistent patterns:**
   - Lists → `CardSkeleton`
   - Text → `Skeleton`
   - Actions → `Button` with `loading`
   - General → `CyberpunkSpinner`

4. **Accessibility:**
   - All components include proper ARIA labels
   - No additional work needed for screen readers

5. **Performance:**
   - All animations are CSS-based
   - GPU accelerated
   - No performance impact

## Color Scheme (Cyberpunk Theme)

- **Outer Ring:** Cyan glow
- **Middle Ring:** Magenta glow
- **Inner Ring:** Yellow glow
- **Shimmer:** Cyan → Magenta gradient

## Import Paths

```tsx
// Spinners
import {
  CyberpunkSpinner,
  CyberpunkSpinnerText,
  CyberpunkSpinnerInline
} from "@/components/ui/cyberpunk-spinner"

// Button
import { Button } from "@/components/ui/button"

// Skeletons
import { Skeleton } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/ui/card-skeleton"
```
