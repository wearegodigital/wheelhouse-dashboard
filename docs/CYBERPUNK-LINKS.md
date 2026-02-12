# Cyberpunk Link Styles

Neon link effects with animated underlines, electric glow, and optional glitch animations.

## Default Behavior

All `<a>` and `[role="link"]` elements get:
- Cyan neon color with subtle glow
- Animated gradient underline on hover
- Enhanced glow on hover and active states
- Dimmed visited state with accent tint

## Variants

### `.cyber-nav`
Subtle navigation links with foreground color and thicker underline.

```tsx
<Link href="/projects" className="cyber-nav">Projects</Link>
```

### `.cyber-button`
Button-style link with background, border, and lift effect.

```tsx
<Link href="/signup" className="cyber-button">Get Started</Link>
```

### `.cyber-card-link`
Wrapper link that inherits color and suppresses underline.

```tsx
<Link href="/project/123" className="cyber-card-link">
  <Card>...</Card>
</Link>
```

### `.glitch-link`
Adds subtle horizontal shake animation every 5s.

```tsx
<Link href="/easter-egg" className="glitch-link">Secret</Link>
```

## Accessibility

Focus states have outline with electric glow. Disabled links (`.disabled` or `aria-disabled="true"`) have 50% opacity and no pointer events.

```tsx
<Link href="#" aria-disabled="true">Coming Soon</Link>
```
