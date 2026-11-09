---
summary: If you are building a full page (like a dashboard, student list, or toolkit), you MUST build it on a template — the Frame with the PLUS Sidebar and a breadcrumb
---

<!-- Tier: 2 -->

# Layout

> **CRITICAL RULE**: When asked to build a new prototype, page, or feature, you MUST use one of these pre-approved structural skeletons. DO NOT invent your own raw HTML/CSS flexbox grids for the outer page structure.

## The standard app shell

If you are building a full page (like a dashboard, student list, or toolkit), you MUST build it on the default template: `Frame` with the PLUS `Sidebar` in `sidebar` and a `Breadcrumb` in `header`. The Frame handles the responsive Sidebar and the breadcrumb row (§ The frame); the Templates pattern page (`design-system/src/patterns/PageTemplates/PageTemplates.mdx`) shows both templates.

```jsx
import React from 'react';
import { Breadcrumb, Sidebar } from '@/components';
import { Frame, PatternSection } from '@/patterns';

export default function MyDashboard() {
    return (
        <Frame
            header={<Breadcrumb items={[{ text: 'Home', href: '/' }, { text: 'Dashboard' }]} />}
            sidebar={<Sidebar user="tutor" activeTabId="dashboard" account={{ id: 'ana', name: 'Ana Ruiz', role: 'Tutor' }} />}
        >
            {/* ⬇️ YOUR PAGE CONTENT GOES HERE ⬇️ */}
            <PatternSection level="page" title="Dashboard" description="This week at a glance." />
            {/* ⬆️ YOUR PAGE CONTENT ENDS HERE ⬆️ */}
        </Frame>
    );
}
```

The page-level Section header's title is the page's `h1`.

For a page that holds one task the person finishes or leaves (a session note, a setup flow), use the focused template: `Frame` with no `sidebar`, `width="reading"`, the task's name as the `h1` in `header`, and `onBack` and `onClose`, which draw Back · title · Close in the Page header row. The actions sit in a group at the foot of the content. When to use it versus a Modal is in the Templates pattern page § Usage.

## The standard overlay

If the user clicks a row or a button and needs to see details without leaving the page, use the `<Modal>` component. It manages its own overlay.

```jsx
import React, { useState } from 'react';
import { Modal, Button } from '@/components';

export default function MyPageWithModal() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <Button text="Open Modal" appearance="primary" onClick={() => setShowModal(true)} />

            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title="Modal Title"
                width="8-col" // a step of MODAL_WIDTHS; 6-col is the default
            >
                {/* ⬇️ YOUR MODAL CONTENT GOES HERE ⬇️ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)' }}>
                    <p className="body1-txt">Here is the detailed breakdown.</p>
                </div>
                {/* ⬆️ YOUR MODAL CONTENT ENDS HERE ⬆️ */}
            </Modal>
        </div>
    );
}
```

## Applying spacing

When filling in the content blocks, use only semantic CSS variables — the names are in `design-system/agent-views/tokens/tokens.md`, the scales in `../../src/styles/Spacing.mdx`:
*   `gap: 'var(--section-stack-md)'` -> Spacing between major page blocks (like two Cards).
*   `gap: 'var(--card-stack-md)'` -> Spacing between elements inside a Card (like headers and text).
*   Never use raw string pixels like `gap: '16px'`.

## Navigation

The sidebar is a collapsible tree with three categories:

- **Toolkit** — pre-session, in-session, post-session tools
- **Training** — tutor onboarding, certification, practice modules
- **Admin** — user management, billing, platform settings

The active item is highlighted. The PLUS `Sidebar` (`@/components`) renders it
from the role's config; build every page's navigation through it, so there is
one navigation surface.

## The frame

Every template sits in the `Frame` pattern (`@/patterns`,
Figma `Pattern/Surface container`), which owns every frame size and the sidebar's
behavior:

- **No top bar.** The Sidebar and the Page run the full height. The Page's header row (Frame's `header`, the breadcrumb) sits 32 high on the Sidebar logo row's center line.
- **Sidebar** — 240 (`--frame-sidebar-width`), docked from 1024 with a 1px `--ds-border` on its Page-facing edge; its logo row ends in the toggle (`angles-left`), and the account row and Help Center sit at its foot. Closed, the toggle (`bars`) sits at the Page's top left on x 32 and the breadcrumb follows from x 56. Below 1024 it never docks and starts collapsed: hovering the left edge peeks it over the page (overlay shadow, no Blanket, the page does not move), an outside click or Escape closes the peek, and the toggle (or Ctrl+[) opens it as an overlay that closes the same way. The Page is flush, with no corner radius.
- **Panel** — the area at the right, full height, holding AI chat first: 320 · 400 (default) · 640 (`--panel-min-width`, `--panel-width-default`, `--panel-max-width`). Docked it sits beside the Page and moves it; overlay it opens over the Page on a Blanket that covers the Page and the Sidebar, and an outside click or Escape closes it. Overlay, it is modal: focus moves in, the Page and the Sidebar under the Blanket are inert, and closing it returns focus to what opened it; docked, it leaves focus alone. Its splitter resizes it, resists at the limit and never collapses the Sidebar. Open it from anywhere in the Frame with `usePanelControl()`. A Modal leaves it open under its Blanket.
- **Page** — pads `--page-pad` (24 at every width).
- **Content** — a 12-column grid with gutter `--grid-gutter` 16, capped at 1232 (`--content-max-width`) and centered on wide screens, never under 720 (`--content-min-width`): narrower, the page scrolls sideways. A child spans all 12 columns; give it `grid-column: span N` to span fewer, in whole columns.

### Who gives way

The content never drops under 720, so the Frame, not the page, decides what docks. It measures its own width, not the window's:

1. Under 1024 the Sidebar never docks. The Panel is capped at 320 and opens as an overlay, one overlay at a time. Under 768 it is full width.
2. A Sidebar the person opened by hand stays docked, and the Panel opens as an overlay if both do not fit.
3. If both fit with 720 of content, both dock. With a 400 Panel that is from 1408.
4. Otherwise a Sidebar left open by default collapses, and returns when the Panel closes. With a 400 Panel the Panel docks alone from 1168.
5. Otherwise the Panel opens as an overlay.
6. A Section with a detail region keeps its split from 960 of content, met by collapsing the Sidebar first.

## Section detail

For a queue a person works through (Admin › Compliance, Admin › Reflections), give the Section a `detail` (`PatternSection`, `@/patterns`): the body is the list and takes 7 columns, the detail region, a subtle-fill Section, takes 5, with next and previous in its header. Pass `sectionDetail` to the Frame so opening the Panel collapses the Sidebar first and the split keeps 960 of content. Below 960 the detail replaces the list under a back link. Heavy work, such as the recording review, gets its own page: "Open full review" in the detail's footer.

Column spans and breakpoint tokens: `../../src/styles/Grid.mdx`.

## Related

- `surfaces.md` — cards, tables, modals, empty and loading states
- `hierarchy.md` — the four context levels these skeletons compose
- `../../src/styles/Grid.mdx` — breakpoints and column spans
