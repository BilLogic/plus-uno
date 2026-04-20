<!-- Tier: 2 -->
# UI Patterns

Canonical patterns used across the PLUS platform. Every prototype and spec must use these — do not invent custom layout primitives.

## Page Layout

All full pages use the `<PageLayout>` wrapper. It renders the responsive Sidebar and TopBar automatically.

```jsx
<PageLayout
  topBarConfig={{ breadcrumbs: [...], user: { name, role } }}
  sidebarConfig={{ activeTabId: 'toolkit' }}
>
  {/* Page content here */}
</PageLayout>
```

- Import: `@plus-ds/specs/Universal/Pages/PageLayout/PageLayout`
- Sidebar has 3 nav categories: **Toolkit**, **Training**, **Admin**
- TopBar shows breadcrumbs, user avatar, and notification badge
- Content area fills remaining viewport width/height

## Card-Based Content

Cards are the primary bounded containers for grouping related information.

| Card Type | Use Case | Location |
|-----------|----------|----------|
| `StudentCard` | Student profile summary, session history | Toolkit specs |
| Data Card | Metrics, KPIs, aggregate stats | Universal/Cards |
| Info Card | Read-only detail display | Universal/Cards |

Cards accept a `title` prop and an optional `actions` slot for buttons in the header.

## Form Patterns

- Single-column layout (never multi-column forms)
- Inline validation messages appear below the field on blur
- Required fields use a red asterisk (`*`) indicator next to the label
- Submit button is always bottom-right, primary variant
- Cancel/secondary actions are bottom-left

## Table Patterns

Use the PLUS `<Table>` component inside a `<Card>`. Never write raw `<table>` HTML.

```jsx
<Card title="Student Roster" actions={<Button variant="primary">Add</Button>}>
  <Table columns={columns} data={data} onRowClick={handleClick} />
</Card>
```

- **Sortable columns**: pass `sortable: true` in the column definition
- **Pagination**: handled via `pagination` prop (`{ page, pageSize, total }`)
- **Row actions**: render action buttons in the last column via a custom cell renderer
- **Empty state**: table renders an empty-state message with illustration when `data.length === 0`

## Empty State Pattern

When a view has no data, show:

1. A centered illustration (from the PLUS icon set or a simple SVG)
2. A short descriptive message (e.g., "No students enrolled yet")
3. A single primary action button (e.g., "Add Student")

Never show a blank white screen or a raw "No results" string.

## Loading Pattern

- **Cards / lists**: Use skeleton screens (gray placeholder shapes matching card dimensions)
- **Inline actions** (button clicks, form submits): Use a spinner inside the button, disable the button
- **Full-page transitions**: Show a centered spinner with label text

## Navigation

Sidebar tree navigation with collapsible sections:

- **Toolkit** — Pre-session, In-session, Post-session tools
- **Training** — Tutor onboarding, certification, practice modules
- **Admin** — User management, billing, platform settings

Active item is highlighted. Sidebar collapses to icons on narrow viewports.

## Modal Pattern

Three modal variants:

| Variant | Trigger | Example |
|---------|---------|---------|
| Confirmation dialog | Destructive action | "Delete this student?" with Cancel / Delete buttons |
| Detail panel | Row click in a table | Student detail overlay with tabs |
| Form overlay | "Add" or "Edit" action | Single-column form inside a modal |

All modals use `<Modal show={bool} onClose={fn} title="...">`. Set explicit `width` for wider content (max 800px). Clicking the backdrop or pressing Escape closes the modal.

## Responsive Behavior

- **Desktop (>=1200px)**: Full sidebar + content area side-by-side
- **Tablet (768–1199px)**: Sidebar collapses to icon-only rail; content fills width
- **Mobile (<768px)**: Sidebar hidden behind hamburger menu; single-column stack layout
- Cards stack vertically on narrow viewports
- Tables switch to a card-list view below 768px
