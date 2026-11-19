import React from 'react';
import { CustomItem, IconButton, Skeleton } from '@/components';
import { LiveMenu } from '@/storybook-docs/lib/dropdown-menu-cases.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './LoadingExamples.jsx';
import examplesSource from './LoadingExamples.jsx?raw';

/**
 * The live do and don't examples on the Loading pattern page, composed from
 * `LiveMenu`, `CustomItem`, `IconButton` and `Skeleton`; the two table
 * examples are `LoadingExamples.jsx`, which Show code prints.
 */

export const CODE = showCode(examplesSource, ['SkeletonInShape', 'SpinnerInBlank']);

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
export const SkeletonInShape = () => <Example.SkeletonInShape />;

/** Don't: one spinner in a blank area, so the layout jumps when the rows arrive. */
export const SpinnerInBlank = () => <Example.SpinnerInBlank />;
