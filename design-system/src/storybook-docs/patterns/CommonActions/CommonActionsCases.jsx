import React from 'react';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './CommonActionsExamples.jsx';
import examplesSource from './CommonActionsExamples.jsx?raw';

/**
 * The live do and don't examples on the Common actions pattern page: each one
 * is an example from `CommonActionsExamples.jsx`, staged here on a
 * `CaseSurface` or a stand-in screen, and Show code prints the example's own
 * source.
 */

export const CODE = showCode(examplesSource, ['OnePrimary', 'TwoPrimaries', 'PageButtonsLeft', 'PageButtonsFarRight', 'ModalFooterTracks', 'ModalFooterInset']);

/** The stand-in screen a Modal example is drawn on. Docs geometry, px. */
const SCREEN = { width: 1024, height: 300 }; // docs-literal

const OnSurface = ({ children }) => <CaseSurface>{children}</CaseSurface>;

const OnScreen = ({ children }) => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': `${SCREEN.height}px` }}>
            {children}
        </div>
    </FitStage>
);

/** Do: one Primary, with the second action Default beside it. */
export const OnePrimaryCase = () => <OnSurface><Example.OnePrimary /></OnSurface>;

/** Don't: two Primary buttons in one row; neither reads as the next step. */
export const TwoPrimariesCase = () => <OnSurface><Example.TwoPrimaries /></OnSurface>;

/** Do: Primary first, then Cancel, left-aligned under the fields. */
export const PageButtonsLeftCase = () => <OnSurface><Example.PageButtonsLeft /></OnSurface>;

/** Don't: buttons pushed to the far end of the page, away from the fields, with Primary last. */
export const PageButtonsFarRightCase = () => <OnSurface><Example.PageButtonsFarRight /></OnSurface>;

/** Do: two buttons filling the Modal footer's four equal tracks. */
export const ModalFooterTracksCase = () => <OnScreen><Example.ModalFooterTracks /></OnScreen>;

/** Don't: small buttons inset at the end, with spare footer around them. */
export const ModalFooterInsetCase = () => <OnScreen><Example.ModalFooterInset /></OnScreen>;
