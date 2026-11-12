import React from 'react';

import { Button, SectionMessage } from '@/components';
import { Backdrop, PatternDrawer, PatternModal } from '@/patterns';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';

/**
 * The do and don't examples on the Backdrop, Modal and Drawer docs pages: the
 * overlays at a 1024 stand-in screen, scaled down to the card. Stage sizes are
 * docs geometry, not design values.
 *
 * The stacking rule follows `lib/overlay.js`: a confirm Modal may open over a
 * Panel, a Popup or a focused task, with its own Backdrop, and a Modal never
 * opens on another Modal. The `ConfirmOverPanel` story draws it.
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

/** A second Backdrop over the first, as a stacked overlay is drawn. */
const Over = ({ children }) => (
    <Backdrop inline screenWidth={SCREEN.width} screenHeight={SCREEN.height} style={{ position: 'absolute', inset: 0 }}>
        {children}
    </Backdrop>
);

const settings = (
    <Backdrop inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>
        <PatternModal title="Session settings" width="lg" height="fill" onClose={() => {}} footer={footer('Save')}>
            {text('Thursday · 4:00–5:00 PM with Ana Ruiz.')}
        </PatternModal>
    </Backdrop>
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

/** Do: a Modal confirms inside itself, with a warning SectionMessage and the danger button. */
export const ModalConfirmsInside = () => (
    <Stage>
        <Backdrop inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>
            <PatternModal title="Delete session?" width="sm" onClose={() => {}} footer={footer('Delete session', 'danger')}>
                <SectionMessage appearance="warning">This removes the session for Ana and her tutor. This cannot be undone.</SectionMessage>
            </PatternModal>
        </Backdrop>
    </Stage>
);

/** Don't: a Modal opened on another Modal. */
export const ModalOverModal = () => (
    <Stage>
        {settings}
        <Over>{discard()}</Over>
    </Stage>
);

/** Do: a confirm on its own in the small width. */
export const ConfirmSmallDo = () => (
    <Stage>
        <Backdrop inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>{discard('sm')}</Backdrop>
    </Stage>
);

/** Don't: the same confirm in the large width. */
export const ConfirmSmallDont = () => (
    <Stage>
        <Backdrop inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>{discard('lg')}</Backdrop>
    </Stage>
);
