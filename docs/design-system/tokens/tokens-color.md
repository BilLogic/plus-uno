<!-- Load for: color token application, semantic color selection, state layers, SMART framework colors -->

# Color Tokens

The PLUS Design System follows Material Design 3 color guidance.

## Color Token Naming Convention

Each color role has multiple variants:
- `--color-{role}` - Main color (for borders/backgrounds)
- `--color-{role}-text` - Text-safe version (use for text content)
- `--color-on-{role}` - Content color on filled backgrounds
- `--color-{role}-container` - Container/background version
- `--color-{role}-state-08/12/16` - State layers for hover/active states

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
