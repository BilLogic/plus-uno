# Layout Grid System

The PLUS Design System uses a **fluid 12-column grid** that adapts to the container width.

## Key Dimensions

| Token | Value | Description |
|:---|:---|:---|
| `--layout-grid-gap` | 8px | Gap between columns |
| `--layout-sidebar-width` | 164px | Fixed sidebar width (Large+) |
| `--size-surface-pad-x` | 32px | Content surface horizontal padding |
| `--size-surface-container-pad-x-sm` | 16px | Outer layout horizontal padding |

## How It Works

The grid uses `calc()` to compute column widths relative to the **content container**:

```scss
--layout-col-1-width: calc((100% - (11 * 8px)) / 12);
--col-N: calc((N * col-1) + ((N-1) * 8px));
```

This means columns will automatically scale when:
- The browser window resizes
- The sidebar is shown/hidden
- The grid is placed inside a different container

## Column Reference Values

Values at the **minimum** of each breakpoint:

| Column | Medium (768px) | Large (1024px) | X-Large (1440px) |
|:---|---:|---:|---:|
| Content Width | 672px | 748px | 1164px |
| `--col-1` | 48.67px | 55.00px | 89.67px |
| `--col-2` | 105.33px | 118.00px | 187.33px |
| `--col-3` | 162.00px | 181.00px | 285.00px |
| `--col-4` | 218.67px | 244.00px | 382.67px |
| `--col-5` | 275.33px | 307.00px | 480.33px |
| `--col-6` | 332.00px | 370.00px | 578.00px |
| `--col-7` | 388.67px | 433.00px | 675.67px |
| `--col-8` | 445.33px | 496.00px | 773.33px |
| `--col-9` | 502.00px | 559.00px | 871.00px |
| `--col-10` | 558.67px | 622.00px | 968.67px |
| `--col-11` | 615.33px | 685.00px | 1066.33px |
| `--col-12` | 672.00px | 748.00px | 1164.00px |

## Content Width Calculation

```
Medium:  768 - 32 (outer) - 64 (surface) = 672px
Large:   1024 - 32 - 164 (sidebar) - 16 (gap) - 64 = 748px
X-Large: 1440 - 32 - 164 - 16 - 64 = 1164px
```

## Usage Examples

```scss
// Card spanning 4 columns
.overview-card {
  width: var(--col-4);
}

// Two-column layout (6 + 6)
.left-panel { width: var(--col-6); }
.right-panel { width: var(--col-6); }

// Sidebar + Main (3 + 9)
.sidebar { width: var(--col-3); }
.main-content { width: var(--col-9); }
```

## Important Notes

1. **Container Context**: Column tokens are relative to their parent container's width, not the viewport.
2. **Sidebar Visibility**: At Medium breakpoint, the sidebar is hidden, so content gets full width.
3. **Gap Handling**: When laying out items, use `gap: var(--layout-grid-gap)` to maintain proper spacing.
