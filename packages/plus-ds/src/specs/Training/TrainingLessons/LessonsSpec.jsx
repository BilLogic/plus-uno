import React, { useState } from 'react';
import { PageLayout, Section, Card, Table, Button, Badge, Select, Input } from '@/components';

export const LessonsSpec = () => {
    const [view, setView] = useState('list');

    // Configuration
    const topBarConfig = {
        brand: 'PLUS',
        items: [
            { text: 'Home', href: '#' },
            { text: 'Lessons', active: true } // Breadcrumb style simulation
        ],
        components: [
            { type: 'custom', content: <div className="d-flex align-items-center gap-2"><div className="avatar-circle">J</div><span className="body2-txt">John Doe</span></div> }
        ]
    };

    const sidebarConfig = {
        user: 'tutor',
        onTabClick: (tab) => console.log(`Tab clicked: ${tab}`),
        onHomeClick: () => console.log('Home clicked')
    };

    // Filter Bar Logic (Stub)

    // Lessons Data
    const lessons = [
        { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAi: true },
        { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'completed', duration: '12mins', showAi: false },
        { title: 'Lesson Title', competencyArea: 'academic', status: 'not started', duration: '45mins', showAi: true },
        { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAi: false },
        { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAi: false },
        { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAi: true },
        { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAi: false }
    ];

    const columns = [
        {
            key: 'title', label: 'Lesson Title', render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    <span className="body2-txt font-weight-bold">{row.title}</span>
                    {row.showAi && <Badge label="AI" type="neutral" />}
                </div>
            )
        },
        { key: 'competencyArea', label: 'Competency Area' },
        {
            key: 'status', label: 'Status', render: (row) => (
                <Badge
                    label={row.status}
                    type={row.status === 'completed' ? 'success' : row.status === 'in progress' ? 'warning' : 'neutral'}
                />
            )
        },
        { key: 'duration', label: 'Duration' },
        { key: 'actions', label: '', render: () => <Button btnStyle="link" icon="chevron-right" /> }
    ];

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="lessons-overview-page"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 16px)', height: '100%' }}>

                {/* Filter Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ width: '200px' }}>
                        <Select options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'in-progress', label: 'In Progress' },
                            { value: 'completed', label: 'Completed' }
                        ]} />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Button btnStyle="secondary" btnFill="outline" btnSize="small" label="Expand All" />
                        <div className="d-flex gap-1 bg-white border rounded p-1">
                            <Button
                                btnStyle={view === 'list' ? 'primary' : 'link'}
                                btnFill={view === 'list' ? 'tonal' : 'text'}
                                icon="list-ul"
                                btnSize="small"
                                onClick={() => setView('list')}
                            />
                            <Button
                                btnStyle={view === 'grid' ? 'primary' : 'link'}
                                btnFill={view === 'grid' ? 'tonal' : 'text'}
                                icon="table-cells-large"
                                btnSize="small"
                                onClick={() => setView('grid')}
                            />
                        </div>
                    </div>
                </div>

                {/* Lesson List */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {view === 'list' ? (
                        <Table
                            columns={columns}
                            data={lessons}
                            hover
                        />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {lessons.map((lesson, idx) => (
                                <Card key={idx} title={lesson.title}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <Badge label={lesson.status} type="neutral" />
                                        <span className="body3-txt text-muted">{lesson.duration}</span>
                                    </div>
                                    <div className="body2-txt mb-3">{lesson.competencyArea}</div>
                                    <Button btnStyle="primary" btnFill="outline" label="Start Lesson" className="w-100" />
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="d-flex justify-content-between align-items-center py-3 border-top">
                    <span className="body3-txt text-muted">v5.2.0 | Copyright © Carnegie Mellon University 2026</span>
                </div>

            </div>
        </PageLayout>
    );
};
