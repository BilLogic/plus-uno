<!-- Tier: 2 -->

# Layout & Spatial Structure

## Shared Baseline Rules

- Use repository terminology consistently (element / card / section / table / modal / spec).
- Identify context level first, then choose matching semantic token layer.

## Context-Level Hierarchy

```
Element -> Card / Table -> Section / Modal -> Page
```

| Level | What It Is | Examples |
|-------|-----------|----------|
| **Element** | Smallest reusable unit | Button, Badge, Icon, Avatar, Tag |
| **Card / Table** | Composed elements with data | StatCard, StudentCard, TutorRow, DataTable |
| **Section / Modal** | Groups of cards/tables forming a page region | FilterSection, AttendanceModal, ReflectionPanel |
| **Page** | Full page composition combining sections | HomePage, TutorPerformancePage, SessionsPage |

## Context-Level Token Naming

- Element -> `--size-element-*`
- Card -> `--size-card-*`
- Section -> `--size-section-*`
- Table -> `--size-table-*`
- Modal -> `--size-modal-*`

## Composition Rules

1. **Always start from the top** -- check if a Page spec exists before building from scratch.
2. **Compose upward** -- build Elements first, then Cards, then Sections, then Pages.
3. **Never skip levels** -- a Page should not directly contain Elements; use Cards/Sections as intermediaries.

## Grid System

The PLUS Design System uses a **fluid 12-column grid** that adapts to the container width.

### Key Dimensions

| Token | Value | Description |
|:---|:---|:---|
| `--layout-grid-gap` | 8px | Gap between columns |
| `--layout-sidebar-width` | 164px | Fixed sidebar width (Large+) |
| `--size-surface-pad-x` | 32px | Content surface horizontal padding |
| `--size-surface-container-pad-x-sm` | 16px | Outer layout horizontal padding |

### Column Width Calculation

```scss
--layout-col-1-width: calc((100% - (11 * 8px)) / 12);
--col-N: calc((N * col-1) + ((N-1) * 8px));
```

### Content Width by Breakpoint

```
Medium (768px):   768 - 32 (outer) - 64 (surface) = 672px
Large (1024px):   1024 - 32 - 164 (sidebar) - 16 (gap) - 64 = 748px
X-Large (1440px): 1440 - 32 - 164 - 16 - 64 = 1164px
```

### Column Reference Values (at breakpoint minimum)

| Column | Medium (768px) | Large (1024px) | X-Large (1440px) |
|:---|---:|---:|---:|
| `--col-1` | 48.67px | 55.00px | 89.67px |
| `--col-4` | 218.67px | 244.00px | 382.67px |
| `--col-6` | 332.00px | 370.00px | 578.00px |
| `--col-12` | 672.00px | 748.00px | 1164.00px |

### Grid Rules

1. **Container Context**: Column tokens are relative to their parent container's width, not the viewport.
2. **Sidebar Visibility**: At Medium breakpoint, the sidebar is hidden -- content gets full width.
3. **Gap Handling**: Use `gap: var(--layout-grid-gap)` to maintain proper spacing.

## Font Families

| Usage | Font Family | Weights |
|-------|-------------|---------|
| Headlines (H1-H6) | Lato | 300, 400, 700 |
| Body Text (B1-B3) | Merriweather Sans | 300, 400, 700 |
| UI Text | Open Sans | 400, 600 |
| Code Blocks | Source Code Pro | 300 |

## Communication Heuristic

- Cite concrete files for recommendations.
- Ask for clarification when multiple component families are equally plausible.
