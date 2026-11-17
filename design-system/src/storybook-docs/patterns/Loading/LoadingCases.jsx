import React from 'react';
import { CustomItem, DropdownMenu, IconButton, Skeleton } from '@/components';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';

/**
 * The live do and don't examples on the Loading pattern page, composed from
 * `DropdownMenu`, `CustomItem`, `IconButton`, `Skeleton` and
 * `DocsOverlayBoundary`.
 */

const noop = () => {};
const MENU_ROOM = 200; // docs-literal: room for the open menu below the trigger

const MenuStage = ({ children }) => (
    <DocsOverlayBoundary fit={false} containHeight>
        <div style={{ display: 'flex', justifyContent: 'center', minBlockSize: MENU_ROOM, paddingBlockStart: 'var(--pad-y-sm)' }}>
            {children}
        </div>
    </DocsOverlayBoundary>
);

/** Do: a menu that waits shows one "Loading options" row with a spinner. */
export const MenuOneRowCase = () => (
    <MenuStage>
        <DropdownMenu
            isOpen
            onOpenChange={noop}
            loading
            placement="bottom-start"
            minWidth="var(--menu-group-min-width)"
            trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
        />
    </MenuStage>
);

/** Don't: a menu filled with skeleton rows promises items it may not have. */
export const MenuSkeletonRowsCase = () => (
    <MenuStage>
        <DropdownMenu
            isOpen
            onOpenChange={noop}
            placement="bottom-start"
            minWidth="var(--menu-group-min-width)"
            trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
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
        </DropdownMenu>
    </MenuStage>
);
