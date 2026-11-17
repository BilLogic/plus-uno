import React from 'react';
import { ButtonItem, IconButton, Select, Tooltip } from '@/components';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { LiveMenu } from '@/storybook-docs/lib/dropdown-menu-cases.jsx';

/**
 * The live do and don't examples on the Disabled pattern page, composed from
 * `Select`, `Tooltip`, `LiveMenu`, `ButtonItem`, `IconButton`, `CaseSurface`
 * and `DocsOverlayBoundary`.
 */

const noop = () => {};

/** Do: the reason sits in visible caption text under the disabled field, at full contrast. */
export const ReasonInCaptionCase = () => (
    <CaseSurface>
        <Select
            label="Group"
            options={[]}
            value={null}
            onChange={noop}
            isDisabled
            caption="Choose a school first."
        />
    </CaseSurface>
);

/** Don't: the reason hides inside a tooltip on a disabled field, which never opens on touch. */
export const ReasonInTooltipCase = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <CaseSurface style={{ minBlockSize: 'calc(var(--control-lg) * 3)' }}>
            <Tooltip text="Choose a school first." placement="bottom" show>
                <div style={{ inlineSize: '100%' }}>
                    <Select
                        label="Group"
                        options={[]}
                        value={null}
                        onChange={noop}
                        isDisabled
                    />
                </div>
            </Tooltip>
        </CaseSurface>
    </DocsOverlayBoundary>
);

/** Do: actions a role can never take are left out of the menu. */
export const LeftOutOfMenuCase = () => (
    <LiveMenu
        minWidth="var(--menu-group-min-width)"
        trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
    >
        <ButtonItem onClick={noop}>Edit</ButtonItem>
        <ButtonItem onClick={noop}>Remove from group</ButtonItem>
    </LiveMenu>
);

/** Don't: dimming an action a role can never take leaves a dead row in the menu. */
export const DimmedInMenuCase = () => (
    <LiveMenu
        minWidth="var(--menu-group-min-width)"
        trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
    >
        <ButtonItem onClick={noop}>Edit</ButtonItem>
        <ButtonItem onClick={noop}>Remove from group</ButtonItem>
        <ButtonItem isDisabled onClick={noop}>Delete school</ButtonItem>
    </LiveMenu>
);
