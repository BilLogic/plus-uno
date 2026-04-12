<!-- Tier: 2 -->
<!-- Load for: typography token application, font families, font weights, heading/body sizing -->

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
