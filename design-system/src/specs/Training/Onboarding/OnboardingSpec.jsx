import React from 'react';
import { Table, StatusTag, Button, IconButton } from '@/components';
import PatternCard from '@/patterns/PatternCard';
import { PageLayout } from '@/specs/Universal/Pages';
import PatternSection from '@/patterns/PatternSection';
import { Select } from '@/components/forms-and-inputs';

export const OnboardingSpec = () => {
    // Configuration
    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Onboarding' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2
        }
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
        { key: 'stage', label: 'Stage', render: (row) => <StatusTag>{row.stage}</StatusTag> },
        { key: 'action', label: 'Action', render: () => <Button text="Start" spacing="compact" /> }
    ];

    return (
        <PageLayout
            title="Onboarding"
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="onboarding-overview-page"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 16px)' }}>

                {/* Featured Modules */}
                <PatternSection title="Featured Modules">
                    <div className="d-flex justify-content-end mb-2">
                        <div className="d-flex gap-2">
                            <IconButton icon="arrow-left" spacing="compact" label="Previous modules" isDisabled />
                            <IconButton icon="arrow-right" spacing="compact" label="Next modules" />
                        </div>
                    </div>
                    <div className="d-flex gap-3 overflow-auto pb-3" style={{ scrollBehavior: 'smooth' }}>
                        {featuredModules.map((mod, idx) => (
                            <PatternCard
                                key={idx}
                                title={mod.title}
                                style={{ minWidth: '300px', backgroundColor: 'var(--ds-surface-container)' }}
                            >
                                <div className="body2-txt text-muted mb-2">{mod.duration}</div>
                                <Button text="Start Module" className="w-100" />
                            </PatternCard>
                        ))}
                    </div>
                </PatternSection>

                {/* All Modules */}
                <PatternSection title="All Modules">
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
                </PatternSection>

            </div>
        </PageLayout>
    );
};
