<!-- Tier: 2 -->

# Accessibility

WCAG 2.1 AA is the minimum bar for all PLUS interfaces.

## Context

Tutors use PLUS on laptops during live sessions, often while screensharing with students. Interfaces must remain legible at varying zoom levels and perform well under assistive technology.

## Color Contrast

- Body text and labels: minimum 4.5:1 contrast ratio against background.
- Large text (18px+ or 14px+ bold) and UI components (borders, icons): minimum 3:1.
- Never rely on color alone to convey meaning — pair with icons, text, or patterns.

## Touch and Click Targets

- All interactive elements: minimum 44x44px hit area.
- Spacing between adjacent targets: at least 8px to prevent mis-taps.

## Keyboard Navigation

- Every interactive element must be reachable and operable via keyboard.
- Tab order follows visual reading order (left-to-right, top-to-bottom).
- Custom widgets implement appropriate ARIA keyboard patterns (arrow keys for menus, Escape to close modals).

## Screen Readers

- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<table>`) before reaching for ARIA.
- Custom components get descriptive `aria-label` or `aria-labelledby` attributes.
- Dynamic content updates use `aria-live` regions so screen readers announce changes.

## Motion and Animation

- Respect `prefers-reduced-motion` — disable or simplify all non-essential animation.
- Never convey essential information solely through motion or animation.
- Transitions should be short (under 300ms) and purposeful.

## Focus Management

- Visible focus indicators on all interactive elements — never remove the outline without replacing it.
- When modals or drawers open, move focus into them; on close, return focus to the trigger.
- Skip-links available for page-level navigation.

## Forms

- Every input has a visible, associated `<label>`.
- Error states provide clear text explaining what went wrong and how to fix it.
- Required fields are marked explicitly (not just by color or asterisk alone).
- Group related fields with `<fieldset>` and `<legend>`.
