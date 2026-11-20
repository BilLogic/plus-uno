import React, { useState } from 'react';
import { Breadcrumb, Button, DynamicTable, Heading, PageHeader, PopupSelect, Tabs } from '@/components';
import { Card, Page, Section } from '@/templates';

/**
 * The Page template page's do and don't examples, as PLUS parts only. Show
 * code prints each one from this file; the docs surface around it lives in
 * `PageCases.jsx`.
 */

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

const SessionsTable = ({ status = 'upcoming' }) => (
    <DynamicTable
        head={{ cells: ['Time', 'Tutor', 'Subject'].map((content) => ({ key: content, content, isSortable: true })) }}
        rows={SESSIONS[status].map((cells) => ({ key: cells.join(), cells: cells.map((content) => ({ key: content, content })) }))}
        label="Sessions"
        isFixedSize
    />
);

const StudentViews = () => (
    <Tabs appearance="pill" defaultActiveKey="all" aria-label="Views">
        <Tabs.Tab eventKey="all">All students</Tabs.Tab>
    </Tabs>
);

const AddStudentAction = () => (
    <Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
);

const RecordTabs = ({ active, onSelect }) => (
    <Tabs activeKey={active} onSelect={onSelect} aria-label="Student pages">
        <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
        <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
    </Tabs>
);

const StudentsSection = () => (
    <Section title="Students" views={<StudentViews />}>
        <SessionsTable />
    </Section>
);

const TitleWithDescription = ({ title, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        <Heading size="lg">{title}</Heading>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{children}</p>
    </div>
);

export const HeaderIsTheH1 = () => (
    <Page header={<PageHeader title="Students" />}>
        <Section title="Sessions" views={<StudentViews />}>
            <SessionsTable />
        </Section>
    </Page>
);

export const SectionsAsTitles = () => (
    <Page>
        <Section level="page" title="Students" views={<StudentViews />}>
            <SessionsTable />
        </Section>
        <Section level="page" title="Sessions" views={<StudentViews />}>
            <SessionsTable status="past" />
        </Section>
    </Page>
);

export const AreaPageTitleAlone = () => (
    <Page header={<PageHeader title="Students" />}>
        <StudentsSection />
    </Page>
);

export const BreadcrumbOnAreaPage = () => (
    <Page
        header={(
            <PageHeader
                breadcrumbs={<Breadcrumb label="Breadcrumb" items={[{ text: 'Students', href: '#students' }, { text: 'Students' }]} />}
                title="Students"
            />
        )}
    >
        <StudentsSection />
    </Page>
);

export const OneLineDescription = () => (
    <Page
        header={(
            <PageHeader
                disableTitleStyles
                title={<TitleWithDescription title="Students">Every student you tutor, with their next session.</TitleWithDescription>}
            />
        )}
    >
        <StudentsSection />
    </Page>
);

export const ParagraphUnderTitle = () => (
    <Page
        header={(
            <PageHeader
                disableTitleStyles
                title={(
                    <TitleWithDescription title="Students">
                        Every student you tutor is listed here with their grade, their site and their next session. Open a row to see the full record, and use the views to switch between your students and the ones waiting for a tutor. Anything you change is saved as you go.
                    </TitleWithDescription>
                )}
            />
        )}
    >
        <StudentsSection />
    </Page>
);

export const AddInTitleRow = () => (
    <Page header={<PageHeader title="Students" />}>
        <Section title="Sessions" views={<StudentViews />} actions={<AddStudentAction />}>
            <SessionsTable />
        </Section>
    </Page>
);

export const AddTwice = () => (
    <Page header={<PageHeader title="Students" actions={<AddStudentAction />} />}>
        <Section title="Sessions" views={<StudentViews />} actions={<AddStudentAction />}>
            <SessionsTable />
        </Section>
    </Page>
);

export const OneTabSystem = () => {
    const [tab, setTab] = useState('sessions');
    const [status, setStatus] = useState('upcoming');
    return (
        <Page header={<PageHeader title="Maya Rodriguez" bottomBar={<RecordTabs active={tab} onSelect={setTab} />} />}>
            {tab === 'overview' ? (
                <Section title="Overview">
                    <Card title="Lincoln Middle · Grade 8" description="Math · Tue & Thu at 4:30 PM" />
                </Section>
            ) : (
                <Section
                    title="Sessions"
                    views={(
                        <PopupSelect
                            label="Status"
                            options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]}
                            value={status}
                            onChange={setStatus}
                            isSearchable={false}
                        />
                    )}
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
        <Page header={<PageHeader title="Maya Rodriguez" bottomBar={<RecordTabs active={tab} onSelect={setTab} />} />}>
            <Section
                title="Sessions"
                views={(
                    <Tabs appearance="pill" defaultActiveKey="upcoming" aria-label="Views">
                        <Tabs.Tab eventKey="upcoming">Upcoming</Tabs.Tab>
                        <Tabs.Tab eventKey="past">Past</Tabs.Tab>
                    </Tabs>
                )}
            >
                <SessionsTable />
            </Section>
        </Page>
    );
};
