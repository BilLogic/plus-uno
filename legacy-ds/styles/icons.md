# Icons

## Font Awesome Icon Tokens

Font Awesome icons use specific sizing tokens that correspond to typography levels. Icons should match the text size they accompany.

### Font Awesome Solid Icons

**Headline Icons:**
- `--font-size-fa-h1-solid` - 36px (2.25rem), line-height 177.8%
- `--font-size-fa-h2-solid` - 28px (1.75rem), line-height 171.4%
- `--font-size-fa-h3-solid` - 24px (1.5rem), line-height 166.7%
- `--font-size-fa-h4-solid` - 20px (1.25rem), line-height 160%
- `--font-size-fa-h5-solid` - 16px (1rem), line-height 175%
- `--font-size-fa-h6-solid` - 14px (0.875rem), line-height 171.4%

**Body Icons:**
- `--font-size-fa-body1-solid` - 14px (0.875rem), line-height 171.4%
- `--font-size-fa-body2-solid` - 12px (0.75rem), line-height 183.3%
- `--font-size-fa-body3-solid` - 10px (0.625rem), line-height 200%

### Font Awesome Regular Icons

**Headline Icons:**
- `--font-size-fa-h1-regular` - 36px (2.25rem), line-height 177.8%
- `--font-size-fa-h2-regular` - 28px (1.75rem), line-height 171.4%
- `--font-size-fa-h3-regular` - 24px (1.5rem), line-height 166.7%
- `--font-size-fa-h4-regular` - 20px (1.25rem), line-height 160%
- `--font-size-fa-h5-regular` - 16px (1rem), line-height 175%
- `--font-size-fa-h6-regular` - 14px (0.875rem), line-height 171.4%

**Body Icons:**
- `--font-size-fa-body1-regular` - 14px (0.875rem), line-height 171.4%
- `--font-size-fa-body2-regular` - 12px (0.75rem), line-height 183.3%
- `--font-size-fa-body3-regular` - 10px (0.625rem), line-height 200%

### Legacy Aliases (Backward Compatibility)

For backward compatibility, these aliases point to Solid variants:
- `--font-size-fa-h1` through `--font-size-fa-h6`
- `--font-size-fa-body1` through `--font-size-fa-body3`
- `--font-line-height-fa-h1` through `--font-line-height-fa-h6`
- `--font-line-height-fa-body1` through `--font-line-height-fa-body3`

### Usage Example

```html
<h1 class="h1">
    <i class="fas fa-check"></i> <!-- Uses --font-size-fa-h1 automatically -->
    Heading Text
</h1>

<span class="body2-txt">
    <i class="far fa-user"></i> <!-- Uses --font-size-fa-body1 automatically -->
    Body Text
</span>
```

```css
.custom-icon {
    font-size: var(--font-size-fa-h4-solid);
    line-height: var(--font-line-height-fa-h4-solid);
}
```

## See Also

- [Typography](typography.md) - Font families, weights, sizes, line heights
- [Overview](overview.md) - Styles overview and navigation

