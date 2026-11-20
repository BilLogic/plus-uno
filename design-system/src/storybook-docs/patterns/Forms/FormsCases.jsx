import React from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { inlineModals } from '@/storybook-docs/lib/inline-modals.jsx';
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

export const CODE = showCode(examplesSource, [
    'OneColumnFields', 'TwoColumnFields', 'EditInPanel', 'EditInModal', 'ErrorOnField', 'ErrorInSecondDialog',
    'MinorityMarked', 'MajorityMarked', 'HelpInCaption', 'HelpInTooltip',
]);

/** The height of the stage the edit sits in. Docs geometry, px. */
const EDIT_STAGE = 420; // docs-literal

/** The stand-in screen's height for the Modal edit, tall enough for the three fields to show. Docs geometry, px. */
const EDIT_SCREEN = 560; // docs-literal

/** The stand-in screen the two Modal examples are drawn on. Docs geometry, px. */
const SCREEN = { width: 1024, height: 320 }; // docs-literal

/** The stand-in screen a Modal's Blanket is drawn on, scaled to the example's card. */
const OnScreen = ({ children, height = SCREEN.height }) => (
    <FitStage width={SCREEN.width} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN.width}px`, '--plus-overlay-screen-height': `${height}px` }}>
            {children}
        </div>
    </FitStage>
);

/** The page rows a Modal's Blanket covers; the Panel example carries its own. */
const Behind = () => (
    <div style={{ padding: 'var(--page-pad)' }}>
        <Section title="Sessions"><Skeleton shape="text" lines={3} /></Section>
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

/** A short edit in a Panel: the rows take what the Panel leaves, so they stay in view beside it. */
export const EditInPanel = () => (
    <HeadingLevelContext.Provider value={4}>
        <CaseSurface padding="none" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', blockSize: EDIT_STAGE, overflow: 'hidden' }}>
            <Example.EditInPanel />
        </CaseSurface>
    </HeadingLevelContext.Provider>
);

/** The same short edit in a Modal: its Blanket covers the rows, which share the Blanket's cell. */
export const EditInModal = () => (
    <HeadingLevelContext.Provider value={4}>
        <OnScreen height={EDIT_SCREEN}>
            <div style={{ gridArea: '1 / 1', padding: 'var(--page-pad)', background: 'var(--ds-surface)' }}><Behind /></div>
            {inlineModals(Example.EditInModal())}
        </OnScreen>
    </HeadingLevelContext.Provider>
);

/** Do: the message under the field, in the same Modal. */
export const ErrorOnField = () => <OnScreen>{inlineModals(Example.ErrorOnField())}</OnScreen>;

/** Don't: a second dialog over the first, with the field left unexplained. */
export const ErrorInSecondDialog = () => <OnScreen>{inlineModals(Example.ErrorInSecondDialog())}</OnScreen>;

/** The fields sit in one column, as they do in a Modal body or a Panel. */
const FieldColumn = ({ children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', inlineSize: '100%' }}>{children}</div>
);

/** Do: two required fields stay unmarked; the lone optional field carries `(optional)`. */
export const MinorityMarked = () => <FieldColumn><Example.MinorityMarked /></FieldColumn>;

/** Don't: marking the majority case repeats `(required)` on nearly every label. */
export const MajorityMarked = () => <FieldColumn><Example.MajorityMarked /></FieldColumn>;

/** Do: standing help stays in the caption under the field, still visible after typing. */
export const HelpInCaptionCase = () => <FieldColumn><Example.HelpInCaption /></FieldColumn>;

/** Don't: help placed only in an info tooltip beside the label disappears on touch and while typing. */
export const HelpInTooltipCase = () => <FieldColumn><Example.HelpInTooltip /></FieldColumn>;
