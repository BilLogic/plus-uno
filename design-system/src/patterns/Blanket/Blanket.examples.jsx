import React from 'react';

import { Button } from '@/components';
import { Blanket, PatternDrawer, PatternModal } from '@/patterns';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';

/**
 * The do and don't examples on the Blanket, Modal and Drawer docs pages: the
 * overlays at a 1024 stand-in screen, scaled down to the card. Stage sizes are
 * docs geometry, not design values.
 *
 * The stacking rule follows `lib/overlay.js`: at most two overlays, a modal or
 * drawer and the confirm it raises. A confirm is a second Blanket over the
 * first, as the `NestedConfirm` story draws it.
 */

const SCREEN = { width: 1024, height: 480 };

const text = (copy) => <p style={{ margin: 0, font: 'var(--body-default)' }}>{copy}</p>;

const footer = (primary, appearance = 'primary') => (
    <>
        <Button text="Back" spacing="compact" onClick={() => {}} />
        <Button text={primary} appearance={appearance} spacing="compact" onClick={() => {}} />
    </>
);

const Stage = ({ children }) => (
    <ScaledPreview {...SCREEN}>
        <div style={{ position: 'relative' }}>{children}</div>
    </ScaledPreview>
);

/** A second Blanket over the first, as a stacked overlay is drawn. */
const Over = ({ children }) => (
    <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height} style={{ position: 'absolute', inset: 0 }}>
        {children}
    </Blanket>
);

const settings = (
    <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>
        <PatternModal title="Session settings" width="lg" height="fill" onClose={() => {}} footer={footer('Save')}>
            {text('Thursday · 4:00–5:00 PM with Ana Ruiz.')}
        </PatternModal>
    </Blanket>
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

const discard = (width = 'sm') => (
    <PatternModal title="Discard changes?" width={width} onClose={() => {}} footer={footer('Discard changes', 'danger')}>
        {text('Your edits to this session plan will be lost.')}
    </PatternModal>
);

const moveSession = (
    <PatternModal title="Move session" onClose={() => {}} footer={footer('Move session')}>
        {text('Move Thursday’s session to 4:30 PM?')}
    </PatternModal>
);

/** Do: a drawer and the confirm it raises, stacked over it. */
export const DrawerWithConfirm = () => (
    <Stage>
        {drawer}
        <Over>{discard()}</Over>
    </Stage>
);

/** Don't: a modal for an unrelated task opened over a drawer. */
export const DrawerWithUnrelatedModal = () => (
    <Stage>
        {drawer}
        <Over>{moveSession}</Over>
    </Stage>
);

/** Do: a modal and the confirm it raises, two overlays. */
export const ModalWithConfirm = () => (
    <Stage>
        {settings}
        <Over>{discard()}</Over>
    </Stage>
);

/** Don't: a third overlay, a drawer, over a modal and its confirm. */
export const ThirdOverlay = () => (
    <Stage>
        {settings}
        <Over>{discard()}</Over>
        <div style={{ position: 'absolute', inset: 0 }}>{drawer}</div>
    </Stage>
);

/** Do: a confirm on its own in the small width. */
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
