import React from 'react';
import { PageLayout, Section, Card, Table, Button, Navigation, Pagination, Input } from '@/components';
import { Select } from '@/forms';

export const SessionAdminSpec = ({ showModal = false }) => {
    // Configuration
    const topBarConfig = {
        brand: 'PLUS',
        items: [
            { text: 'Home', href: '#' },
            { text: 'Session Admin', active: true } // Breadcrumb style
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
        { text: 'Warnings', selected: true },
        { text: 'Current Tutors' },
        { text: 'Incoming Tutors' },
        { text: 'Details', disabled: true }
    ];

    // Session Overview Data
    const statCards = [
        { title: 'Total Sessions', value: '1,234', subtitle: '+12% from last week' },
        { title: 'Attendance Rate', value: '95%', subtitle: '+2% from last week' },
        { title: 'Avg. Rating', value: '4.8', subtitle: 'Same as last week' }
    ];

    // Table Data
    const columns = [
        { key: 'day', label: 'Day' },
        { key: 'shift', label: 'Shift' },
        { key: 'school', label: 'School' },
        { key: 'teacher', label: 'Teacher' },
        { key: 'attendedStudents', label: 'Attended Students' },
        { key: 'engagedStudent', label: 'Engaged Student' },
        { key: 'attendedTutors', label: 'Attended Tutors' },
        { key: 'completedCheckin', label: 'Completed Checkin' }
    ];

    const data = Array(10).fill({
        day: 'Mon (11/02/12)',
        shift: '2:25 PM - 3:15 PM',
        school: 'Hogwarts',
        teacher: 'Snape',
        attendedStudents: '20%',
        engagedStudent: '20%',
        attendedTutors: '20%',
        completedCheckin: '20%'
    });

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="session-admin-page"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 16px)' }}>
                {/* Tabs */}
                <div style={{ width: '600px' }}>
                    <Navigation type="tabs" items={tabs} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>

                    {/* Session Overview Section */}
                    <Section title="Session Overview">
                        <div style={{ display: 'flex', gap: 'var(--size-section-gap-md, 24px)', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Filters Stub */}
                            <div className="d-flex gap-2">
                                <Select options={[{ value: 'all', label: 'All Schools' }]} />
                                <Select options={[{ value: 'all', label: 'All Tutors' }]} />
                                <Input type="date" value="2012-11-01" />
                                <Input type="date" value="2012-12-20" />
                            </div>
                        </div>

                        <div className="d-flex gap-3 overflow-auto pb-2">
                            {statCards.map((card, idx) => (
                                <Card
                                    key={idx}
                                    title={card.title}
                                    style={{ minWidth: '250px' }}
                                >
                                    <div className="h2 mb-1">{card.value}</div>
                                    <div className="body2-txt text-muted">{card.subtitle}</div>
                                </Card>
                            ))}
                        </div>
                    </Section>

                    {/* Session Details Section */}
                    <Section title="Session Details">
                        <Table
                            columns={columns}
                            data={data}
                            hover
                        />
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <span className="body2-txt text-muted">Showing 1 to 10 of 200 entries</span>
                            <Pagination currentPage={1} totalPages={20} />
                        </div>
                    </Section>

                </div>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card title="Session Breakdown: 11/02/12" style={{ width: '500px' }}>
                        <p>Modal Content Here...</p>
                        <Button btnStyle="primary" btnFill="filled" label="Close" />
                    </Card>
                </div>
            )}
        </PageLayout>
    );
};
