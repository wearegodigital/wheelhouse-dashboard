# Cyberpunk Theme - Quick Test Checklist

**Quick 15-minute smoke test for the cyberpunk theme**

## Setup (1 min)
```bash
pnpm dev
```
- [ ] Server starts on http://localhost:3000
- [ ] No console errors

## Enable Cyberpunk Theme (30 sec)
- [ ] Click theme toggle (top right)
- [ ] Select "Cyberpunk"
- [ ] Glitch transition plays
- [ ] UI updates to neon colors

---

## Route Testing (10 min)

### 1. /auth/login (1 min)
- [ ] Input field has neon border on focus
- [ ] Button glows on hover
- [ ] Text readable on dark background

### 2. /projects (1.5 min)
- [ ] Page title has neon glow
- [ ] Project cards have glowing borders
- [ ] Cards glow more on hover
- [ ] "New Project" button glows
- [ ] Activity feed loads with cyberpunk spinner

### 3. /projects/new (1.5 min)
- [ ] Chat interface themed
- [ ] Input has neon border
- [ ] Messages styled
- [ ] Loading shows cyberpunk spinner

### 4. /projects/[id] (1 min)
- [ ] Sprint cards themed
- [ ] Status badges use cyberpunk colors
- [ ] Run/Pause/Cancel buttons glow

### 5. /sprints/[id] (1 min)
- [ ] Task list themed
- [ ] Agent timeline has neon effects
- [ ] Filters styled

### 6. /tasks (1 min)
- [ ] Task list/table themed
- [ ] Row hover effects work
- [ ] Filters styled

### 7. /tasks/[id] (1.5 min)
- [ ] Task detail header glows
- [ ] Agent timeline styled
- [ ] Comments section themed
- [ ] Event log readable

### 8. /settings (1.5 min)
- [ ] Form inputs have neon borders
- [ ] Checkboxes/radios custom styled
- [ ] Save buttons glow
- [ ] Sections have cyberpunk borders

---

## Theme Toggle Testing (2 min)

- [ ] **Cyberpunk → Light:** Glitch transition, colors change
- [ ] **Light → Cyberpunk:** Glitch transition, neon activates
- [ ] **Cyberpunk → Dark:** Glitch transition, glows fade
- [ ] **Dark → Cyberpunk:** Glitch transition, glows appear

---

## Animation Check (1.5 min)

- [ ] Open DevTools → Performance
- [ ] Record 5 seconds
- [ ] Stop recording
- [ ] FPS ≥ 55fps
- [ ] No dropped frames during hover

---

## Critical Features (1 min)

- [ ] Headings have neon glow
- [ ] Links have underline animation
- [ ] Buttons show loading spinner
- [ ] Skeletons have shimmer effect
- [ ] Toast notifications (trigger one) have neon glow

---

## Quick Issues Check (30 sec)

- [ ] Text is readable everywhere
- [ ] No color clashing
- [ ] No broken layouts
- [ ] Animations smooth
- [ ] Theme persists on page reload

---

## Result

**Date:** ___________
**Tester:** ___________
**Build:** ___________

- [ ] **PASS** - All checks passed
- [ ] **FAIL** - Critical issues found
- [ ] **CONDITIONAL PASS** - Minor issues found

**Notes:**

