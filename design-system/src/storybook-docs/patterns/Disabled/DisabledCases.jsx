import React from 'react';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './DisabledExamples.jsx';
import examplesSource from './DisabledExamples.jsx?raw';

/**
 * The live do and don't examples on the Disabled pattern page: each one is an
 * example from `DisabledExamples.jsx`, staged here on a `CaseSurface` or in a
 * `DocsOverlayBoundary` that holds a layer open, and Show code prints the
 * example's own source.
 */

export const CODE = showCode(examplesSource, ['ReasonInCaption', 'ReasonInTooltip', 'LeftOutOfMenu', 'DimmedInMenu']);

/** A held-open menu centered in a boundary that gives its layer room. */
const MenuStage = ({ children }) => (
    <DocsOverlayBoundary fit={false} containHeight>
        <div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
    </DocsOverlayBoundary>
);

/** Do: the reason sits in visible caption text under the disabled field, at full contrast. */
export const ReasonInCaptionCase = () => (
    <CaseSurface><Example.ReasonInCaption /></CaseSurface>
);

/** Don't: the reason hides inside a tooltip on a disabled field, which never opens on touch. */
export const ReasonInTooltipCase = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <CaseSurface style={{ minBlockSize: 'calc(var(--control-lg) * 3)' }}>
            <Example.ReasonInTooltip />
        </CaseSurface>
    </DocsOverlayBoundary>
);

/** Do: actions a role can never take are left out of the menu. */
export const LeftOutOfMenuCase = () => <MenuStage><Example.LeftOutOfMenu /></MenuStage>;

/** Don't: dimming an action a role can never take leaves a dead row in the menu. */
export const DimmedInMenuCase = () => <MenuStage><Example.DimmedInMenu /></MenuStage>;
