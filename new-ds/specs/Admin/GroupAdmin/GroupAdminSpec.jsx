import React from 'react';
import { PageLayout, Section, Card, Table, Button, Pagination, Navigation } from '@/components';

export const GroupAdminSpec = () => {
    // Configuration
    const topBarConfig = {
        brand: 'PLUS',
        items: [
            { text: 'Home', href: '#' },
            { text: 'Group Admin', active: true }
        ],
        components: [
            { type: 'custom', content: <div className="d-flex align-items-center gap-2"><div className="avatar-circle">J</div><span className="body2-txt">John Doe</span></div> }
        ]
    };

    const sidebarConfig = {
        user: 'supervisor',
        onTabClick: (tab) => console.log(`Tab clicked: ${tab}`),
        onHomeClick: () => console.log('Home clicked')
    };

    const tabs = [
        { text: 'Group Info', selected: true },
        { text: 'Training Progress' }
    ];

    // Table Data
    const columns = [
        { key: 'groupName', label: 'Group Name' },
        { key: 'groupSize', label: 'Group Size' },
        {
            key: 'actions', label: 'Actions', render: () => (
                <div className="d-flex gap-2">
                    <Button btnStyle="link" label="Edit" />
                    <Button btnStyle="link" label="Delete" className="text-danger" />
                </div>
            )
        }
    ];

    const data = Array(10).fill({
        groupName: 'Math Masters',
        groupSize: 4
    });

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="group-admin-page"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 16px)' }}>

                {/* Tabs */}
                <div>
                    <Navigation type="tabs" items={tabs} />
                </div>

                {/* Title & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="h4">Group Info</h2>
                    <Button
                        btnStyle="primary"
                        btnFill="filled"
                        label="Add Group"
                        icon="user-plus"
                        iconPosition="left"
                    />
                </div>

                {/* Table Section */}
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <Table
                        columns={columns}
                        data={data}
                        hover
                    />
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="body2-txt text-muted">Showing 1 to 10 of 200 entries</span>
                    <Pagination currentPage={1} totalPages={20} />
                </div>

            </div>
        </PageLayout>
    );
};
