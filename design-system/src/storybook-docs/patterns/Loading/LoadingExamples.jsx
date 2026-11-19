import React from 'react';
import { CustomItem, DropdownMenu, DynamicTable, IconButton, SearchField, Skeleton, Spinner, Tabs } from '@/components';
import { LoadThenReveal } from '@/lib/loadRevealMotion';
import { Section } from '@/templates';

/**
 * The Loading page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the surface that holds them lives in
 * `LoadingCases.jsx`.
 */

const STUDENTS = [
    ['Ava Thompson', 'Grade 7', 'Oct 24'],
    ['Marcus Lee', 'Grade 8', 'Oct 23'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23'],
    ['Jordan Patel', 'Grade 6', 'Oct 21'],
];

const StudentsTable = () => (
    <DynamicTable
        head={{ cells: ['Name', 'Grade', 'Last session'].map((content) => ({ key: content, content, isSortable: true })) }}
        rows={STUDENTS.map((cells) => ({ key: cells[0], cells: cells.map((content) => ({ key: content, content })) }))}
        label="Students"
        isFixedSize
    />
);

const SkeletonRows = () => (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        {STUDENTS.map(([name]) => (
            <div key={name} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', gap: 'var(--inline-lg)', alignItems: 'center' }}>
                <Skeleton shape="text" width="70%" />
                <Skeleton shape="text" width="60%" />
                <Skeleton shape="text" width="50%" />
            </div>
        ))}
    </div>
);

export const SkeletonInShape = () => (
    <Section
        title="Students"
        description="Lincoln Middle"
        views={(
            <Tabs appearance="pill" activeKey="All students" onSelect={() => {}} aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
            </Tabs>
        )}
        search={<SearchField mode="active" spacing="compact" placeholder="Search students" />}
    >
        <LoadThenReveal as="section" aria-label="Students" loading skeleton={() => <SkeletonRows />}>
            <StudentsTable />
        </LoadThenReveal>
    </Section>
);

export const SpinnerInBlank = () => (
    <Section title="Students" description="Lincoln Middle">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minBlockSize: 'calc(var(--control-lg) * 4)' }}>
            <Spinner size={24} label="Loading students" />
        </div>
    </Section>
);

const menuTrigger = <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />;

export const MenuOneRow = () => (
    <DropdownMenu isOpen loading placement="bottom-start" minWidth="var(--menu-group-min-width)" trigger={menuTrigger} />
);

export const MenuSkeletonRows = () => (
    <DropdownMenu isOpen placement="bottom-start" minWidth="var(--menu-group-min-width)" trigger={menuTrigger}>
        <CustomItem aria-label="Loading option 1">
            <Skeleton shape="text" width="85%" isShimmering={false} />
        </CustomItem>
        <CustomItem aria-label="Loading option 2">
            <Skeleton shape="text" width="70%" isShimmering={false} />
        </CustomItem>
        <CustomItem aria-label="Loading option 3">
            <Skeleton shape="text" width="55%" isShimmering={false} />
        </CustomItem>
    </DropdownMenu>
);
