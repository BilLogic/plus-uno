---
summary: The PLUS Design System follows Material Design 3 color guidance
---

<!-- Tier: 2 -->

# Color Tokens

The PLUS Design System follows Material Design 3 color guidance.

## Color Token Naming Convention

Each color role has multiple variants:
- `--color-{role}` - Main color (for borders/backgrounds)
- `--color-{role}-text` - Text-safe version (use for text content)
- `--color-on-{role}` - Content color on filled backgrounds
- `--color-{role}-container` - Container/background version
- `--color-{role}-state-08/12/16` - State layers for hover/active states

**`-state-NN` names an overlay; it does not derive one.** The suffix reads as
"`--color-{role}` at 8/12/16%", and for 84 of the 117 overlays that is what it
is. For 33 of them — eleven bases × three steps — it is not: thirty are washed
from a different colour than the role they name, and three — the shadow steps —
name a role that has no token at all and are simply black. `--color-primary` is
`#0472a8` and `--color-primary-state-08` is 8% of `#00658e`: the solid was
re-picked in Figma without the wash following. Do not compute an overlay from
its base, and do not assume a `-state-NN` token and its role share channels.
The eleven bases are named in
`design-system/tests/tokens-node.test.js`, which fails on a twelfth and on a
base that gets re-mixed to agree; whether the solid or the wash is the intended
colour is a visible design change and belongs to #268.

## Accent Colors

| Role | Main Token | Text Token | Usage |
|------|------------|------------|-------|
| **Primary** | `--color-primary` | `--color-primary-text` | Primary actions, focus states |
| **Secondary** | `--color-secondary` | `--color-secondary-text` | Secondary actions |
| **Tertiary** | `--color-tertiary` | `--color-tertiary-text` | Accents, highlights |
| **Success** | `--color-success` | `--color-success-text` | Success states, confirmations |
| **Warning** | `--color-warning` | `--color-warning-text` | Warning states, cautions |
| **Danger** | `--color-danger` | `--color-danger-text` | Error states, destructive actions |
| **Info** | `--color-info` | `--color-info-text` | Informational (aliases to Tertiary) |

## SMART Framework Colors

| Competency | Token Prefix | Theme |
|------------|--------------|-------|
| Social-Emotional | `--color-social-emotional` | Gold/Yellow |
| Mastering Content | `--color-mastering-content` | Purple |
| Advocacy | `--color-advocacy` | Green |
| Relationship | `--color-relationship` | Pink/Magenta |
| Technology Tools | `--color-technology-tools` | Blue |

```jsx
<Badge style="social-emotional">Social-Emotional</Badge>
<Badge style="mastering-content">Mastering Content</Badge>
```

## Surface Colors

| Token | Usage |
|-------|-------|
| `--color-surface` | Main surface background |
| `--color-on-surface` | Text on surface |
| `--color-surface-container` | Container backgrounds |
| `--color-surface-container-high` | Elevated containers |
| `--color-outline` | Borders and dividers |
| `--color-outline-variant` | Subtle borders |

## State Layers

Use state layer tokens for interactive states:

```css
.my-element:hover {
  background-color: var(--color-primary-state-08);
}

.my-element:active {
  background-color: var(--color-primary-state-12);
}

.my-element:focus {
  background-color: var(--color-primary-state-16);
}
```

## Rules

1. **Use `-text` variants for text** - Always use `--color-{role}-text` for text content
2. **Use state layers for interaction** - Never hardcode hover/active colors
3. **Use `-container` for backgrounds** - Container tokens for subtle background fills
4. **Info equals Tertiary** - Info colors are aliases to Tertiary tokens
