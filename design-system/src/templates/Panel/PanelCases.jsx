import React from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { inlineModals } from '@/storybook-docs/lib/inline-modals.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './PanelExamples.jsx';
import examplesSource from './PanelExamples.jsx?raw';

/**
 * The live do and don't examples of the Panel template page, built from
 * `PanelContainer`, `PanelHeader`, `PanelBody`, `PanelFooter` and `FooterActions`.
 */

/** The height of the stage a floating Panel sits in. Docs geometry, px. */
const FLOAT_STAGE = 440; // docs-literal

/** The stand-in screen width a Modal's Blanket is drawn at. Docs geometry, px. */
const SCREEN = { width: 1024 }; // docs-literal

const ReadingPanel = ({ children }) => (
    <CaseSurface padding="none" style={{ maxInlineSize: 'var(--panel-width-default)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <HeadingLevelContext.Provider value={4}>{children}</HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Reading: a header and a body, nothing to save. */
export const ReadingNoFooter = () => <ReadingPanel><Example.ReadingNoFooter /></ReadingPanel>;

/** The same Panel squeezed to a third of its default width. */
export const ReadingNarrow = () => <ReadingPanel><Example.ReadingNarrow /></ReadingPanel>;

/** A footer of buttons on a Panel that is only read. */
export const ReadingWithFooter = () => <ReadingPanel><Example.ReadingWithFooter /></ReadingPanel>;

/** The Show code for each example, read from `PanelExamples.jsx`. */
export const CODE = showCode(examplesSource, [
    'FloatsNoBlanket',
    'DetailsInModal',
    'OneFloatingPanel',
    'TwoFloatingPanels',
    'BesideAiPanel',
    'CoversAiPanel',
    'ReadingNoFooter',
    'ReadingNarrow',
    'ReadingWithFooter',
]);

/** The stage under floating Panels: a box that clips them, at the docs heading level, with room around the page behind. */
const FloatStage = ({ children }) => (
    <CaseSurface padding="none" style={{ position: 'relative', blockSize: FLOAT_STAGE, overflow: 'hidden', padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
        <HeadingLevelContext.Provider value={4}>
            {children}
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** The Panel floats on its shadow and the page beside it stays undimmed. */
export const FloatsNoBlanket = () => <FloatStage><Example.FloatsNoBlanket /></FloatStage>;

/** The same details in a Modal: a Blanket dims the whole page. */
export const PanelOnBlanket = () => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': `${FLOAT_STAGE}px` }}>
            {inlineModals(Example.DetailsInModal())}
        </div>
    </FitStage>
);

/** One Panel; another row swaps what it shows. */
export const OneFloatingPanel = () => <FloatStage><Example.OneFloatingPanel /></FloatStage>;

/** Two Panels open at once, the second covering the first. */
export const TwoFloatingPanels = () => <FloatStage><Example.TwoFloatingPanels /></FloatStage>;

/** The floating Panel sits beside the docked AI panel, both fully visible. */
export const BesideAiPanel = () => <FloatStage><Example.BesideAiPanel /></FloatStage>;

/** The floating Panel drawn over the docked AI panel, hiding part of it. */
export const CoversAiPanel = () => <FloatStage><Example.CoversAiPanel /></FloatStage>;
