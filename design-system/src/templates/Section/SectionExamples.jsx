import React from 'react';
import { Button, ButtonGroup, DynamicTable, IconButton, SearchField, Tabs, TextField } from '@/components';
import { Card, Section } from '@/templates';

/**
 * The Section page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the docs wrapper that keeps Storybook's
 * styles off them lives in `SectionCases.jsx`. Body copy is a plain `p` on the
 * body token: PLUS has no text component to reach for first.
 */

const studentHead = {
    cells: [
        { key: 'name', content: 'Name' },
        { key: 'grade', content: 'Grade' },
        { key: 'last', content: 'Last session' },
    ],
};

const studentRows = [
    { key: 'Ava Thompson', cells: [{ key: 'name', content: 'Ava Thompson' }, { key: 'grade', content: 'Grade 7' }, { key: 'last', content: 'Oct 24' }] },
    { key: 'Marcus Lee', cells: [{ key: 'name', content: 'Marcus Lee' }, { key: 'grade', content: 'Grade 8' }, { key: 'last', content: 'Oct 23' }] },
];

const studentTable = <DynamicTable head={studentHead} rows={studentRows} label="Students" isFixedSize />;

const studentViews = (
    <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
        <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
        <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
    </Tabs>
);

const sessionViews = (
    <Tabs appearance="pill" defaultActiveKey="Upcoming" aria-label="Views">
        <Tabs.Tab eventKey="Upcoming">Upcoming</Tabs.Tab>
        <Tabs.Tab eventKey="Past">Past</Tabs.Tab>
    </Tabs>
);

const formatSwitch = (
    <ButtonGroup label="Format">
        <IconButton icon="table-list" label="Table" isSelected onClick={() => {}} />
        <IconButton icon="grip" label="Cards" onClick={() => {}} />
    </ButtonGroup>
);

const sessionCard = (
    <Card
        title="Upcoming session"
        description="Tuesday at 4:30 PM · Lincoln Middle · 6 students"
        actions={<Button text="Join session" appearance="primary" onClick={() => {}} />}
    />
);

export const CardStandsAlone = () => sessionCard;

export const SectionRepeatsCard = () => (
    <Section title="Upcoming session">
        {sessionCard}
    </Section>
);

export const TitleRowAboveHeaderRows = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={studentViews}
    >
        {studentTable}
    </Section>
);

export const TitleInViewsRow = () => (
    <Section
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-lg)' }}>
                <span style={{ font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Students</span>
                {studentViews}
            </div>
        )}
    >
        {studentTable}
    </Section>
);

export const ActionsInTitleRow = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" onClick={() => {}} />
                <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={studentViews}
    >
        {studentTable}
    </Section>
);

export const ActionsInTwoHomes = () => (
    <Section
        title="Students"
        description="Lincoln Middle · 24 students"
        actions={<Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
        views={studentViews}
        format={<Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />}
    >
        {studentTable}
    </Section>
);

export const RightSideInOrder = () => (
    <Section
        title="Sessions"
        description="This term"
        actions={(
            <>
                <IconButton icon="ellipsis" label="More section actions" onClick={() => {}} />
                <Button text="New session" iconBefore="plus" appearance="primary" onClick={() => {}} />
            </>
        )}
        views={sessionViews}
        format={formatSwitch}
        search={<SearchField mode="active" spacing="compact" placeholder="Search sessions" />}
        filters={[{ key: 'status', label: 'Status', text: 'All', onClick: () => {} }]}
    >
        {studentTable}
    </Section>
);

export const RightSideCrowded = () => (
    <Section
        title="Sessions"
        description="This term"
        actions={(
            <>
                <Button text="New session" iconBefore="plus" appearance="primary" onClick={() => {}} />
                <IconButton icon="download" label="Export" appearance="subtle" onClick={() => {}} />
                <Button text="Share" onClick={() => {}} />
                <IconButton icon="filter" label="Filters" appearance="subtle" onClick={() => {}} />
                <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />
            </>
        )}
        views={(
            <Tabs appearance="pill" defaultActiveKey="Upcoming" aria-label="Views">
                <Tabs.Tab eventKey="Upcoming">Upcoming</Tabs.Tab>
            </Tabs>
        )}
        format={formatSwitch}
    >
        {studentTable}
    </Section>
);

const contactFields = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--stack-lg) var(--inline-xl)' }}>
        <TextField label="Guardian name" defaultValue="Dana Thompson" />
        <TextField label="Phone" defaultValue="(412) 555-0148" />
    </div>
);

export const CardOwnsSave = () => (
    <Section
        title="Contact details"
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        <Card
            footer={(
                <>
                    <Button text="Save" spacing="compact" onClick={() => {}} />
                    <Button text="Cancel" spacing="compact" onClick={() => {}} />
                </>
            )}
        >
            {contactFields}
        </Card>
    </Section>
);

export const FooterCommits = () => (
    <Section
        title="Contact details"
        footer={(
            <>
                <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                <Button text="Save" appearance="primary" onClick={() => {}} />
            </>
        )}
    >
        <Card>
            {contactFields}
        </Card>
    </Section>
);
