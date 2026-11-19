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
import Blanket from '../Modal/Blanket';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { DetailsPanel, SessionsBehind } from './panelDemo.jsx';

/**
 * The live do and don't examples of the Panel template page, built from
 * `PanelContainer`, `PanelHeader`, `PanelBody`, `PanelFooter` and `FooterActions`.
 */

/** The height of the stage a floating Panel sits in. Docs geometry, px. */
const FLOAT_STAGE = 440; // docs-literal

/** How far a second Panel sits in from the first. Docs geometry, px. */
const SECOND_OFFSET = 48; // docs-literal

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

/** A floating Panel's place: the end of the stage, on the overlay fill with the overlay shadow. */
const FloatingPanel = ({ inset = 0, onTop = true }) => (
    <div
        style={{
            position: 'absolute',
            insetBlock: 0,
            insetInlineEnd: inset,
            zIndex: onTop ? 2 : 1,
            boxShadow: 'var(--ds-shadow-overlay)',
            display: 'flex',
            maxInlineSize: '100%',
        }}
    >
        <HeadingLevelContext.Provider value={4}>
            <DetailsPanel />
        </HeadingLevelContext.Provider>
    </div>
);

/** The page under floating Panels, in a box that clips them to the stage. */
const FloatStage = ({ children }) => (
    <CaseSurface padding="none" style={{ position: 'relative', blockSize: FLOAT_STAGE, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--page-pad)' }}><SessionsBehind /></div>
        {children}
    </CaseSurface>
);

/** The Panel floats on its shadow and the page beside it stays undimmed. */
export const FloatsNoBlanket = () => (
    <FloatStage><FloatingPanel /></FloatStage>
);

/** The same Panel with a Blanket dimming the whole page. */
export const PanelOnBlanket = () => (
    <FloatStage>
        <Blanket inline show style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
        <FloatingPanel />
    </FloatStage>
);

/** One Panel; another row swaps what it shows. */
export const OneFloatingPanel = FloatsNoBlanket;

/** Two Panels open at once, the second covering the first. */
export const TwoFloatingPanels = () => (
    <FloatStage>
        <FloatingPanel inset={SECOND_OFFSET} onTop={false} />
        <FloatingPanel />
    </FloatStage>
);

/** The docked AI panel: a Panel at the end of the stage, on the page and not floating. */
const DockedAiPanel = () => (
    <div style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0, zIndex: 1, display: 'flex', maxInlineSize: '100%' }}>
        <HeadingLevelContext.Provider value={4}>
            <PanelContainer>
                <PanelHeader title="Assistant" actions={<PanelCloseAction onClick={() => {}} />} />
                <PanelBody>
                    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                        Ben has missed two Thursday sessions. Want a note for his tutor?
                    </p>
                </PanelBody>
            </PanelContainer>
        </HeadingLevelContext.Provider>
    </div>
);

/** The floating Panel sits beside the docked AI panel, both fully visible. */
export const BesideAiPanel = () => (
    <FloatStage>
        <DockedAiPanel />
        <FloatingPanel inset="var(--panel-width-default)" />
    </FloatStage>
);

/** The floating Panel drawn over the docked AI panel, hiding part of it. */
export const CoversAiPanel = () => (
    <FloatStage>
        <DockedAiPanel />
        <FloatingPanel inset={SECOND_OFFSET} />
    </FloatStage>
);
