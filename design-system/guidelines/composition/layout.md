<!-- Tier: 2 -->

# Layout

> **CRITICAL RULE**: When asked to build a new prototype, page, or feature, you MUST use one of these pre-approved structural skeletons. DO NOT invent your own raw HTML/CSS flexbox grids for the outer page structure.

## The standard app shell

If you are building a full page (like a dashboard, student list, or toolkit), you MUST wrap the entire page in the `<PageLayout>` component. This automatically handles the responsive Sidebar and TopBar.

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
                <h1 className="h3-txt">Dashboard Overview</h1>
            </div>
            {/* ⬆️ YOUR PAGE CONTENT ENDS HERE ⬆️ */}
        </PageLayout>
    );
}
```

## The standard overlay

If the user clicks a row or a button and needs to see details without leaving the page, use the `<Modal>` component. It manages its own overlay.

```jsx
import React, { useState } from 'react';
import { Modal, Button } from '@/components';

export default function MyPageWithModal() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <Button text="Open Modal" style="primary" fill="filled" onClick={() => setShowModal(true)} />

            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title="Modal Title"
                width={800} // Set explicit width if needed
            >
                {/* ⬇️ YOUR MODAL CONTENT GOES HERE ⬇️ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
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
*   `gap: 'var(--size-element-gap-md)'` -> Spacing between elements inside a Card (like headers and text).
*   Never use raw string pixels like `gap: '16px'`.

## Navigation

The sidebar is a collapsible tree with three categories:

- **Toolkit** — pre-session, in-session, post-session tools
- **Training** — tutor onboarding, certification, practice modules
- **Admin** — user management, billing, platform settings

The active item is highlighted. The sidebar collapses to icons on narrow viewports.
`PageLayout` renders it; do not build a second navigation surface.

## Responsive behaviour

- **Desktop (≥1200px)** — full sidebar and content area side by side.
- **Tablet (768–1199px)** — sidebar collapses to an icon-only rail; content fills the width.
- Cards stack vertically on narrow viewports.

Column spans and breakpoint tokens: `../foundations/grid.md`.

## Related

- `surfaces.md` — cards, tables, modals, empty and loading states
- `hierarchy.md` — the four context levels these skeletons compose
- `../foundations/grid.md` — breakpoints and column spans
