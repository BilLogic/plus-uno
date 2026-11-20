import React, { useState } from 'react';
import { Breadcrumb, DynamicTable, PageHeader, PopupSelect, Sidebar, Tabs } from '@/components';
import { Card, Page, Section } from '@/templates';

/**
 * The Navigation page's do and don't examples, as PLUS parts only.
 * Show code prints each one from this file; the surface that holds them lives
 * in `NavigationCases.jsx`.
 */

const MAYA_SESSIONS = [
    ['Thu 4:00 PM', 'Ms. Ortiz', 'Algebra'],
    ['Fri 3:30 PM', 'Ms. Ortiz', 'Fractions'],
    ['Sat 10:00 AM', 'Ms. Kim', 'Linear equations'],
];

const STUDENTS = [
    ['Ava Thompson', 'Grade 7', 'Oct 24'],
    ['Marcus Lee', 'Grade 8', 'Oct 23'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23'],
];

const Table = ({ head, rows, label }) => (
    <DynamicTable
        head={{ cells: head.map((content) => ({ key: content, content, isSortable: true })) }}
        rows={rows.map((cells) => ({ key: cells.join(), cells: cells.map((content) => ({ key: content, content })) }))}
        label={label}
        isFixedSize
    />
);

export const BreadcrumbOnRecordPage = () => (
    <Page
        header={(
            <PageHeader
                title="Maya Rodriguez"
                breadcrumbs={(
                    <Breadcrumb
                        label="Record page breadcrumb"
                        items={[
                            { text: 'Students', href: '#students' },
                            { text: 'Maya Rodriguez' },
                        ]}
                    />
                )}
            />
        )}
    >
        <Section title="Sessions">
            <Table head={['Time', 'Tutor', 'Subject']} rows={MAYA_SESSIONS} label="Sessions" />
        </Section>
    </Page>
);

export const BreadcrumbOnAreaPage = () => (
    <Page
        header={(
            <PageHeader
                title="Students"
                breadcrumbs={(
                    <Breadcrumb
                        label="Area page breadcrumb"
                        items={[
                            { text: 'Home', href: '#home' },
                            { text: 'Students' },
                        ]}
                    />
                )}
            />
        )}
    >
        <Section title="All students">
            <Table head={['Name', 'Grade', 'Last session']} rows={STUDENTS} label="Students" />
        </Section>
    </Page>
);

const SESSIONS = {
    upcoming: [
        ['Thu 4:00 PM', 'Ms. Ortiz', 'Algebra'],
        ['Thu 5:30 PM', 'Mr. Patel', 'Geometry'],
        ['Fri 3:30 PM', 'Ms. Ortiz', 'Fractions'],
    ],
    past: [
        ['Tue 4:00 PM', 'Ms. Ortiz', 'Two-step equations'],
        ['Mon 3:30 PM', 'Mr. Patel', 'Angles and proofs'],
    ],
};

const STATUS_OPTIONS = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
];

const GROUPS = [
    { id: 'home', items: [{ id: 'home', text: 'Home', icon: 'house' }] },
    {
        id: 'toolkit',
        title: 'Toolkit',
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar' },
            { id: 'students', text: 'Students', icon: 'user' },
        ],
    },
];

const openItem = (label, tooltip) => ({ id: `t-${label}`, label, tooltip });

const SidebarWithOpenItems = ({ label, openItems }) => {
    const [activeId, setActiveId] = useState('home');
    return (
        <Sidebar
            label={label}
            groups={GROUPS}
            activeId={activeId}
            onSelect={setActiveId}
            onHome={() => setActiveId('home')}
            tabs={{ sessions: openItems }}
            onSelectTab={(item) => setActiveId(item.id)}
        />
    );
};

export const OpenItemsByTimeAndWho = () => (
    <SidebarWithOpenItems
        label="Main"
        openItems={[openItem('4:00 PM · Ms. Ortiz', 'Hillside · Ms. Ortiz'), openItem('5:30 PM · Mr. Patel', 'Roosevelt · Mr. Patel')]}
    />
);

export const OpenItemsCarryEverything = () => (
    <SidebarWithOpenItems
        label="Main"
        openItems={[
            openItem('Session at Hillside with Ms. Ortiz, 4:00 PM', 'Hillside · Ms. Ortiz'),
            openItem('Session at Roosevelt with Mr. Patel, 5:30 PM', 'Roosevelt · Mr. Patel'),
        ]}
    />
);

const SessionsTable = ({ status }) => (
    <DynamicTable
        head={{ cells: ['Time', 'Tutor', 'Subject'].map((content) => ({ key: content, content, isSortable: true })) }}
        rows={SESSIONS[status].map((cells) => ({ key: cells.join(), cells: cells.map((content) => ({ key: content, content })) }))}
        label="Sessions"
        isFixedSize
    />
);

export const OneTabSystem = () => {
    const [tab, setTab] = useState('sessions');
    const [status, setStatus] = useState('upcoming');
    return (
        <Page
            header={(
                <PageHeader
                    title="Maya Rodriguez"
                        bottomBar={(
                        <Tabs activeKey={tab} onSelect={setTab} aria-label="Student pages">
                            <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
                            <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
                        </Tabs>
                    )}
                />
            )}
        >
            {tab === 'overview' ? (
                <Section title="Overview">
                    <Card title="Lincoln Middle · Grade 8" description="Math · Tue & Thu at 4:30 PM" />
                </Section>
            ) : (
                <Section
                    title="Sessions"
                    views={<PopupSelect label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} isSearchable={false} />}
                >
                    <SessionsTable status={status} />
                </Section>
            )}
        </Page>
    );
};

export const TwoTabSystems = () => {
    const [tab, setTab] = useState('sessions');
    return (
        <Page
            header={(
                <PageHeader
                    title="Maya Rodriguez"
                        bottomBar={(
                        <Tabs activeKey={tab} onSelect={setTab} aria-label="Student pages">
                            <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
                            <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
                        </Tabs>
                    )}
                />
            )}
        >
            <Section
                title="Sessions"
                views={(
                    <Tabs appearance="pill" defaultActiveKey="upcoming" aria-label="Views">
                        <Tabs.Tab eventKey="upcoming">Upcoming</Tabs.Tab>
                        <Tabs.Tab eventKey="past">Past</Tabs.Tab>
                    </Tabs>
                )}
            >
                <SessionsTable status="upcoming" />
            </Section>
        </Page>
    );
};
