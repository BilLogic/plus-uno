import React from 'react';
import { openModals } from '@/storybook-docs/lib/inline-modals.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { SCREEN } from './modalDemo.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './ModalExamples.jsx';
import examplesSource from './ModalExamples.jsx?raw';

/**
 * The live do and don't examples on the Modal template page, composed from
 * `CaseBlanket`, `Dialog`, `FooterActions`, `ProgressTracker` and `Button`.
 */

/** The Show code for each example, read from `ModalExamples.jsx`. */
export const CODE = showCode(examplesSource, [
    'ConfirmNarrow',
    'ConfirmWide',
    'ConfirmsInside',
    'ModalOnModal',
    'FooterPinned',
    'ButtonInBody',
    'StepsWithBackAndNext',
    'NumberedTabsAsSteps',
]);

/** The stand-in screen the Blanket is drawn on, scaled to the example's card so the Modal's width step reads against it. */
const OnScreen = ({ children }) => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': '300px' /* demo frame */ }}>
            {children}
        </div>
    </FitStage>
);

/** A confirm at the narrow step: the title, one line and two buttons. */
export const ConfirmNarrow = () => <OnScreen>{openModals(Example.ConfirmNarrow())}</OnScreen>;

/** The same confirm at a wide step: empty width around one line. */
export const ConfirmWide = () => <OnScreen>{openModals(Example.ConfirmWide())}</OnScreen>;

/** One Modal that confirms inside itself, with a message and its own buttons. */
export const ConfirmsInside = () => <OnScreen>{openModals(Example.ConfirmsInside())}</OnScreen>;

/** A Modal opened on another Modal, a second Blanket dimming the first. */
export const ModalOnModal = () => <OnScreen>{openModals(Example.ModalOnModal())}</OnScreen>;

/** Past the cap the body scrolls while header and footer stay pinned. */
export const FooterPinnedModal = () => <OnScreen>{openModals(Example.FooterPinned())}</OnScreen>;

/** The Save button sits inside the scrolling body instead of a pinned footer. */
export const ButtonInBodyModal = () => <OnScreen>{openModals(Example.ButtonInBody())}</OnScreen>;

/** Sequential steps use ProgressTracker and Back / Next split across the footer. */
export const StepsFooterModal = () => <OnScreen>{openModals(Example.StepsWithBackAndNext())}</OnScreen>;

/** Numbered tabs used as steps with one Save button and no Back. */
export const TabsForStepsModal = () => <OnScreen>{openModals(Example.NumberedTabsAsSteps())}</OnScreen>;
