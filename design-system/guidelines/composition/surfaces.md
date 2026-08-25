---
summary: Cards, tables, modals, and the empty and loading states they fall into
---

<!-- Tier: 2 -->

# Surfaces

Cards, tables, modals, and the empty and loading states they fall into.
Page-level skeletons are `layout.md`; the token layer behind each surface is
`hierarchy.md`.

## Cards

Cards are the primary bounded container for grouping related information.

| Card type | Use case | Location |
|-----------|----------|----------|
| `StudentCard` | Student profile summary, session history | Toolkit specs |
| Data Card | Metrics, KPIs, aggregate stats | `Universal/Cards` |
| Info Card | Read-only detail display | `Universal/Cards` |

`Card` takes a `title` and an optional `actionButton` (`{ text, onClick }`) for a
header action.

## Tables

Use `<Table>` inside a `<Card>`. Never write raw `<table>` HTML.

```jsx
/* correct — Table takes arrays of arrays */
<Card title="Student Roster" actionButton={{ text: 'Add', onClick: handleAdd }}>
  <Table
    headers={['Student Name', 'Status']}
    rows={[['John Doe', <Badge style="success" text="Active" />]]}
    onRowClick={(row) => openDetail(row)}
  />
</Card>

/* incorrect — `columns` and `data` are not Table props and render nothing.
   Verified against design-system/src/.../Table/Table.jsx propTypes. */
<Table columns={columns} data={data} />
```

## Modals

Three variants, one component:

| Variant | Trigger | Example |
|---------|---------|---------|
| Confirmation dialog | Destructive action | "Delete this student?" with Cancel / Delete |
| Detail panel | Row click in a table | Student detail overlay with tabs |
| Form overlay | Add or Edit action | Single-column form inside a modal |

All use `<Modal show={bool} onClose={fn} title="…">`. Set an explicit `width` for
wider content (max 800px). Backdrop click and Escape both close.

## Empty states

When a view has no data, show three things — never a blank panel and never a bare
"No results" string:

1. A centered illustration (PLUS icon set or a simple SVG).
2. A short descriptive message, e.g. "No students enrolled yet".
3. A single primary action, e.g. "Add Student".

`Table` renders its own empty state when `rows.length === 0`.

## Loading

- **Cards and lists** — skeleton screens: grey placeholder shapes matching the real card's dimensions.
- **Inline actions** (button click, form submit) — spinner inside the button, button disabled.
- **Full-page transitions** — centered spinner with a label.

## Related

- `layout.md` — the page skeletons these surfaces sit in
- `forms.md` — form composition, including the modal form variant
- `hierarchy.md` — which token layer a surface draws from
