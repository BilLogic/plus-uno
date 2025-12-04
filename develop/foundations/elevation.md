# Foundation: Elevation

**Context**: Shadow tokens for depth and hierarchy.
**Layer**: Foundation

## 1. Elevation Tokens
| Token | Usage | Context |
| :--- | :--- | :--- |
| `var(--elevation-light-1)` | **Cards (Rest)** | Subtle depth for standard cards. |
| `var(--elevation-light-2)` | **Cards (Hover)** | Interactive state for cards. |
| `var(--elevation-light-3)` | **Modals (Standard)** | Dialogs, Popups. |
| `var(--elevation-light-4)` | **Modals (Prominent)** | Important overlays. |
| `var(--elevation-light-5)` | **Modals (Critical)** | Critical alerts. |

## 2. Usage Example
```css
.plus-card {
    box-shadow: var(--elevation-light-1);
    transition: box-shadow 0.2s ease;
}

.plus-card:hover {
    box-shadow: var(--elevation-light-2);
}
```
