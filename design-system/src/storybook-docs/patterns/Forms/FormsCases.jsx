import React from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseBlanket, CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import { Skeleton } from '@/components';
import { Section } from '@/templates';
import * as Example from './FormsExamples.jsx';
import examplesSource from './FormsExamples.jsx?raw';

/**
 * The live do and don't examples on the Forms pattern page: each one is an
 * example from `FormsExamples.jsx`, staged here, and Show code prints the
 * example's own source. The stage (a surface, the rows a Blanket covers, the
 * stand-in screen) is docs-only and never printed.
 */

export const CODE = showCode(examplesSource, ['OneColumnFields', 'TwoColumnFields', 'EditInPanel', 'EditInModal', 'ErrorOnField', 'ErrorInSecondDialog']);

/** The height of the stage the edit sits in. Docs geometry, px. */
const EDIT_STAGE = 420; // docs-literal

/** The stand-in screen the two Modal examples are drawn on. Docs geometry, px. */
const SCREEN = { width: 1024, height: 320 }; // docs-literal

/** The stand-in screen a Modal's Blanket is drawn on, scaled to the example's card. */
const OnScreen = ({ children }) => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': `${SCREEN.height}px` }}>
            {children}
        </div>
    </FitStage>
);

/** The page rows a Modal's Blanket covers; the Panel example carries its own. */
const Behind = () => (
    <div style={{ padding: 'var(--page-pad)' }}>
        <Section title="Sessions"><Skeleton preset="text" lines={3} /></Section>
    </div>
);

/** One column down, pairing only date and time that belong together. */
export const OneColumnFields = () => (
    <CaseSurface><Example.OneColumnFields /></CaseSurface>
);

/** Unrelated fields scattered across two columns so the eye zigzags. */
export const TwoColumnFields = () => (
    <CaseSurface><Example.TwoColumnFields /></CaseSurface>
);

/** A short edit in a Panel: the rows stay in view beside it. */
export const EditInPanel = () => (
    <HeadingLevelContext.Provider value={4}>
        <CaseSurface padding="none" style={{ display: 'flex', blockSize: EDIT_STAGE, overflow: 'hidden' }}>
            <Example.EditInPanel />
        </CaseSurface>
    </HeadingLevelContext.Provider>
);

/** The same short edit in a Modal: its Blanket covers the rows. */
export const EditInModal = () => (
    <HeadingLevelContext.Provider value={4}>
        <CaseSurface padding="none" style={{ position: 'relative', blockSize: EDIT_STAGE, overflow: 'hidden' }}>
            <Behind />
            <div style={{ position: 'absolute', inset: 0 }}>
                <CaseBlanket height={EDIT_STAGE}>
                    <Example.EditInModal />
                </CaseBlanket>
            </div>
        </CaseSurface>
    </HeadingLevelContext.Provider>
);

/** Do: the message under the field, in the same Modal. */
export const ErrorOnField = () => <OnScreen><Example.ErrorOnField /></OnScreen>;

/** Don't: a second dialog over the first, with the field left unexplained. */
export const ErrorInSecondDialog = () => <OnScreen><Example.ErrorInSecondDialog /></OnScreen>;
