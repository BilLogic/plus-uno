---
embodiment: ide
summary: How a Storybook component docs page is organized, the pages that exist today, and what a doc review checks on each
---

# Storybook component docs — what a doc review checks

A review of a component docs page holds it to the page contract and checks it
against today's component set. The contract — the tree, the page shell, the
four tabs, the Usage spine and examples — is
[`documentation-ia.md`](../../../design-system/guidelines/documentation-ia.md);
this file names what to check, not the rules themselves. Prop-table
categorization is [`storybook.md`](storybook.md).

## The pages that exist

One sidebar entry per component, under `Components/<Group>/<Name>`, in the
order [`storybook.taxonomy.json`](../../../storybook.taxonomy.json) generates.
A name absent here, or from `design-system/agent-views/components/index.md`,
has no page; a review that meets one flags it as retired and names the
replacement the index's Not-here table gives.

| Group | Pages |
|---|---|
| Forms and inputs | Button, ButtonGroup, Calendar, Cascader, Checkbox, ChoiceGrid, CloseButton, Comment, DatePicker, DateTimePicker, DropdownMenu, FileUpload, FilterButton, FilterMenu, IconButton, LinkButton, LinkIconButton, PopupSelect (Popup select), PromptInput, Radio, RadioGroup, Range, Rating, RichTextEditor, Select, SplitButton, TagInput, TextArea, TextField, TimePicker, Toggle, TreeSelect, VerticalButton |
| Images and icons | AiIcon, Avatar, AvatarGroup, Icon, Illustration, Image, Object, Tile |
| Labels | AiMessage, ChangeTag (Change tag), CountTag, DateTag, PromptStarters, SmartTag, StatusTag, Suggestion, Tag, TagGroup |
| Layout and structure | Accordion, Carousel, PageHeader, Panel, ScrollBar |
| Loading | GenerativeBorder, ProgressBar, Skeleton, Spinner |
| Messaging | Banner, EmptyState, Flag, InlineMessage, Modal, SectionMessage, Spotlight |
| Navigation | Breadcrumb, Link, Pagination, Tabs |
| Overlays and layering | Popup, Tooltip |
| Status indicators | ProgressIndicator, ProgressTracker |
| Text and data display | Code, CodeBlock, Heading, InlineEdit, Table, VisuallyHidden |

Patterns (Frame, Page, Section, Card, Table, Modal, Drawer, Backdrop, Popups,
Sidebar, AI chat) take the same page template from `design-system/src/patterns/`.
**Libraries** (Overview, Base UI, Font Awesome, Highcharts, Motion) is its own
section: one short page per library PLUS builds on, from
`design-system/src/storybook-docs/libraries/`.

## What to check on a page

- **Four tabs**, in order: Examples · Code · Usage · Agent view. Code and Agent
  view are generated; a hand-written props table or agent text is a finding.
- **Examples:** one `ComponentExample` per appearance, state and size, then the
  interactive playground. Each example follows the example-fidelity and
  illustration-kit rules in `documentation-ia.md` § Examples.
- **Usage spine:** Usage, Alternatives, Best practices, Accessibility,
  Related, then Parts and Content guidelines; `npm run check:ds-writing` holds
  the shape.
- **Disabled and slot names:** an example's disabled states and slot props
  follow `design-system/guidelines/composition/form-behavior.md` § Unavailable
  actions and fields and `docs/engineering/coding.md` § Slot names.
- **Names:** every component named on the page is in the index; Alternatives
  and Related route to live components.

## References

- [`documentation-ia.md`](../../../design-system/guidelines/documentation-ia.md) — the page contract
- [`storybook.md`](storybook.md) — prop-table categorization
- [`Button.mdx`](../../../design-system/src/components/forms-and-inputs/Button/Button.mdx) — the reference page
- [`ds-docs-layout.jsx`](../../../design-system/src/storybook-docs/ds-docs-layout.jsx) — the docs layout primitives
