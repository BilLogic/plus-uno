# Typography

## Font Families

- `--font-family-header` - "Lato" (Used for headings, titles, and display text)
- `--font-family-body` - "Merriweather Sans", "Open Sans", "sans-serif" (Used for body text)
- `--font-family-code` - "Source Code Pro", "sans-serif" (Used for code blocks)

## Font Weights

- `--font-weight-normal` - 300 (Light)
- `--font-weight-semibold-1` - 400 (Regular/Semibold)
- `--font-weight-semibold-2` - 600 (Semibold)
- `--font-weight-bold` - 700 (Bold)

## Display Styles

### Display 1
- Font Family: Lato
- Font Size: `--font-size-display1` - 80px (5rem)
- Font Weight: 400 (Regular)
- Line Height: `--font-line-height-display1` - 140%
- Letter Spacing: `--font-letter-spacing-display1` - 0
- Class: `.display1-txt`

### Display 2
- Font Family: Lato
- Font Size: `--font-size-display2` - 72px (4.5rem)
- Font Weight: 400 (Regular)
- Line Height: `--font-line-height-display2` - 138.9%
- Letter Spacing: `--font-letter-spacing-display2` - 0
- Class: `.display2-txt`

### Display 3
- Font Family: Lato
- Font Size: `--font-size-display3` - 64px (4rem)
- Font Weight: 400 (Regular)
- Line Height: `--font-line-height-display3` - 150%
- Letter Spacing: `--font-letter-spacing-display3` - 0
- Class: `.display3-txt`

### Display 4
- Font Family: Open Sans
- Font Size: `--font-size-display4` - 56px (3.5rem)
- Font Weight: 400 (Regular)
- Line Height: `--font-line-height-display4` - 150%
- Letter Spacing: `--font-letter-spacing-display4` - 1px (0.0625rem)
- Class: `.display4-txt`

## Headline Styles

### H1
- Font Family: Lato
- Font Weight: 700 (Bold)
- Font Size: `--font-size-h1` - 40px (2.5rem)
- Line Height: `--font-line-height-h1` - 160%
- Class: `h1`, `.h1`

### H2
- Font Family: Lato
- Font Weight: 700 (Bold)
- Font Size: `--font-size-h2` - 32px (2rem)
- Line Height: `--font-line-height-h2` - 150%
- Class: `h2`, `.h2`

### H3
- Font Family: Lato
- Font Weight: 700 (Bold)
- Font Size: `--font-size-h3` - 28px (1.75rem)
- Line Height: `--font-line-height-h3` - 142.9%
- Class: `h3`, `.h3`

## Title Styles

### H4
- Font Family: Lato
- Font Weight: 600 (Semibold 2)
- Font Size: `--font-size-h4` - 24px (1.5rem)
- Line Height: `--font-line-height-h4` - 133.3%
- Class: `h4`, `.h4`

### H5
- Font Family: Lato
- Font Weight: 600 (Semibold 2)
- Font Size: `--font-size-h5` - 20px (1.25rem)
- Line Height: `--font-line-height-h5` - 140%
- Class: `h5`, `.h5`

### H6
- Font Family: Lato
- Font Weight: 600 (Semibold 2)
- Font Size: `--font-size-h6` - 16px (1rem)
- Line Height: `--font-line-height-h6` - 150%
- Class: `h6`, `.h6`

## Body Styles

### Body 1 (B1)
- Font Family: Merriweather Sans, Open Sans, sans-serif
- Font Weight: 300 (Normal/Light) - Regular variant
- Font Weight: 400 (Semibold 1) - Semibold variant
- Font Weight: 700 (Bold) - Bold variant
- Font Size: `--font-size-body1` - 16px (1rem)
- Line Height: `--font-line-height-body1` - 150%
- Class: `.body1-txt`
- Variants: Regular, Semibold, Bold, Underline, Strikethrough, Italic

### Body 2 (B2)
- Font Family: Merriweather Sans, Open Sans, sans-serif
- Font Weight: 300 (Normal/Light) - Regular variant
- Font Weight: 400 (Semibold 1) - Semibold variant
- Font Weight: 700 (Bold) - Bold variant
- Font Size: `--font-size-body2` - 14px (0.875rem)
- Line Height: `--font-line-height-body2` - 157.1%
- Class: `.body2-txt`
- Variants: Regular, Semibold, Bold, Underline, Strikethrough, Italic

### Body 3 (B3)
- Font Family: Merriweather Sans, Open Sans, sans-serif
- Font Weight: 300 (Normal/Light) - Regular variant
- Font Weight: 400 (Semibold 1) - Semibold variant
- Font Weight: 700 (Bold) - Bold variant
- Font Size: `--font-size-body3` - 12px (0.75rem)
- Line Height: `--font-line-height-body3` - 166.7%
- Class: `.body3-txt`
- Variants: Regular, Semibold, Bold, All Caps, Italic

## Special Body Styles

### Lead
- Font Family: Merriweather Sans, Open Sans, sans-serif
- Font Weight: 300 (Normal/Light)
- Font Size: `--font-size-lead` - 20px (1.25rem)
- Line Height: `--font-line-height-lead` - 160%
- Class: `.body-lead-txt`

### Blockquote
- Font Family: Merriweather Sans, Open Sans, sans-serif
- Font Weight: 400 (Semibold 1)
- Font Size: `--font-size-blockquote` - 20px (1.25rem)
- Line Height: `--font-line-height-blockquote` - 160%
- Class: `.body-blockquote-txt`

### Code
- Font Family: Source Code Pro, sans-serif
- Font Weight: 300 (Normal/Light)
- Font Size: `--font-size-code` - 14px (0.875rem)
- Line Height: `--font-line-height-code` - 142.9%
- Class: `.code` (use `<code>` or `.code` class)

## Typography Principles

1. **Use utility classes**: Prefer typography utility classes (`.h1`, `.body1-txt`, etc.) when possible
2. **Use CSS variables**: Use CSS variables (`var(--font-size-h1)`, etc.) for custom styling
3. **Match icon sizes**: Font Awesome icons automatically match typography sizes when used within typography classes
4. **Respect font families**: Use header font for headings, body font for content

## See Also

- [Icons](icons.md) - Font Awesome icon sizing tokens
- [Overview](overview.md) - Styles overview and navigation
- [Layout](layout.md) - Element typography hierarchy for spacing

