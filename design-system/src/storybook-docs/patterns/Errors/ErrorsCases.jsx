import React, { useEffect, useRef } from 'react';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { inlineModals } from '@/storybook-docs/lib/inline-modals.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './ErrorsExamples.jsx';
import examplesSource from './ErrorsExamples.jsx?raw';

/**
 * The live do and don't examples on the Errors pattern page: each one is an
 * example from `ErrorsExamples.jsx`, staged here on a `CaseSurface` or over a
 * `CaseBlanket`, and Show code prints the example's own source.
 */

export const CODE = showCode(examplesSource, ['MessageOnField', 'BorderAndTooltip', 'FailureInSlot', 'FailureInModal']);

/** The stand-in screen the Modal example is drawn on. Docs geometry, px. */
const SCREEN = { width: 1024, height: 300 }; // docs-literal

/**
 * Do: the message sits right under the invalid field, in words that say what
 * to fix. The picture shows the field after a blur, since the message only
 * appears once the person has left the field.
 */
export const MessageOnFieldCase = () => {
    const ref = useRef(null);
    useEffect(() => {
        const input = ref.current?.querySelector('input');
        input?.focus();
        input?.blur();
    }, []);
    return (
        <CaseSurface>
            <div ref={ref}><Example.MessageOnField /></div>
        </CaseSurface>
    );
};

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

/** Don't: a Modal over the whole page to report one Section's failure, on a stand-in screen scaled to the card. */
export const FailureInModal = () => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': `${SCREEN.height}px` }}>
            {inlineModals(Example.FailureInModal())}
        </div>
    </FitStage>
);
