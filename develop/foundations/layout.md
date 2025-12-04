# Foundation: Layout

**Context**: Spacing principles, Radius rules, and Table tokens.
**Layer**: Foundation

## 1. Spacing Principles (Two-Tier System)
1.  **Primitives** (Infrastructure): `space-100`, `radius-50`. **NEVER USE DIRECTLY.**
2.  **Semantics** (Usage): `card-pad-md`, `section-gap-lg`. **ALWAYS USE THESE.**

**Rule**: Match the token to the context.
*   Building a Card? Use `card-*` tokens.
*   Building a Section? Use `section-*` tokens.

## 2. Radius Rules
**Core Principle**: Radius size matches padding size.
*   Small Padding -> Small Radius
*   Medium Padding -> Medium Radius

| Layer | Default Radius | Token |
| :--- | :--- | :--- |
| **Elements** | 4px | `var(--size-element-radius-sm)` |
| **Cards** | 12px | `var(--size-card-radius-sm)` |
| **Sections** | 8px | `var(--size-section-radius-sm)` |
| **Modals** | 6px | `var(--size-modal-radius-md)` |
| **Surfaces** | 16px | `var(--size-surface-radius)` |

## 3. Table Tokens
Use these for data tables.

| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-table-cell-x)` | 10px | Horizontal cell padding |
| `var(--size-table-cell-y)` | 8px | Vertical cell padding |
| `var(--size-table-cell-gap)` | 10px | Gap between cell content |
| `var(--size-table-radius-sm)` | 6px | Row radius (Dense) |
| `var(--size-table-radius-md)` | 8px | Row radius (Standard) |
