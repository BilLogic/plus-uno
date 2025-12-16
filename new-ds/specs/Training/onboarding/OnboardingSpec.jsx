import React from 'react';
import { PageLayout, Section, Card, Table, Button, Badge, Select } from '@/components';

export const OnboardingSpec = () => {
    // Configuration
    const topBarConfig = {
        brand: 'PLUS',
        items: [
            { text: 'Home', href: '#' },
            { text: 'Onboarding', active: true }
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

    // Featured Modules
    const featuredModules = [
        { title: 'Welcome to PLUS', duration: '9 mins' },
        { title: 'Your Role at PLUS', duration: '9 mins' },
        { title: 'Tutoring Session Overview', duration: '9 mins' }
    ];

    // All Modules Data
    const allModules = [
        { title: 'Welcome to PLUS', duration: '11mins', stage: 'not started' },
        { title: 'Your role at PLUS', duration: '11mins', stage: 'not started' },
        { title: 'Tutoring Session Overview', duration: '11mins', stage: 'not started' },
        { title: 'Tutor Session Flow', duration: '11mins', stage: 'not started' },
    ];

    const columns = [
        { key: 'title', label: 'Module Title' },
        { key: 'duration', label: 'Duration' },
        { key: 'stage', label: 'Stage', render: (row) => <Badge label={row.stage} type="neutral" /> },
        { key: 'action', label: 'Action', render: () => <Button btnStyle="primary" btnFill="tonal" label="Start" btnSize="small" /> }
    ];

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="onboarding-overview-page"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 16px)' }}>

                {/* Featured Modules */}
                <Section title="Featured Modules">
                    <div className="d-flex justify-content-end mb-2">
                        <div className="d-flex gap-2">
                            <Button btnStyle="default" btnFill="outline" icon="arrow-left" btnSize="small" disabled />
                            <Button btnStyle="primary" btnFill="outline" icon="arrow-right" btnSize="small" />
                        </div>
                    </div>
                    <div className="d-flex gap-3 overflow-auto pb-3" style={{ scrollBehavior: 'smooth' }}>
                        {featuredModules.map((mod, idx) => (
                            <Card
                                key={idx}
                                title={mod.title}
                                style={{ minWidth: '300px', backgroundColor: 'var(--color-surface-container-low)' }}
                            >
                                <div className="body2-txt text-muted mb-2">{mod.duration}</div>
                                <Button btnStyle="primary" btnFill="tonal" label="Start Module" className="w-100" />
                            </Card>
                        ))}
                    </div>
                </Section>

                {/* All Modules */}
                <Section title="All Modules">
                    <div className="d-flex justify-content-end mb-3">
                        <div style={{ width: '200px' }}>
                            <Select options={[{ value: 'default', label: 'Sort by...' }]} />
                        </div>
                    </div>
                    <Table
                        columns={columns}
                        data={allModules}
                        hover
                    />
                </Section>

            </div>
        </PageLayout>
    );
};
