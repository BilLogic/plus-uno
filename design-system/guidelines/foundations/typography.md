---
summary: Apply these classes to elements for consistent typography
---

<!-- Tier: 2 -->

# Typography Tokens

## Type scale in components

Component text takes a text style: `font: var(--heading-small)`, `var(--body-default)` and the rest of the Type Scale in `design-system/agent-views/tokens/tokens.md`. An icon glyph takes an icon size (`--icon-md`). `npm run check:font-size-literals` holds components and patterns to that.

- **Headings step one size per nesting level**, and the tag follows the nesting: the page's one `h1` is Heading/large 24, a section's `h2` Heading/medium 20, a subsection's `h3` Heading/small 16. `PatternSection` picks its level from `@/lib/headingLevel`; a page or a dialog is level 1.
- **Container titles are fixed**: a modal's is Heading/medium 20 and is the dialog's `h1`, named by `aria-labelledby`; a card's, a popup's and a flag's are Heading/xsmall 14, and a card's sits over a Body/default 14 description, tagged one level below its section.
- **Group labels** are Heading/xxsmall 12 and name a `role="group"` or a table head cell; they are never headings.
- **Button and tab labels** are Body/default at `--type-weight-medium`, with no separate button style. In Figma a weight change drops a node's text style, so a label carries none and binds Font size/0875, Line height/125, Family/body and Weight/medium instead.
- **Code is code-only**: `--code` has no Figma text style. A code sample in Figma docs is Source Code Pro bound to Font size/0875 and Line height/125.

- **A Jumbotron's title is the page's `h1`**, so a page that has one gives its `Surface` no `title`.

Still on the older layer: the deprecated Badge's `body*-txt` sizes, the `h5` brand mark in `DashboardLayout`, and the `h4` title `createModal` builds. The classes below are that layer, kept until every use moves.

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
| `.h4` | 24px | 600 | Legacy titles; a card title is Heading/xsmall 14 |
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
