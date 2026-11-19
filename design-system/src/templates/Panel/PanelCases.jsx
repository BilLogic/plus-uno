import React from 'react';
import { Button, FooterActions, StatusTag } from '@/components';
import {
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelFooter,
    PanelHeader,
    PanelSubheader,
} from '@/templates';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './PanelExamples.jsx';
import examplesSource from './PanelExamples.jsx?raw';

/**
 * The live do and don't examples of the Panel template page, built from
 * `PanelContainer`, `PanelHeader`, `PanelBody`, `PanelFooter` and `FooterActions`.
 */

/** The height of the stage a floating Panel sits in. Docs geometry, px. */
const FLOAT_STAGE = 440; // docs-literal

const ReadingPanel = ({ footer, inlineSize }) => (
    <CaseSurface
        padding="none"
        style={{
            maxInlineSize: inlineSize ?? 'var(--panel-width-default)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
        }}
    >
        <HeadingLevelContext.Provider value={4}>
            <PanelContainer>
                <PanelHeader title="Ben Okafor · Thu 5:00 PM" actions={<PanelCloseAction onClick={() => {}} />} />
                <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
                <PanelBody>
                    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                        Math · 60 minutes · Room 2. Ben worked through fractions last week.
                    </p>
                </PanelBody>
                {footer ? <PanelFooter>{footer}</PanelFooter> : null}
            </PanelContainer>
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Reading: a header and a body, nothing to save. */
export const ReadingNoFooter = () => <ReadingPanel />;

/** The same Panel squeezed to a third of its default width. */
export const ReadingNarrow = () => <ReadingPanel inlineSize="calc(var(--panel-width-default) / 3)" />;

/** A footer of buttons on a Panel that is only read. */
export const ReadingWithFooter = () => (
    <ReadingPanel
        footer={(
            <FooterActions>
                <Button text="Done" appearance="primary" onClick={() => {}} />
            </FooterActions>
        )}
    />
);

/** The Show code for each floating-Panel example, read from `PanelExamples.jsx`. */
const printed = showCode(examplesSource, [
    'FloatsNoBlanket',
    'PanelOnBlanket',
    'TwoFloatingPanels',
    'BesideAiPanel',
    'CoversAiPanel',
]);

/** One Panel is the same example as the one that floats with no Blanket. */
export const CODE = { ...printed, OneFloatingPanel: printed.FloatsNoBlanket };

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

/** The same Panel with a Blanket dimming the whole page. */
export const PanelOnBlanket = () => <FloatStage><Example.PanelOnBlanket /></FloatStage>;

/** One Panel; another row swaps what it shows. */
export const OneFloatingPanel = FloatsNoBlanket;

/** Two Panels open at once, the second covering the first. */
export const TwoFloatingPanels = () => <FloatStage><Example.TwoFloatingPanels /></FloatStage>;

/** The floating Panel sits beside the docked AI panel, both fully visible. */
export const BesideAiPanel = () => <FloatStage><Example.BesideAiPanel /></FloatStage>;

/** The floating Panel drawn over the docked AI panel, hiding part of it. */
export const CoversAiPanel = () => <FloatStage><Example.CoversAiPanel /></FloatStage>;
