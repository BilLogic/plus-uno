import React from 'react';
import { CustomItem, DropdownMenu, IconButton, SearchField, Skeleton, Spinner, Tabs } from '@/components';
import { Section } from '@/templates';

/**
 * The Loading page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the surface that holds them lives in
 * `LoadingCases.jsx`.
 */

const SkeletonRows = () => (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        {[0, 1, 2, 3].map((row) => (
            <div key={row} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', gap: 'var(--inline-lg)', alignItems: 'center' }}>
                <Skeleton shape="text" />
                <Skeleton shape="text" />
                <Skeleton shape="text" />
            </div>
        ))}
    </div>
);

export const SkeletonInShape = () => (
    <Section
        title="Students"
        description="Lincoln Middle"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
            </Tabs>
        )}
        search={<SearchField mode="active" spacing="compact" placeholder="Search students" />}
    >
        <section aria-label="Students" aria-busy="true">
            <SkeletonRows />
        </section>
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
    <DropdownMenu
        // isOpen forces the menu open so the page can show it; a real menu opens from its trigger.
        isOpen
        isLoading
        placement="bottom-start" minWidth="var(--menu-group-min-width)"
        trigger={menuTrigger}
    />
);

export const MenuSkeletonRows = () => (
    <DropdownMenu
        // isOpen forces the menu open so the page can show it; a real menu opens from its trigger.
        isOpen
        placement="bottom-start"
        minWidth="var(--menu-group-min-width)"
        trigger={menuTrigger}
    >
        <CustomItem aria-label="Loading option 1">
            <Skeleton shape="text" isShimmering={false} />
        </CustomItem>
        <CustomItem aria-label="Loading option 2">
            <Skeleton shape="text" isShimmering={false} />
        </CustomItem>
        <CustomItem aria-label="Loading option 3">
            <Skeleton shape="text" isShimmering={false} />
        </CustomItem>
    </DropdownMenu>
);
