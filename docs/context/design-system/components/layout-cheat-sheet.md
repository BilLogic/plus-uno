<!-- Tier: 2 -->
# PLUS Design System: Layout Skeleton Cheat Sheet

> **CRITICAL RULE**: When asked to build a new prototype, page, or feature, you MUST use one of these pre-approved structural skeletons. DO NOT invent your own raw HTML/CSS flexbox grids for the outer page structure.

## 1. The Standard App Shell (Dashboard / Admin Layout)
If you are building a full page (like a dashboard, student list, or toolkit), you MUST wrap the entire page in the `<PageLayout>` component. This automatically handles the responsive Sidebar and TopBar.

```jsx
import React from 'react';
import PageLayout from '@plus-ds/specs/Universal/Pages/PageLayout/PageLayout';
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
import Modal from '@plus-ds/components/Modal';

export default function MyPageWithModal() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <button onClick={() => setShowModal(true)}>Open Modal</button>

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
import Card from '@plus-ds/components/Card';
import Table from '@plus-ds/components/Table';
import Badge from '@plus-ds/components/Badge';

export default function MyContentBlock() {
    const tableColumns = [
        { key: 'name', label: 'Student Name' },
        { key: 'status', label: 'Status' }
    ];
    
    const tableData = [
        { id: 1, name: 'John Doe', status: <Badge style="success" text="Active" /> }
    ];

    return (
        <Card
            title="Student Roster"
            actions={<button className="plus-btn plus-btn-primary">Add Row</button>}
        >
            {/* Use the PLUS Table component, do not write raw <table> tags */}
            <Table 
                columns={tableColumns} 
                data={tableData} 
                onRowClick={(row) => console.log('Clicked', row)}
            />
        </Card>
    );
}
```

## How to Apply Spacing Properly
When filling in the content blocks, ONLY use the semantic CSS variables from `PLUS_CHEAT_SHEET.md`:
*   `gap: 'var(--size-section-gap-md)'` -> Spacing between major page blocks (like two diff Cards).
*   `gap: 'var(--size-element-gap-md)'` -> Spacing between elements inside a Card (like headers and text).
*   Never use raw string pixels like `gap: '16px'`.
