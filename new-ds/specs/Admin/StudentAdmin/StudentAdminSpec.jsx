import React from 'react';
import { PageLayout, Section, Card, Table, Button, Pagination, Input, Select, Badge } from '@/components';

export const StudentAdminSpec = ({ showModal = false, modalType = 'Info' }) => {
    // Configuration
    const topBarConfig = {
        brand: 'PLUS',
        items: [
            { text: 'Home', href: '#' },
            { text: 'Student Admin', active: true }
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

    // Student Overview Data
    const studentCards = [
        { label: 'All Students', value: '254', color: 'primary' },
        { label: 'Unassigned', value: '15', color: 'warning' },
        { label: 'Needs Attention', value: '42', color: 'danger' }
    ];

    // Table Data
    const columns = [
        { key: 'student', label: 'Student' },
        { key: 'school', label: 'School' },
        { key: 'teacher', label: 'Teacher' },
        { key: 'latestStatus', label: 'Latest Status' },
        { key: 'action', label: 'Action', render: () => <Button btnStyle="link" label="View goals" /> }
    ];

    const data = [
        { student: "Jose Dolus", school: "Langley", teacher: "Jose Mura", latestStatus: "Needs to set goals" },
        { student: "Chris Hudson", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals" },
        { student: "Irene White", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals" },
        { student: "Jacqueline Traine", school: "Langley", teacher: "Erin Hunter", latestStatus: "Needs to set goals" },
        { student: "Jerome Brown", school: "Langley", teacher: "Katie Strong", latestStatus: "Needs to set goals" },
        { student: "Jose Darrell", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals" },
        { student: "Joy Jones", school: "Langley", teacher: "Aaron Zhang", latestStatus: "Needs to set goals" },
        { student: "Ksenia Gato", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals" },
        { student: "Lesley Mora", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals" },
        { student: "Manny Jones", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals" }
    ];

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="student-admin-page"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 16px)' }}>

                {/* Overview Section */}
                <Section title="Student Overview">
                    <div style={{ display: 'flex', gap: 'var(--size-section-gap-md, 24px)', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Filters Stub */}
                        <div className="d-flex gap-2">
                            <Select options={[{ value: 'all', label: 'All Schools' }]} />
                            <Select options={[{ value: 'all', label: 'All Tutors' }]} disabled />
                            <Input type="date" value="2012-11-01" />
                            <Input type="date" value="2012-12-20" />
                        </div>
                    </div>

                    <div className="d-flex gap-3 overflow-auto pb-2">
                        {studentCards.map((card, idx) => (
                            <Card
                                key={idx}
                                style={{ minWidth: '200px' }}
                            >
                                <div className="h2 mb-1">{card.value}</div>
                                <div className="body2-txt text-muted">{card.label}</div>
                            </Card>
                        ))}
                    </div>
                </Section>

                {/* Details Section */}
                <Section title="Student Details">
                    <div className="d-flex justify-content-end mb-3">
                        <Button btnStyle="primary" btnFill="filled" label="Add Student" onClick={() => console.log('Add Student')} />
                    </div>
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

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card title={`Student Modal: ${modalType}`} style={{ width: '500px' }}>
                        <p>Modal Content for {modalType}...</p>
                        <Button btnStyle="primary" btnFill="filled" label="Close" />
                    </Card>
                </div>
            )}
        </PageLayout>
    );
};
