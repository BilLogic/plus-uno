import React from 'react';
import { CustomItem, DropdownMenu, IconButton, SearchField, Skeleton, Spinner } from '@/components';
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
        search={<SearchField mode="active" spacing="compact" placeholder="Search students" />}
    >
        <section aria-label="Students" aria-busy="true">
            <SkeletonRows />
        </section>
        <span role="status" className="visually-hidden">Loading students…</span>
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
        isLoading
        placement="bottom-end" minWidth="var(--menu-group-min-width)"
        trigger={menuTrigger}
    />
);

export const MenuSkeletonRows = () => (
    <DropdownMenu
        placement="bottom-end"
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
