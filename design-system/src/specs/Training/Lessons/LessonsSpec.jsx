import React, { useState } from 'react';
import { Card, Table, StatusTag, Select, Button, IconButton } from '@/components';
import { PageLayout } from '@/specs/Universal/Pages';

export const LessonsSpec = () => {
    const [view, setView] = useState('list');

    // Configuration
    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Lessons' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2,
            type: 'lead tutor'
        }
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
                    {row.showAi && <StatusTag appearance="discovery">AI</StatusTag>}
                </div>
            )
        },
        { key: 'competencyArea', label: 'Competency Area' },
        {
            key: 'status', label: 'Status', render: (row) => (
                <StatusTag appearance={row.status === 'completed' ? 'success' : row.status === 'in progress' ? 'warning' : 'neutral'}>
                    {row.status}
                </StatusTag>
            )
        },
        { key: 'duration', label: 'Duration' },
        { key: 'actions', label: '', render: () => <IconButton appearance="subtle" icon="chevron-right" label="Open lesson" /> }
    ];

    return (
        <PageLayout
            title="Lessons"
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
                        <Button spacing="compact" text="Expand All" />
                        <div className="d-flex gap-1 bg-white border rounded p-1">
                            <IconButton
                                appearance="subtle" isSelected={view === 'list'}
                                icon="list-ul"
                                spacing="compact"
                                label="List view"
                                aria-pressed={view === 'list'}
                                onClick={() => setView('list')}
                            />
                            <IconButton
                                appearance="subtle" isSelected={view === 'grid'}
                                icon="table-cells-large"
                                spacing="compact"
                                label="Grid view"
                                aria-pressed={view === 'grid'}
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
                                        <StatusTag>{lesson.status}</StatusTag>
                                        <span className="body3-txt text-muted">{lesson.duration}</span>
                                    </div>
                                    <div className="body2-txt mb-3">{lesson.competencyArea}</div>
                                    <Button text="Start Lesson" className="w-100" />
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="d-flex justify-content-between align-items-center py-3 border-top">
                    <span className="body3-txt text-muted">v5.2.0 | Copyright © Carnegie Mellon University 2024</span>
                </div>

            </div>
        </PageLayout>
    );
};
