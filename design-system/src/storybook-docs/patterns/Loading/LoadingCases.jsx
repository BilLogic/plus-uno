import React from 'react';
import { CustomItem, IconButton, Skeleton, Spinner } from '@/components';
import { PatternSection } from '@/patterns';
import { LoadingList } from './loadingDemo.jsx';
import { LiveMenu } from '@/storybook-docs/lib/dropdown-menu-cases.jsx';

/**
 * The live do and don't examples on the Loading pattern page, composed from
 * `LiveMenu`, `CustomItem`, `IconButton` and `Skeleton`.
 */

const noop = () => {};
const menuTrigger = <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />;

/** Do: a menu that waits shows one "Loading options" row with a spinner. */
export const MenuOneRowCase = () => (
    <LiveMenu
        loading
        minWidth="var(--menu-group-min-width)"
        trigger={menuTrigger}
    />
);

/** Don't: a menu filled with skeleton rows promises items it may not have. */
export const MenuSkeletonRowsCase = () => (
    <LiveMenu
        minWidth="var(--menu-group-min-width)"
        trigger={menuTrigger}
    >
        <CustomItem aria-label="Loading option 1">
            <Skeleton shape="text" width="85%" isShimmering={false} />
        </CustomItem>
        <CustomItem aria-label="Loading option 2">
            <Skeleton shape="text" width="70%" isShimmering={false} />
        </CustomItem>
        <CustomItem aria-label="Loading option 3">
            <Skeleton shape="text" width="55%" isShimmering={false} />
        </CustomItem>
    </LiveMenu>
);

/** Do: a skeleton in the table's own shape, text bars throughout. */
export const SkeletonInShape = () => <LoadingList band="shape" />;

/** Don't: one spinner in a blank area, so the layout jumps when the rows arrive. */
export const SpinnerInBlank = () => (
    <PatternSection title="Students" description="Lincoln Middle">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minBlockSize: 'calc(var(--control-lg) * 4)' }}>
            <Spinner size={24} label="Loading students" />
        </div>
    </PatternSection>
);
