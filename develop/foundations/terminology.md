# PLUS Terminology

Use these terms consistently when communicating with designers.

## Style Prop Values

PLUS uses `style` (not `variant`) for color variants:

| Value | Usage | Color |
|-------|-------|-------|
| `primary` | Main actions | Blue |
| `secondary` | Secondary actions | Gray-blue |
| `tertiary` | Accent | Teal |
| `success` | Positive states | Green |
| `warning` | Caution states | Yellow |
| `danger` | Error/destructive | Red |
| `info` | Informational | Teal |

## Size Values

| Value | Usage |
|-------|-------|
| `small` / `sm` | Compact elements |
| `medium` / `md` | Default size |
| `large` / `lg` | Prominent elements |

## Typography Sizes

| Token | Usage |
|-------|-------|
| `b1` | Body 1 - largest body text |
| `b2` | Body 2 - default body text |
| `b3` | Body 3 - smallest body text |

## Common Props (PLUS vs Others)

| PLUS | Other Libraries |
|------|-----------------|
| `style="primary"` | `variant="primary"` |
| `size="small"` | `size="sm"` |
| Font Awesome icons | Lucide, Heroicons |
| `Breadcrumb.Item` children | `items={[...]}` array |

## Icon Usage

Always use Font Awesome 6 with PLUS tokens:

```jsx
<i className="fas fa-check" style={{ fontSize: 'var(--font-size-fa-md)' }} />
```
