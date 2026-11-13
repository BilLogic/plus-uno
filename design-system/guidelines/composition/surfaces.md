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

`PatternCard` (from `@/patterns`) takes a `title`, an optional `description`,
and `actions` at the end of its header row.

## Tables

Use `<Table>` inside a `<PatternCard>`, or through `PatternTable`. Never write raw `<table>` HTML.

```jsx
/* correct — Table takes arrays of arrays */
<PatternCard title="Student Roster">
  <Table
    headers={['Student Name', 'Status']}
    rows={[['John Doe', <StatusTag appearance="success">Active</StatusTag>]]}
    onRowClick={(row) => openDetail(row)}
  />
</PatternCard>

/* incorrect — `columns` and `data` are not Table props and render nothing.
   Verified against design-system/src/components/text-and-data-display/Table/Table.jsx propTypes. */
<Table columns={columns} data={data} />
```

### Choosing a table

Pick the type before the parts. A row that nests under another makes a
**Tree table**, even when people also act on it. Otherwise, anything people do
to the table makes it a **Dynamic table**: sort, filter, select (bulk actions
included), paginate, expand a row, use a row action, freeze a column, or wait
through loading and empty states. Everything else is a **Static table**: a fixed
grid people read, where a link in a cell is fine and rows rest or are
highlighted. Hover, pressed, focus and selected rows belong to Dynamic and Tree
tables.

## Modals

Three variants, one component:

| Variant | Trigger | Example |
|---------|---------|---------|
| Confirmation dialog | Destructive action | "Delete this student?" with Cancel / Delete |
| Detail panel | Row click in a table | Student detail overlay with tabs |
| Form overlay | Add or Edit action | Single-column form inside a modal |

All use `<Modal show={bool} onClose={fn} title="…">`. For wider content, set
`width` to a wider step of `MODAL_WIDTHS` (`6-col` is the default, then `8-col`
and `10-col`). A press on the Backdrop and Escape both close.

## Empty states

A view, panel, card or table with nothing to show fills its slot with
`EmptyState` — never a blank panel or a bare "No results". Pick the kind by
why it is empty:

| The view is | The slot says |
|---|---|
| empty | what goes here, and the one primary action that fills it ("No students yet", Add student) |
| failed to load | what failed, and a filled Try again ("Couldn't load sessions") |
| no access | the plain reason and who can help, with no action |

`spacing="compact"` fits a table body or a card. A rejected form submit and a
background failure are messages, not empty states:
`design-system/guidelines/components/messaging.md`.

`Table` draws no empty state on its own. Pass `emptyState` and, when `rows` is empty, the header stays and the message takes the body as one row spanning every column; without it the table renders only its header.

## Loading

- **Cards and lists** — `Skeleton`, composed to the real card's dimensions, with `aria-busy="true"` on the loading region and a visually hidden `role="status"` label beside it (not inside it), mounted empty, whose text is set after mount to say what is loading and set again to announce the arrival. Inside a loading container every label is a plain text bar; the label presets are for one label loading on its own. The rules are on Skeleton's docs page (`design-system/src/components/loading/Skeleton/Skeleton.mdx`).
- **Inline actions** (button click, form submit) — spinner inside the button, button disabled.
- **Full-page transitions** — centered spinner with a label.

## Related

- `layout.md` — the page skeletons these surfaces sit in
- `forms.md` — form composition, including the modal form variant
- `hierarchy.md` — which token layer a surface draws from
