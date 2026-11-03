---
summary: Apply these classes to elements for consistent typography
---

<!-- Tier: 2 -->

# Typography Tokens

## Type scale in components

Component text takes a text style: `font: var(--heading-small)`, `var(--body-default)` and the rest of the Type Scale in `design-system/agent-views/tokens/tokens.md`. An icon glyph takes an icon size (`--icon-md`). `npm run check:font-size-literals` holds components and patterns to that.

- **Headings step one size per nesting level**, and the tag follows the nesting: the page's one `h1` is Heading/large 24, a section's `h2` Heading/medium 20, a subsection's `h3` Heading/small 16. `PatternSection` picks its level from `@/lib/headingLevel`; a page or a dialog is level 1.
- **Container titles are fixed**: a modal's is Heading/medium 20 and is the dialog's `h1`, named by `aria-labelledby`; a card's, a popup's and a flag's are Heading/xsmall 14, and a card's sits over a Body/default 14 description, tagged one level below its section. Card and PatternCard read the card title's type from one mixin, `card-title-type` in `design-system/src/styles/_card-title.scss`, so a size change is that one edit.
- **Group labels** are Heading/xxsmall 12 and name a `role="group"` or a table head cell; they are never headings.
- **Button and Tab group labels** are Body/default at `--type-weight-medium`, with no separate button style.
- **A Sidebar tab's label is Body/default at regular weight**: a Sidebar tab is a navigation row, not a tab in a Tab group.
- **Code has no Figma style**: `--code` is code-only.
- Binding a weighted label or a code sample in Figma: `design-system/guidelines/figma/token-mapping.md` § Text that carries no style.

- **A Jumbotron's title is the page's `h1`**, so a page that has one gives its `Surface` no `title`.

Still on the older layer: the deprecated Badge's `body*-txt` sizes, the `h5` brand mark in `DashboardLayout`, and the `h4` title `createModal` builds. The classes below are that layer, kept until every use moves.

## Font Families

| Usage | Token | Font |
|-------|-------|------|
| Headings 32 to 20 (Heading xxlarge to medium) | `--type-family-heading-serif` | Noto Serif, weight 500 |
| Headings 16 to 12, metrics (tabular numbers) | `--type-family-heading` (older name `--font-family-header`) | Noto Sans, weight 600 |
| Body text | `--type-family-body` (older name `--font-family-body`) | Noto Sans, weight 400 and 500 |
| Code | `--type-family-code` (older name `--font-family-code`) | Noto Sans Mono |
| Brand headings and body | `--type-family-brand-heading`, `--type-family-brand-body` | Noto Serif, Noto Sans |

Letter spacing is `-0.02em` at 32 and `-0.01em` at 28 and 24, set beside the
`font` shorthand from `--heading-xxlarge-tracking` and its siblings; everything
20 and under is 0. A quote takes the body family. Fraunces is not part of the
system. Tuning notes: Foundations/Typography in Storybook.

## Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-normal` | 400 | Regular body text |
| `--font-weight-semibold-1` | 500 | Medium text, badges |
| `--font-weight-semibold-2` | 600 | Small titles (H6) and Noto Sans headings 16 and under |
| `--font-weight-bold` | 700 | Emphasis inside body text (`.font-weight-bold`) |
| `--font-weight-headline`, `--font-weight-title` | 500 | Noto Serif headings (H1-H5) |

## Typography Classes

Apply these classes to elements for consistent typography:

### Headlines
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.h1` | 40px | 500, Noto Serif | Major headings |
| `.h2` | 32px | 500, Noto Serif | Section headings |
| `.h3` | 28px | 500, Noto Serif | Subsection headings |
| `.h4` | 24px | 500, Noto Serif | Legacy titles; a card title is Heading/xsmall 14 |
| `.h5` | 20px | 500, Noto Serif | List titles |
| `.h6` | 16px | 600, Noto Sans | Small titles |

### Body Text
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `.body1-txt` | 16px | 400 | Standard body text |
| `.body2-txt` | 14px | 400 | Secondary text |
| `.body3-txt` | 12px | 400 | Captions, small text |

### Weight Modifiers
| Class | Effect |
|-------|--------|
| `.font-weight-semibold` | Applies weight 400 |
| `.font-weight-bold` | Applies weight 700 |

## Component Typography

Components automatically apply appropriate typography based on size prop:

```jsx
// Headlines use Noto Sans
<Badge size="h1">Large Badge</Badge>

// Body sizes use Noto Sans medium
<Badge size="b2">Default Badge</Badge>
```

## Usage Examples

```jsx
// Direct class usage
<p className="body1-txt">Standard paragraph text</p>
<h2 className="h2">Section Heading</h2>

// Component with size prop
<Button appearance="primary">Medium Button</Button>  // Uses h6 typography
<Button appearance="primary" spacing="compact">Small Button</Button>    // Uses body3-txt
```

## Rules

1. **Do not hardcode font values** - Always use typography tokens or classes
2. **Match size to hierarchy** - Use h1-h6 for structural headings, b1-b3 for content
3. **Body text is regular (400)** - labels and emphasis use medium (500)
4. **Headings 20 and up are Noto Serif at 500** - `.h1`-`.h5`, `--font-family-headline` and `--font-family-title`; `.h6` and below are Noto Sans at 600
