import React from 'react';

import { Button } from '@/components';
import Blanket from '@/patterns/Blanket';
import PatternModal from '@/patterns/PatternModal';
import PatternDrawer from '@/patterns/PatternDrawer';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';

/**
 * The do and don't examples on the Blanket docs page: the Blanket at a 1024
 * stand-in screen, scaled down to the card. Stage sizes are docs geometry,
 * not design values.
 */

const SCREEN = { width: 1024, height: 480 };

const text = (copy) => <p style={{ margin: 0, font: 'var(--body-default)' }}>{copy}</p>;

const footer = (primary, appearance = 'primary') => (
    <>
        <Button text="Back" spacing="compact" onClick={() => {}} />
        <Button text={primary} appearance={appearance} spacing="compact" onClick={() => {}} />
    </>
);

const settings = (
    <PatternModal title="Session settings" width="lg" height="fill" onClose={() => {}} footer={footer('Save')}>
        {text('Thursday · 4:00–5:00 PM with Ana Ruiz.')}
    </PatternModal>
);

const discard = (width) => (
    <PatternModal title="Discard changes?" width={width} onClose={() => {}} footer={footer('Discard changes', 'danger')}>
        {text('Your edits to this session plan will be lost.')}
    </PatternModal>
);

const Stage = ({ children }) => <ScaledPreview {...SCREEN}>{children}</ScaledPreview>;

/** Do: the confirm takes the modal's place in the one Blanket. */
export const OneBlanketDo = () => (
    <Stage>
        <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>{discard('sm')}</Blanket>
    </Stage>
);

/** Don't: a second Blanket over the first, with the confirm on top of the modal. */
export const OneBlanketDont = () => (
    <Stage>
        <div style={{ position: 'relative' }}>
            <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>{settings}</Blanket>
            <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height} style={{ position: 'absolute', inset: 0 }}>
                {discard('sm')}
            </Blanket>
        </div>
    </Stage>
);

/** Do: a confirm in the small width. */
export const ConfirmSmallDo = () => (
    <Stage>
        <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>{discard('sm')}</Blanket>
    </Stage>
);

/** Don't: the same confirm in the large width. */
export const ConfirmSmallDont = () => (
    <Stage>
        <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>{discard('lg')}</Blanket>
    </Stage>
);

const drawer = (
    <PatternDrawer
        inline
        screenWidth={SCREEN.width}
        screenHeight={SCREEN.height}
        placement="end"
        title="Session details"
        description="Thursday · 4:00–5:00 PM"
        onClose={() => {}}
        footer={footer('Save changes')}
    >
        {text('Ana and her tutor get an email when the time changes.')}
    </PatternDrawer>
);

/** Do: one drawer over the page. */
export const OneOverlayDo = () => <Stage>{drawer}</Stage>;

/** Don't: a modal open over the drawer. */
export const OneOverlayDont = () => (
    <Stage>
        <div style={{ position: 'relative' }}>
            {drawer}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
                    {text('Move Thursday’s session to 4:30 PM?')}
                </PatternModal>
            </div>
        </div>
    </Stage>
);
