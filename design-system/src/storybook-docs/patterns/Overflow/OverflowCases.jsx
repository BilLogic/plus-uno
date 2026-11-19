import React from 'react';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './OverflowExamples.jsx';
import examplesSource from './OverflowExamples.jsx?raw';

/**
 * The live do and don't examples on the Overflow pattern page: each one is an
 * example from `OverflowExamples.jsx`, staged on a `CaseSurface`, and Show code
 * prints the example's own source.
 */

export const CODE = showCode(examplesSource, [
    'WrappedSectionTitle', 'ClippedSectionTitle', 'ClippedCellOpensText', 'ClippedCellNoText', 'ShowMoreWithCount', 'FadedList',
]);

/** Do: a long Section title wraps to a second line so the list stays named. */
export const WrappedSectionTitleCase = () => <CaseSurface><Example.WrappedSectionTitle /></CaseSurface>;

/** Don't: cutting the Section title to one line hides what the list holds. */
export const ClippedSectionTitleCase = () => <CaseSurface><Example.ClippedSectionTitle /></CaseSurface>;

/** Do: a clipped cell opens its full text in a Tooltip on hover and focus only while clipped. */
export const ClippedCellOpensTextCase = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <CaseSurface><Example.ClippedCellOpensText /></CaseSurface>
    </DocsOverlayBoundary>
);

/** Don't: a clipped cell without a Tooltip leaves the rest of the value unreadable. */
export const ClippedCellNoTextCase = () => <CaseSurface><Example.ClippedCellNoText /></CaseSurface>;

/** Do: a "Show n more" control names what is left and expands the list in place. */
export const ShowMoreWithCountCase = () => <CaseSurface><Example.ShowMoreWithCount /></CaseSurface>;

/** Don't: fading a list out hides how many items remain and gives no way to reveal them. */
export const FadedListCase = () => <CaseSurface><Example.FadedList /></CaseSurface>;
