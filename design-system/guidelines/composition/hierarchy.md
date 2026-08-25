<!-- Tier: 2 -->

# Hierarchy

Every PLUS surface sits at one of four context levels. Identify the level first,
then choose the matching semantic token layer — that single step is what keeps
padding, gap and radius consistent across screens nobody designed together.

## Context levels

```
Element -> Card / Table -> Section / Modal -> Page
```

| Level | What it is | Examples |
|-------|-----------|----------|
| **Element** | Smallest reusable unit | Button, Badge, Icon, Avatar, Tag |
| **Card / Table** | Composed elements with data | StatCard, StudentCard, TutorRow, DataTable |
| **Section / Modal** | Groups of cards/tables forming a page region | FilterSection, AttendanceModal, ReflectionPanel |
| **Page** | Full page composition combining sections | HomePage, TutorPerformancePage, SessionsPage |

## Token naming follows the level

- Element → `--size-element-*`
- Card → `--size-card-*`
- Section → `--size-section-*`
- Table → `--size-table-*`
- Modal → `--size-modal-*`

```jsx
/* correct — a card's padding comes from the card layer */
<div className="student-card" style={{ padding: 'var(--size-card-pad-x-sm)' }} />

/* incorrect — element padding on a card surface; the two layers drift apart
   the moment the card scale is retuned */
<div className="student-card" style={{ padding: 'var(--size-element-pad-x-lg)' }} />
```

## Composition rules

1. **Always start from the top** — check whether a Page spec exists before building from scratch.
2. **Compose upward** — build Elements first, then Cards, then Sections, then Pages.
3. **Never skip levels** — a Page should not directly contain Elements; use Cards or Sections as intermediaries.

## Vocabulary

Use repository terminology consistently: element / card / section / table / modal / spec.
A doc or a class name that invents a fifth word makes the token layer unguessable.

## Related

- `layout.md` — the page skeletons these levels compose into
- `../foundations/spacing.md` — the values behind each layer
- `../foundations/grid.md` — column spans a Page composes against
