import React from 'react';
import { PageLayout, Section, Card, Table, Button, Pagination, Navigation, Select, Input, Badge } from '@/components';

export const TutorAdminSpec = ({ showModal = false }) => {
    // Configuration
    const topBarConfig = {
        brand: 'PLUS',
        items: [
            { text: 'Home', href: '#' },
            { text: 'Tutor Admin', active: true }
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
        { text: 'Tutor Performance', selected: true },
        { text: 'Status And Warnings' },
        { text: 'Tool Usage' },
        { text: 'Training Progress' }
    ];

    // Data
    const columns = [
        { key: 'name', label: 'Tutor Name' },
        { key: 'signedUp', label: 'Signed Up', render: (row) => <Badge label={row.signedUp} type={row.signedUp === 'Yes' ? 'success' : 'neutral'} /> },
        { key: 'attendance', label: 'Attendance' },
        { key: 'sessions', label: 'Sessions' },
        { key: 'students', label: 'Students' },
        { key: 'actions', label: 'Actions', render: () => <Button btnStyle="link" icon="ellipsis-v" /> }
    ];

    const data = [
        { name: 'Amelia Blue', signedUp: 'Yes', attendance: '92%', sessions: 25, students: 18 },
        { name: 'Ava Silver', signedUp: 'Yes', attendance: '22%', sessions: 34, students: 12 },
        { name: 'Elijah Orange', signedUp: 'Yes', attendance: '68%', sessions: 22, students: 7 },
    ];

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="tutor-admin-page"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 16px)' }}>

                {/* Tabs */}
                <div>
                    <Navigation type="tabs" items={tabs} />
                </div>

                {/* Header Actions */}
                <div className="d-flex justify-content-end gap-2">
                    <Button btnStyle="primary" btnFill="outline" label="Email Tutors" />
                    <Button btnStyle="primary" btnFill="outline" label="Export Reflection Data" />
                </div>

                {/* Performance Overview */}
                <Section title="Performance Overview">
                    <div style={{ display: 'flex', gap: 'var(--size-section-gap-md, 24px)', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="d-flex gap-2">
                            <Select options={[{ value: 'all', label: 'All Schools' }]} />
                            <Select options={[{ value: 'all', label: 'All Tutors' }]} />
                            <Input type="date" value="2025-01-10" />
                            <Input type="date" value="2025-02-10" />
                        </div>
                    </div>

                    <div className="d-flex gap-3 overflow-auto pb-2">
                        <Card
                            title="Attendance"
                            style={{ minWidth: '300px' }}
                        >
                            <div className="text-center p-3 bg-light rounded" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="text-muted">Highcharts / Pie Chart Placeholder</span>
                            </div>
                        </Card>
                        <Card
                            title="Sign-Up Rate"
                            style={{ minWidth: '300px' }}
                        >
                            <div className="text-center p-3 bg-light rounded" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="text-muted">Highcharts / Pie Chart Placeholder</span>
                            </div>
                        </Card>
                    </div>
                </Section>

                {/* Performance Details */}
                <Section title="Performance Details">
                    <div className="d-flex justify-content-end mb-3">
                        <Button btnStyle="primary" btnFill="outline" btnSize="small" icon="user-plus" label="Add Tutor" />
                    </div>
                    <Table
                        columns={columns}
                        data={data}
                        hover
                    />
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className="body2-txt text-muted">Showing 1 to 3 of 3 entries</span>
                        <Pagination currentPage={1} totalPages={1} />
                    </div>
                </Section>

            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card title="Add New Tutor" style={{ width: '500px' }}>
                        <p>Form to add a new tutor would go here.</p>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button btnStyle="default" btnFill="text" label="Cancel" />
                            <Button btnStyle="primary" btnFill="filled" label="Save Tutor" />
                        </div>
                    </Card>
                </div>
            )}
        </PageLayout>
    );
};
