# Terminology Reference

Use this vocabulary consistently when describing implementation choices.

## Core Terms

- Element: Small reusable unit (button, input, badge).
- Card: Grouped content container.
- Section: Major page region.
- Table: Structured tabular layout.
- Modal: Overlay dialog surface.
- Spec: Higher-level composition in `packages/plus-ds/src/specs`.

## Common Prop Conventions

- Use `style` variants in PLUS components where applicable.
- Use `size` according to component API.
- Prefer DS component APIs over ad hoc prop names.

## Token Language

- Color tokens: `--color-*`
- Spacing/radius/border tokens: `--size-*`
- Typography tokens: `--font-*`
- Elevation tokens: `--elevation-*`

## Communication Rules

1. Use repository component names (`Button`, `Alert`, `Badge`, etc.) rather than generic substitutes.
2. When advising, cite concrete files.
3. If pattern intent is unclear, ask clarifying questions instead of inventing semantics.
