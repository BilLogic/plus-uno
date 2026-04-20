# Tokens Guide

<!-- ~350 tokens | Load for: token application rules and decision-making -->

## When to Load
- Load this for token-application rules and decision-making.
- For exact token file paths, source JSON, sync scripts, and env vars, load `.agent/assets/tokens-index.json`.

## Non-Negotiable Rules
- Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
- Choose semantic layer first (element/card/section/modal/table), then pick token.
- Use primitives only for token-definition work, not feature implementation.

## Semantic Layer Decision Tree

Pick the layer based on what you are styling:

- Atomic interactive control (button, input, badge) → **element** → `--size-element-*`
- Bounded content container (info card, data card) → **card** → `--size-card-*`
- Page region or column (sidebar, main content area) → **section** → `--size-section-*`
- Tabular data (rows, cells, headers) → **table** → `--size-table-*`
- Overlay or dialog (confirmation, detail panel) → **modal** → `--size-modal-*`

## Real Token Examples

**Spacing (semantic):**
- `var(--size-element-pad-x-lg)` — horizontal padding on an interactive element
- `var(--size-card-pad-x-md)` — horizontal padding inside a card
- `var(--size-section-gap-lg)` — gap between items in a section
- `var(--size-modal-radius-lg)` — border radius on a modal
- `var(--size-surface-pad-x)` — horizontal padding on a surface container

**Color:**
- `var(--color-primary)`, `var(--color-on-primary)` — primary action and its contrast text
- `var(--color-surface)`, `var(--color-on-surface)` — default surface and text
- `var(--color-surface-container)` — contained surface background
- `var(--color-danger)`, `var(--color-success)`, `var(--color-warning)` — semantic status
- `var(--color-primary-state-08)` — state layer at 8% opacity for hover/focus

**Typography:**
- `var(--font-family-header)`, `var(--font-family-body)`, `var(--font-family-code)`
- `var(--font-size-h1)`, `var(--font-size-body1)`, `var(--font-size-body2)`
- `var(--font-weight-semibold-1)`, `var(--font-weight-bold)`
- `var(--font-line-height-h1)`, `var(--font-line-height-body2)`

**Elevation:**
- `var(--elevation-light-1)` through `var(--elevation-light-5)` — progressive shadow depth

**Layout breakpoints:**
- `var(--breakpoint-md-min)`, `var(--breakpoint-lg-min)`, `var(--breakpoint-xl-min)`

## Quick Usage Pattern
- Correct: `var(--color-primary)`, `var(--size-card-pad-x-md)`, `var(--font-size-body1)`, `var(--elevation-light-2)`
- Incorrect: `#3B82F6`, `16px`, `0 2px 4px rgba(0,0,0,0.1)` in feature code.

## Maintenance Rule
- If token naming/values change via sync, update docs and references that depend on those names.
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
# Spacing Tokens

The PLUS Design System uses semantic spacing tokens organized by component hierarchy.

## Spacing Hierarchy

Match spacing token prefix to your component context:

| Context | Token Prefix | Usage |
|---------|--------------|-------|
| Elements | `--size-element-*` | Buttons, badges, inputs |
| Cards | `--size-card-*` | Card containers |
| Sections | `--size-section-*` | Page sections |
| Modals | `--size-modal-*` | Dialog windows |
| Tables | `--size-table-*` | Table cells and rows |

## Element Tokens

For buttons, badges, inputs, and other small components:

| Token | Value | Usage |
|-------|-------|-------|
| `--size-element-pad-x-sm` | 8px | Small horizontal padding |
| `--size-element-pad-x-md` | 12px | Medium horizontal padding |
| `--size-element-pad-x-lg` | 16px | Large horizontal padding |
| `--size-element-pad-y-sm` | 4px | Small vertical padding |
| `--size-element-pad-y-md` | 8px | Medium vertical padding |
| `--size-element-pad-y-lg` | 12px | Large vertical padding |
| `--size-element-gap-xs` | 4px | Extra small gap |
| `--size-element-gap-sm` | 8px | Small gap |
| `--size-element-gap-md` | 12px | Medium gap |
| `--size-element-gap-lg` | 16px | Large gap |
| `--size-element-radius-sm` | 4px | Small border radius |
| `--size-element-radius-md` | 6px | Medium border radius |
| `--size-element-radius-lg` | 8px | Large border radius |
| `--size-element-radius-full` | 999px | Pill shape |

## Card Tokens

For card containers and card content:

| Token | Value | Usage |
|-------|-------|-------|
| `--size-card-pad-x-sm` | 16px | Small card padding |
| `--size-card-pad-x-md` | 20px | Medium card padding |
| `--size-card-pad-x-lg` | 24px | Large card padding |
| `--size-card-gap-sm` | 12px | Gap between card items |
| `--size-card-gap-md` | 16px | Medium card gap |
| `--size-card-radius-sm` | 12px | Card border radius |

## Section Tokens

For page sections and large containers:

| Token | Value | Usage |
|-------|-------|-------|
| `--size-section-pad-x-lg` | 32px | Section horizontal padding |
| `--size-section-pad-y-lg` | 24px | Section vertical padding |
| `--size-section-gap-lg` | 24px | Gap between sections |
| `--size-section-gap-md` | 16px | Medium section gap |

## Usage Examples

```css
/* Element (button, badge) */
.my-button {
  padding: var(--size-element-pad-y-md) var(--size-element-pad-x-md);
  border-radius: var(--size-element-radius-md);
  gap: var(--size-element-gap-sm);
}

/* Card */
.my-card {
  padding: var(--size-card-pad-x-md);
  border-radius: var(--size-card-radius-sm);
  gap: var(--size-card-gap-md);
}

/* Section */
.my-section {
  padding: var(--size-section-pad-y-lg) var(--size-section-pad-x-lg);
  gap: var(--size-section-gap-lg);
}
```

## Rules

1. **Match token to context** - Use element tokens for elements, card tokens for cards
2. **Never hardcode spacing** - Always use CSS variables
3. **Use semantic sizes** - sm/md/lg based on visual density needed
4. **Maintain hierarchy** - Larger containers use larger spacing values
# Typography Tokens

## Font Families

| Usage | Token | Font |
|-------|-------|------|
| Headlines (H1-H6) | `--font-family-header` | Lato |
| Body Text (B1-B3) | `--font-family-body` | Merriweather Sans |
| Code | `--font-family-code` | Source Code Pro |

## Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-normal` | 300 | Regular body text |
| `--font-weight-semibold-1` | 400 | Semibold text, badges |
| `--font-weight-semibold-2` | 600 | Title text (H4-H6) |
| `--font-weight-bold` | 700 | Headlines (H1-H3) |

## Typography Classes

Apply these classes to elements for consistent typography:

### Headlines
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.h1` | 40px | 700 | Major headings |
| `.h2` | 32px | 700 | Section headings |
| `.h3` | 28px | 700 | Subsection headings |
| `.h4` | 24px | 600 | Card titles |
| `.h5` | 20px | 600 | List titles |
| `.h6` | 16px | 600 | Small titles |

### Body Text
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.body1-txt` | 16px | 300 | Standard body text |
| `.body2-txt` | 14px | 300 | Secondary text |
| `.body3-txt` | 12px | 300 | Captions, small text |

### Weight Modifiers
| Class | Effect |
|-------|--------|
| `.font-weight-semibold` | Applies weight 400 |
| `.font-weight-bold` | Applies weight 700 |

## Component Typography

Components automatically apply appropriate typography based on size prop:

```jsx
// Headlines use Lato Bold
<Badge size="h1">Large Badge</Badge>

// Body sizes use Merriweather Sans Semibold
<Badge size="b2">Default Badge</Badge>
```

## Usage Examples

```jsx
// Direct class usage
<p className="body1-txt">Standard paragraph text</p>
<h2 className="h2">Section Heading</h2>

// Component with size prop
<Button size="medium">Medium Button</Button>  // Uses h6 typography
<Button size="small">Small Button</Button>    // Uses body3-txt
```

## Rules

1. **Do not hardcode font values** - Always use typography tokens or classes
2. **Match size to hierarchy** - Use h1-h6 for structural headings, b1-b3 for content
3. **Body text is light (300)** - Regular body uses light weight for readability
4. **Headlines are bold (700)** - H1-H3 use bold weight for emphasis
# Elevation Tokens

Elevation creates visual hierarchy through shadows.

## Elevation Levels

| Token | Usage |
|-------|-------|
| `--elevation-none` | No shadow - flat elements |
| `--elevation-sm` | Subtle lift - cards, dropdowns |
| `--elevation-md` | Moderate lift - modals, popovers |
| `--elevation-lg` | High lift - overlay dialogs |

## Shadow Values

```css
--elevation-none: none;
--elevation-sm: 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06);
--elevation-md: 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06);
--elevation-lg: 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.06);
```

## Usage

```css
.my-card {
  box-shadow: var(--elevation-sm);
}

.my-modal {
  box-shadow: var(--elevation-md);
}

.my-dropdown {
  box-shadow: var(--elevation-sm);
}
```

## Elevation Hierarchy

| Component Type | Recommended Elevation |
|----------------|----------------------|
| Flat elements | `none` |
| Cards | `sm` |
| Dropdowns | `sm` |
| Modals | `md` |
| Dialogs | `md` to `lg` |

## Rules

1. **Use sparingly** - Elevation should create meaningful hierarchy
2. **Match to context** - Higher elevation for more important overlays
3. **Never hardcode shadows** - Always use elevation tokens
