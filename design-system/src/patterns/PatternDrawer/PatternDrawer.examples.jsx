import React from 'react';

import { Button } from '@/components';
import { Blanket, PatternDrawer, PatternModal } from '@/patterns';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';

/**
 * The do and don't examples on the Drawer docs page: the overlay at a 1024
 * stand-in screen, scaled down to the card. Stage sizes are docs geometry,
 * not design values. The stacking pair is the Blanket page's, imported
 * from `Blanket.examples.jsx`.
 */

const SCREEN = { width: 1024, height: 480 };

const text = (copy) => <p style={{ margin: 0, font: 'var(--body-default)' }}>{copy}</p>;

const footer = (primary, appearance = 'primary') => (
    <>
        <Button text="Back" spacing="compact" onClick={() => {}} />
        <Button text={primary} appearance={appearance} spacing="compact" onClick={() => {}} />
    </>
);

const Stage = ({ children }) => <ScaledPreview {...SCREEN}>{children}</ScaledPreview>;

const detailsDrawer = (width) => (
    <PatternDrawer
        inline
        screenWidth={SCREEN.width}
        screenHeight={SCREEN.height}
        width={width}
        title="Session details"
        description="Thursday · 4:00–5:00 PM"
        onClose={() => {}}
        footer={footer('Save changes')}
    >
        {text('Ana Ruiz · Algebra I · Room 204 with Jordan Lee.')}
    </PatternDrawer>
);

/** Do: a medium drawer for a form or detail, with the page still in view. */
export const MediumDrawer = () => <Stage>{detailsDrawer('md')}</Stage>;

/** Don't: the widest drawer, which covers most of the page. */
export const WideDrawer = () => <Stage>{detailsDrawer('lg')}</Stage>;

/** Do: a short decision in a small modal. */
export const DecisionInModal = () => (
    <Stage>
        <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>
            <PatternModal title="Discard changes?" width="sm" onClose={() => {}} footer={footer('Discard changes', 'danger')}>
                {text('Your edits to this session plan will be lost.')}
            </PatternModal>
        </Blanket>
    </Stage>
);

/** Don't: the same short decision in a full-height drawer. */
export const DecisionInDrawer = () => (
    <Stage>
        <PatternDrawer
            inline
            screenWidth={SCREEN.width}
            screenHeight={SCREEN.height}
            width="sm"
            title="Discard changes?"
            onClose={() => {}}
            footer={footer('Discard changes', 'danger')}
        >
            {text('Your edits to this session plan will be lost.')}
        </PatternDrawer>
    </Stage>
);
