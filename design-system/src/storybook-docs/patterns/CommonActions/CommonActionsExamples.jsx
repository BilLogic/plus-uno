import React from 'react';
import { Button, ButtonGroup, Fieldset, FooterActions, TextField } from '@/components';
import { Modal } from '@/templates';

/**
 * The Common actions page's do and don't examples, as PLUS parts only. Show
 * code prints each one from this file; the surface and stand-in screen that
 * hold them live in `CommonActionsCases.jsx`.
 */

const buttonRow = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--stack-md)',
    marginBlockStart: 'var(--stack-lg)',
};

export const OnePrimary = () => (
    <>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
        </Fieldset>
        <div style={buttonRow}>
            <Button appearance="primary" text="Save session" />
            <Button appearance="default" text="Save draft" />
        </div>
    </>
);

export const TwoPrimaries = () => (
    <>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
        </Fieldset>
        <div style={buttonRow}>
            <Button appearance="primary" text="Save session" />
            <Button appearance="primary" text="Save draft" />
        </div>
    </>
);

export const PageButtonsLeft = () => (
    <>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
            <TextField label="Site" defaultValue="Lincoln Middle" />
        </Fieldset>
        <div style={{ ...buttonRow, justifyContent: 'flex-start' }}>
            <Button appearance="primary" text="Save session" />
            <Button appearance="subtle" text="Cancel" />
        </div>
    </>
);

export const PageButtonsFarRight = () => (
    <>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
            <TextField label="Site" defaultValue="Lincoln Middle" />
        </Fieldset>
        <div style={{ ...buttonRow, justifyContent: 'flex-end' }}>
            <Button appearance="subtle" text="Cancel" />
            <Button appearance="primary" text="Save session" />
        </div>
    </>
);

export const ModalFooterTracks = () => (
    <Modal
        inline
        show
        width="4-col"
        title="Log a session"
        onClose={() => {}}
        footer={(
            <FooterActions>
                <Button text="Discard" />
                <Button text="Save session" appearance="primary" />
            </FooterActions>
        )}
    >
        <TextField label="Student" defaultValue="Ana Ruiz" />
    </Modal>
);

export const ModalFooterInset = () => (
    <Modal
        inline
        show
        width="4-col"
        title="Log a session"
        onClose={() => {}}
        footer={(
            <ButtonGroup label="Actions">
                <Button text="Discard" spacing="compact" />
                <Button text="Save session" appearance="primary" spacing="compact" />
            </ButtonGroup>
        )}
    >
        <TextField label="Student" defaultValue="Ana Ruiz" />
    </Modal>
);
