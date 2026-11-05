---
summary: If you are building a full page (like a dashboard, student list, or toolkit), you MUST wrap the entire page in the <PageLayout> component
---

<!-- Tier: 2 -->

# Layout

> **CRITICAL RULE**: When asked to build a new prototype, page, or feature, you MUST use one of these pre-approved structural skeletons. DO NOT invent your own raw HTML/CSS flexbox grids for the outer page structure.

## The standard app shell

If you are building a full page (like a dashboard, student list, or toolkit), you MUST wrap the entire page in the `<PageLayout>` component. This automatically handles the responsive Sidebar and TopBar (§ The frame).

```jsx
import React from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
// Note: TopBar and Sidebar are auto-imported inside PageLayout, you just pass configs.

export default function MyDashboard() {
    return (
        <PageLayout
            topBarConfig={{
                breadcrumbs: [{ text: 'Home', href: '/' }, { text: 'Dashboard', active: true }],
                user: { name: 'Admin User', role: 'admin' }
            }}
            sidebarConfig={{
                activeTabId: 'dashboard'
            }}
        >
            {/* ⬇️ YOUR PAGE CONTENT GOES HERE ⬇️ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
                {/* Example Content */}
                <h1 className="h3">Dashboard Overview</h1>
            </div>
            {/* ⬆️ YOUR PAGE CONTENT ENDS HERE ⬆️ */}
        </PageLayout>
    );
}
```

For a page that holds one task the person finishes or leaves (a session note, a setup flow), pass `frame="focused"`: no sidebar, Back · title · Close in the topbar, the 864 reading column, and `actions` in a footer row. The props and when to use it versus a Modal are in `PageLayout.mdx` § Focused frame.

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
                width={800} // Set explicit width if needed
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

When filling in the content blocks, use only semantic CSS variables — the names are in `design-system/agent-views/tokens/tokens.md`, the scales in `../foundations/spacing.md`:
*   `gap: 'var(--size-section-gap-md)'` -> Spacing between major page blocks (like two diff Cards).
*   `gap: 'var(--space-0625)'` -> Spacing between elements inside a Card (like headers and text).
*   Never use raw string pixels like `gap: '16px'`.

## Navigation

The sidebar is a collapsible tree with three categories:

- **Toolkit** — pre-session, in-session, post-session tools
- **Training** — tutor onboarding, certification, practice modules
- **Admin** — user management, billing, platform settings

The active item is highlighted. `PageLayout` renders it; build every page's
navigation through it, so there is one navigation surface.

## The frame

`PageLayout` sits in the `Frame` pattern (`@/patterns/Frame`,
Figma `Pattern/Surface container`), which owns every frame size and the sidebar's
behavior:

- **Topbar** — the `Topbar` pattern (`@/patterns`), full width, 32 high (`--frame-topbar-height`), padded at its end and closed by a hairline: the sidebar toggle, the breadcrumb, Help Center and the account. The toggle sits 8 from the left, flush to the top at every width and shows `angles-left` while the sidebar is open, `bars` while it is closed. Docked, the breadcrumb lines up with the Page.
- **Sidebar** — 240 (`--frame-sidebar-width`), docked from 1024. Below 1024 it never docks and starts collapsed: hovering the toggle or the left edge peeks it floating over the page (shadow, no Blanket, the page does not move), an outside click or Escape closes the peek, and a click on the toggle (or Ctrl+[) opens it as an overlay that closes the same way. The Page's top-left corner is rounded (`--page-radius`) only while the Sidebar is docked.
- **Page** — pads `--page-pad` (24 at every width).
- **Content** — a 12-column grid with gutter `--grid-gutter` 16, capped at 1232 (`--content-max-width`) and centered on wide screens, never under 720 (`--content-min-width`): narrower, the page scrolls sideways. A child spans all 12 columns; give it `grid-column: span N` to span fewer, in whole columns.

Column spans and breakpoint tokens: `../foundations/grid.md`.

## Related

- `surfaces.md` — cards, tables, modals, empty and loading states
- `hierarchy.md` — the four context levels these skeletons compose
- `../foundations/grid.md` — breakpoints and column spans
