# Cyberpunk Theme Manual Testing Guide

## Overview

This guide provides a comprehensive checklist for manually testing the cyberpunk theme across all routes in the Wheelhouse Dashboard. Use this document to systematically verify all components render correctly and animations perform well.

## Setup

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Open browser to: `http://localhost:3000`

3. Enable the cyberpunk theme:
   - Click the theme toggle button (top right)
   - Select "Cyberpunk" from the dropdown menu

## Theme Features to Verify

### Visual Elements
- [ ] Neon cyan/magenta/yellow color palette
- [ ] Glowing text shadows on headings
- [ ] Cyberpunk border effects (glowing borders)
- [ ] Dark background with neon accents
- [ ] Proper contrast for readability

### Animations
- [ ] Theme transition effect (glitch animation when switching to/from cyberpunk)
- [ ] Smooth transitions between theme states
- [ ] Loading spinners with rotating neon rings
- [ ] Hover effects with glow amplification
- [ ] Skeleton loading with shimmer effect

### Performance
- [ ] Animations run smoothly (60fps)
- [ ] No layout shifts during theme changes
- [ ] GPU-accelerated animations (check DevTools Performance)
- [ ] No memory leaks with repeated theme toggling

---

## Route-by-Route Testing Checklist

### 1. /auth/login (Authentication Page)

**Theme Elements:**
- [ ] Login form renders with cyberpunk styling
- [ ] Input fields have neon borders and glow effects
- [ ] Input focus states show animated glow
- [ ] Submit button has cyberpunk hover effects
- [ ] Background gradient/grid visible
- [ ] Logo/branding has appropriate theming

**Interactions:**
- [ ] Hover over input fields - border glow intensifies
- [ ] Focus input field - animated neon glow pulse
- [ ] Hover over submit button - glow and shadow effects
- [ ] Error states show with cyberpunk styling
- [ ] Loading state (if applicable) uses cyberpunk spinner

**Visual Issues:**
- [ ] Text is readable against dark background
- [ ] No color clashing or jarring contrasts
- [ ] Proper spacing and alignment maintained

---

### 2. /projects (Main Dashboard - Project List)

**Theme Elements:**
- [ ] Page header with neon glow on title
- [ ] Project cards have cyberpunk borders
- [ ] Status badges use cyberpunk colors
- [ ] Search/filter inputs have neon styling
- [ ] Create Project button has glow effects
- [ ] Empty state (if no projects) styled appropriately

**Card Hover Effects:**
- [ ] Cards glow on hover
- [ ] Shine/shimmer effect visible
- [ ] Border glow intensifies
- [ ] Smooth transition (0.3s)

**Loading States:**
- [ ] Initial page load shows cyberpunk skeletons
- [ ] Loading spinner if fetching data
- [ ] Skeleton cards have shimmer animation

**Interactive Elements:**
- [ ] Filter dropdowns have cyberpunk styling
- [ ] Pagination controls (if present) themed
- [ ] Sort buttons have glow effects
- [ ] Links have underline animation on hover

**Visual Issues:**
- [ ] Grid layout maintains proper spacing
- [ ] Text remains readable on all card states
- [ ] Icons maintain proper contrast

---

### 3. /projects/new (Create Project with Planning Chat)

**Theme Elements:**
- [ ] Page title has neon glow
- [ ] Chat interface has cyberpunk borders
- [ ] Message bubbles styled with theme
- [ ] Input field has neon border
- [ ] Send button has glow effect
- [ ] Planning recommendations panel themed

**Chat Interface:**
- [ ] User messages have distinct styling
- [ ] AI messages have different accent
- [ ] Timestamps readable
- [ ] Code blocks (if any) have cyberpunk syntax highlighting
- [ ] Scrollbar themed (if custom)

**Form Elements:**
- [ ] Project name input has neon focus glow
- [ ] Description textarea styled
- [ ] Configuration dropdowns themed
- [ ] Checkboxes/radios have custom cyberpunk styling
- [ ] Submit button glows on hover

**Loading States:**
- [ ] Message sending shows inline spinner
- [ ] AI response loading shows cyberpunk spinner
- [ ] Stream typing indicator (if present) themed

**Interactive Elements:**
- [ ] Hover over recommendations - glow effect
- [ ] Click to accept recommendation - visual feedback
- [ ] Decomposition preview cards have cyber-card styling

**Visual Issues:**
- [ ] Chat messages don't overflow container
- [ ] Long text wraps properly
- [ ] Animations don't cause layout shift

---

### 4. /projects/[id] (Project Detail with Sprints)

**Theme Elements:**
- [ ] Project header with neon title
- [ ] Status indicator has cyberpunk glow
- [ ] Sprint list cards themed
- [ ] Progress bars have neon effects
- [ ] Action buttons (Run/Pause/Cancel) glowing
- [ ] Tabs/navigation have cyberpunk styling

**Sprint Cards:**
- [ ] Card borders glow
- [ ] Hover effect with shine sweep
- [ ] Status badges use theme colors
- [ ] Task count indicators themed
- [ ] Links have neon underline animation

**Execution Controls:**
- [ ] Run button has primary neon glow
- [ ] Pause button has accent glow
- [ ] Cancel button has warning/destructive glow
- [ ] Loading states show spinner in button
- [ ] Disabled states appropriately dimmed

**Data Display:**
- [ ] Tables (if present) have cyberpunk borders
- [ ] Metrics/stats cards have glow effects
- [ ] Charts/graphs (if present) use cyberpunk colors
- [ ] Timeline/activity feed themed

**Loading States:**
- [ ] Sprint list loading shows skeletons
- [ ] Execution status updates in real-time
- [ ] Progress indicators pulse with neon

**Visual Issues:**
- [ ] Sprint grid maintains responsive layout
- [ ] Text contrast sufficient on all backgrounds
- [ ] Icons properly colored and visible

---

### 5. /sprints/[id] (Sprint Detail with Tasks)

**Theme Elements:**
- [ ] Sprint header with neon title
- [ ] Task list cards have cyberpunk styling
- [ ] Task status indicators glow
- [ ] Agent timeline has neon effects
- [ ] Execution controls themed

**Task Cards:**
- [ ] Border glow on hover
- [ ] Shine effect visible
- [ ] Priority indicators use cyberpunk colors
- [ ] Assignee badges themed
- [ ] Task type icons visible with glow

**Agent Timeline:**
- [ ] Timeline line has neon color
- [ ] Event markers glow
- [ ] Step indicators animated
- [ ] Progress checkpoints pulse
- [ ] Timestamps readable

**Filters & Controls:**
- [ ] Status filter dropdown themed
- [ ] Search input has neon border
- [ ] Sort controls have glow
- [ ] Bulk action buttons themed

**Loading States:**
- [ ] Task list loading shows skeletons
- [ ] Agent timeline loading indicator
- [ ] Real-time updates smooth

**Visual Issues:**
- [ ] Task list scrolls smoothly
- [ ] Timeline doesn't overflow
- [ ] Dense information remains readable

---

### 6. /tasks (All Tasks - Flat View)

**Theme Elements:**
- [ ] Page header with neon title
- [ ] Filter panel has cyberpunk borders
- [ ] Task table/list themed
- [ ] Pagination controls styled
- [ ] Bulk selection indicators glow

**Task Table/List:**
- [ ] Table headers have neon text
- [ ] Row hover effects (glow)
- [ ] Cell borders themed
- [ ] Status columns use cyberpunk colors
- [ ] Action buttons glow

**Filters:**
- [ ] Multiple filter inputs themed
- [ ] Dropdowns have cyberpunk styling
- [ ] Date pickers (if present) themed
- [ ] Clear filters button has glow
- [ ] Active filter chips/tags styled

**Bulk Actions:**
- [ ] Checkbox selection styled
- [ ] Selected row highlighting
- [ ] Bulk action bar themed
- [ ] Confirmation modals cyberpunk styled

**Loading States:**
- [ ] Table loading shows skeletons
- [ ] Pagination loading indicator
- [ ] Filter application shows feedback

**Visual Issues:**
- [ ] Table responsive on smaller screens
- [ ] Long task names truncate properly
- [ ] Scrolling smooth with many rows

---

### 7. /tasks/[id] (Task Detail with Agent Timeline)

**Theme Elements:**
- [ ] Task header with neon title
- [ ] Status badge glows
- [ ] Description section themed
- [ ] Agent timeline has cyberpunk styling
- [ ] Comments section themed
- [ ] Event log has neon effects

**Agent Timeline:**
- [ ] Step-by-step progression styled
- [ ] Current step highlighted with glow
- [ ] Completed steps have success glow
- [ ] Failed steps have error glow
- [ ] Agent cards have cyber-card effect

**Event Log:**
- [ ] Event items have borders
- [ ] Timestamps readable
- [ ] Event types color-coded
- [ ] Payload data formatted
- [ ] Expandable sections themed

**Comments Section:**
- [ ] Comment input has neon border
- [ ] Submit button glows
- [ ] Comment cards themed
- [ ] User avatars/names styled
- [ ] Loading spinner when posting

**Metadata:**
- [ ] Created/updated timestamps
- [ ] Assignee information
- [ ] Tags/labels cyberpunk styled
- [ ] Related links have underline animation

**Loading States:**
- [ ] Page load shows skeleton
- [ ] Comment loading indicator
- [ ] Event streaming updates

**Visual Issues:**
- [ ] Timeline scrolls smoothly
- [ ] Long events truncate/expand properly
- [ ] Code snippets in events readable

---

### 8. /settings (Settings Page)

**Theme Elements:**
- [ ] Settings sections have cyberpunk borders
- [ ] Input fields themed
- [ ] Toggle switches have neon effect
- [ ] Save buttons glow
- [ ] Section headers have text glow

**Form Controls:**
- [ ] Text inputs - neon border on focus
- [ ] Textareas styled
- [ ] Select dropdowns themed
- [ ] Radio buttons custom styled
- [ ] Checkboxes custom styled
- [ ] Range sliders have neon track

**API Keys Section:**
- [ ] Key input/display themed
- [ ] Generate button has glow
- [ ] Copy button cyberpunk styled
- [ ] Revoke button has destructive glow
- [ ] Success/error states themed

**Team Settings:**
- [ ] Member list cards styled
- [ ] Role badges cyberpunk colored
- [ ] Invite button glows
- [ ] Remove actions themed

**Theme Toggle:**
- [ ] Theme selector dropdown themed
- [ ] Current theme highlighted
- [ ] Preview cards (if present) styled
- [ ] Apply button glows

**Loading States:**
- [ ] Settings load skeleton
- [ ] Save action shows spinner
- [ ] Success feedback animated

**Visual Issues:**
- [ ] Form layout maintains spacing
- [ ] Labels properly aligned
- [ ] Help text readable

---

## Cross-Page Components to Test

### Navigation/Header
- [ ] Logo area themed
- [ ] Navigation links have hover underline
- [ ] Active route indicator glows
- [ ] User menu dropdown themed
- [ ] Notifications (if present) styled
- [ ] Theme toggle shows correct icon (Zap ⚡)

### Sidebar (if present)
- [ ] Sidebar background cyberpunk colored
- [ ] Menu items have hover effects
- [ ] Icons properly colored
- [ ] Collapse/expand animation smooth
- [ ] Active item highlighted with glow

### Footer (if present)
- [ ] Footer text readable
- [ ] Links have neon underline
- [ ] Copyright/legal text styled

### Modals/Dialogs
- [ ] Modal backdrop themed
- [ ] Modal content has cyberpunk borders
- [ ] Close button styled
- [ ] Modal buttons glow
- [ ] Form modals fully themed

### Toast Notifications
- [ ] Success toasts have green neon glow
- [ ] Error toasts have red neon glow
- [ ] Info toasts have cyan glow
- [ ] Warning toasts have yellow/magenta glow
- [ ] Toast animations smooth
- [ ] Close button themed

### Dropdowns
- [ ] Dropdown menu has cyberpunk border
- [ ] Menu items hover with glow
- [ ] Selected item highlighted
- [ ] Disabled items dimmed
- [ ] Menu animations smooth

---

## Theme Toggle Testing

### Switching Between Themes

**Light → Cyberpunk:**
- [ ] Fade transition plays
- [ ] Colors change smoothly
- [ ] No layout shift
- [ ] All elements update

**Dark → Cyberpunk:**
- [ ] Fade transition plays
- [ ] Neon effects activate
- [ ] Glows appear smoothly
- [ ] Performance remains good

**Cyberpunk → Light:**
- [ ] Glitch transition plays
- [ ] Neon effects fade out
- [ ] Colors transition smoothly
- [ ] Layout stable

**Cyberpunk → Dark:**
- [ ] Glitch transition plays
- [ ] Glows fade appropriately
- [ ] Dark theme applies correctly
- [ ] No visual artifacts

**System → Cyberpunk:**
- [ ] Respects system preference initially
- [ ] Cyberpunk overrides correctly
- [ ] Transition appropriate for source theme

**Rapid Toggling:**
- [ ] No broken states
- [ ] Transitions queue properly
- [ ] Performance doesn't degrade
- [ ] No memory leaks

---

## Animation Performance Testing

### GPU Acceleration Check
1. Open Chrome DevTools
2. Go to Performance tab
3. Enable "Enable advanced paint instrumentation"
4. Record interaction
5. Verify:
   - [ ] Animations use Compositing layer
   - [ ] FPS stays above 55
   - [ ] No forced synchronous layouts

### Loading Animations
- [ ] Cyberpunk spinner rotates smoothly
- [ ] Three rings rotate at different speeds
- [ ] Glitch effect flashes periodically
- [ ] Pulse effect smooth
- [ ] Skeletons shimmer consistently

### Hover Animations
- [ ] Card glow transitions smooth (0.3s)
- [ ] Link underline grows smoothly
- [ ] Button glows don't stutter
- [ ] Multiple simultaneous hovers perform well

### Reduced Motion
1. Enable "Reduce motion" in system preferences
2. Verify:
   - [ ] Animations significantly reduced
   - [ ] Essential animations < 0.01ms
   - [ ] No dizzying effects
   - [ ] Functionality preserved

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Focus indicators visible (neon outline)
- [ ] All interactive elements reachable
- [ ] Modals trap focus correctly
- [ ] Escape closes modals/dropdowns

### Screen Reader
- [ ] Loading states announced
- [ ] Theme change announced
- [ ] Status changes announced
- [ ] Proper ARIA labels on spinners
- [ ] Decorative elements hidden

### Contrast
- [ ] Foreground/background meets WCAG AA
- [ ] Headings readable against dark background
- [ ] Links distinguishable
- [ ] Status indicators discernible
- [ ] Error states clearly visible

---

## Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] Animations smooth
- [ ] Colors correct

### Firefox
- [ ] All features work
- [ ] Animations smooth
- [ ] Colors correct
- [ ] CSS variables supported

### Safari
- [ ] All features work
- [ ] Webkit animations work
- [ ] Colors correct
- [ ] Glow effects render

---

## Responsive Testing

### Desktop (1920x1080)
- [ ] Layout uses full width appropriately
- [ ] Cards in grids properly spaced
- [ ] No excessive whitespace

### Laptop (1366x768)
- [ ] Layout adapts
- [ ] All content accessible
- [ ] Animations still performant

### Tablet (768px)
- [ ] Mobile layout if implemented
- [ ] Touch targets adequate
- [ ] Animations still smooth

### Mobile (375px)
- [ ] Fully responsive
- [ ] Text readable
- [ ] Buttons touch-friendly
- [ ] Performance good on mobile GPU

---

## Known Issues Template

Use this section to document any issues found:

### Issue #1
- **Page:**
- **Component:**
- **Description:**
- **Severity:** (Critical/High/Medium/Low)
- **Steps to Reproduce:**
  1.
  2.
  3.
- **Expected:**
- **Actual:**
- **Screenshot:**

---

## Test Completion Checklist

- [ ] All routes tested
- [ ] All theme combinations verified
- [ ] Animation performance validated
- [ ] Accessibility verified
- [ ] Browser compatibility checked
- [ ] Responsive behavior confirmed
- [ ] Issues documented
- [ ] Screenshots/recordings captured (if needed)
- [ ] Test results reported

---

## Quick Visual Inspection Checklist

For rapid smoke testing after changes:

1. **Theme Toggle** (30s)
   - [ ] Switch to cyberpunk - transition plays
   - [ ] UI updates completely
   - [ ] Switch back - transition plays

2. **Loading States** (1min)
   - [ ] Visit /projects - spinner appears
   - [ ] Visit /tasks - skeleton loads
   - [ ] Check one button loading state

3. **Hover Effects** (1min)
   - [ ] Hover card - glow appears
   - [ ] Hover link - underline animates
   - [ ] Hover button - glow intensifies

4. **Forms** (1min)
   - [ ] Focus input - neon border glows
   - [ ] Type in textarea - styled correctly
   - [ ] Click checkbox - cyberpunk checked state

5. **Performance** (30s)
   - [ ] Scroll page - smooth 60fps
   - [ ] Open DevTools - check FPS counter
   - [ ] Toggle theme rapidly - no crash

**Total Time:** ~4 minutes for smoke test

---

## Sign-Off

**Tester:** ___________________________
**Date:** ___________________________
**Build/Commit:** ___________________________
**Result:** [ ] PASS  [ ] FAIL  [ ] PASS WITH ISSUES

**Notes:**

