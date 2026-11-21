import React, { useState } from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { inlineModals } from '@/storybook-docs/lib/inline-modals.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import { PanelOverlay } from '@/templates';
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

/** Puts the stage's host on each PanelOverlay in a printed example: the host is where the overlay opens, so a picture keeps it inside its box. */
const inHost = (node, host) => React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === PanelOverlay) return React.cloneElement(child, { container: host });
    if (child.props?.children) return React.cloneElement(child, undefined, inHost(child.props.children, host));
    return child;
});

/** A floating example in its stage: a positioned host the overlay opens in, over the page behind. */
const Floating = ({ example }) => {
    const [host, setHost] = useState(null);
    const element = example();
    return (
        <FloatStage>
            <div ref={setHost} style={{ position: 'relative', blockSize: '100%' }}>{inHost(element, host)}</div>
        </FloatStage>
    );
};

/** The Panel floats on its shadow and the page beside it stays undimmed. */
export const FloatsNoBlanket = () => <Floating example={Example.FloatsNoBlanket} />;

/** The same details in a Modal: a Blanket dims the whole page. */
export const PanelOnBlanket = () => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': `${FLOAT_STAGE}px` }}>
            {inlineModals(Example.DetailsInModal())}
        </div>
    </FitStage>
);

/** One Panel; another row swaps what it shows. */
export const OneFloatingPanel = () => <Floating example={Example.OneFloatingPanel} />;

/** Two Panels open at once, the second covering the first. */
export const TwoFloatingPanels = () => <Floating example={Example.TwoFloatingPanels} />;

/** Where each Panel sits on the demo stage: the docked AI panel at the end, the floating one on its shadow. */
const STAGE_END = { position: 'absolute', insetBlock: 0, insetInlineEnd: 0, display: 'flex', maxInlineSize: '100%' };
const STAGE_FLOATING = { ...STAGE_END, boxShadow: 'var(--ds-shadow-overlay)' };

/** The floating Panel sits beside the docked AI panel, both fully visible. A composition: the Frame has one Panel area, so this pair prints no code. */
export const BesideAiPanel = () => (
    <FloatStage>
        <Example.SessionsBehind />
        <div style={STAGE_END}><Example.AssistantPanel /></div>
        <div style={{ ...STAGE_FLOATING, insetInlineEnd: 'var(--panel-width-default)' }}><Example.DetailsPanel /></div>
    </FloatStage>
);

/** The floating Panel drawn over the docked AI panel, hiding part of it. */
export const CoversAiPanel = () => (
    <FloatStage>
        <Example.SessionsBehind />
        <div style={STAGE_END}><Example.AssistantPanel /></div>
        <div style={{ ...STAGE_FLOATING, insetInlineEnd: 'var(--inline-3xl)' }}><Example.DetailsPanel /></div>
    </FloatStage>
);
