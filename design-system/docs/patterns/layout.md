<!-- Tier: 2 | Route: design-system/docs/discovery.md → patterns/layout.md -->
# PLUS Design System: Layout Skeleton Cheat Sheet

> **CRITICAL RULE**: When asked to build a new prototype, page, or feature, you MUST use one of these pre-approved structural skeletons. DO NOT invent your own raw HTML/CSS flexbox grids for the outer page structure.

## 1. The Standard App Shell (Dashboard / Admin Layout)
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

## 2. The Standard Overlay (Modal Layout)
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

## 3. The Standard Content Block (Card + Table Layout)
Inside the `PageLayout` or `Modal`, data is almost always presented in a `<Card>` containing a `<Table>` or a form.

```jsx
import React from 'react';
import { Card, Table, Badge } from '@/components';

export default function MyContentBlock() {
    // Table takes ARRAYS OF ARRAYS — `headers` / `rows`, not `columns` / `data`.
    const tableHeaders = ['Student Name', 'Status'];

    const tableRows = [
        ['John Doe', <Badge style="success" text="Active" />]
    ];

    const handleAdd = () => console.log('Add row');

    return (
        <Card
            title="Student Roster"
            actionButton={{ text: 'Add Row', onClick: handleAdd }}
        >
            {/* Use the PLUS Table component, do not write raw <table> tags */}
            <Table
                headers={tableHeaders}
                rows={tableRows}
                onRowClick={(row) => console.log('Clicked', row)}
            />
        </Card>
    );
}
```

## How to Apply Spacing Properly
When filling in the content blocks, ONLY use semantic CSS variables from `design-system/agent-views/tokens/tokens.md`:
*   `gap: 'var(--size-section-gap-md)'` -> Spacing between major page blocks (like two diff Cards).
*   `gap: 'var(--size-element-gap-md)'` -> Spacing between elements inside a Card (like headers and text).
*   Never use raw string pixels like `gap: '16px'`.
