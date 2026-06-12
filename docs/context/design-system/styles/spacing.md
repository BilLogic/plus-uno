<!-- Tier: 2 -->

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
