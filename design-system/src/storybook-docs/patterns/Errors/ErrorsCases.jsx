import React from 'react';
import { CaseBlanket, CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './ErrorsExamples.jsx';
import examplesSource from './ErrorsExamples.jsx?raw';

/**
 * The live do and don't examples on the Errors pattern page: each one is an
 * example from `ErrorsExamples.jsx`, staged here on a `CaseSurface` or over a
 * `CaseBlanket`, and Show code prints the example's own source.
 */

export const CODE = showCode(examplesSource, ['MessageOnField', 'BorderAndTooltip', 'FailureInSlot', 'FailureInModal']);

/** Do: the message sits right under the invalid field, in words that say what to fix. */
export const MessageOnFieldCase = () => (
    <CaseSurface>
        <Example.MessageOnField />
    </CaseSurface>
);

/** Don't: a red border alone, with the error words hidden inside a tooltip layer. */
export const BorderAndTooltipCase = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <CaseSurface style={{ minBlockSize: 'calc(var(--control-lg) * 3)' }}>
            <Example.BorderAndTooltip />
        </CaseSurface>
    </DocsOverlayBoundary>
);

/** Do: the failure in the Section's slot, with its header rows and the rest of the page still working. */
export const FailureInSlot = () => <Example.FailureInSlot />;

/** Don't: a Modal over the whole page to report one Section's failure. */
export const FailureInModal = () => (
    <CaseBlanket height={300}>
        <Example.FailureInModal />
    </CaseBlanket>
);
