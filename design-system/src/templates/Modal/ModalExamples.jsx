import React, { useState } from 'react';
import { Button, FooterActions, SectionMessage } from '@/components';
import { Modal } from '@/templates';

/**
 * The Modal page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the stand-in screen they are drawn on lives in
 * `ModalCases.jsx`.
 */

const SessionNote = () => (
    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
        This removes Thursday’s session for Ana and her tutor.
    </p>
);

const DeleteSession = ({ width }) => (
    <Modal
        inline
        show
        width={width}
        title="Delete session?"
        footer={(
            <FooterActions>
                <Button text="Keep session" />
                <Button text="Delete session" appearance="danger" />
            </FooterActions>
        )}
    >
        <SessionNote />
    </Modal>
);

export const ConfirmNarrow = () => <DeleteSession width="4-col" />;

export const ConfirmWide = () => <DeleteSession width="10-col" />;

export const ConfirmsInside = () => {
    const [confirming, setConfirming] = useState(true);
    return (
        <Modal
            inline
            show
            title={confirming ? 'Delete session?' : 'Session details'}
            footer={(
                <FooterActions>
                    <Button text={confirming ? 'Back' : 'Keep session'} onClick={() => setConfirming(false)} />
                    <Button text="Delete session" appearance="danger" onClick={() => setConfirming(true)} />
                </FooterActions>
            )}
        >
            {confirming ? (
                <SectionMessage appearance="warning" dismissible={false}>
                    This removes Thursday’s session for Ana and her tutor. This cannot be undone.
                </SectionMessage>
            ) : (
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>Thursday · 4:00–5:00 PM with Ana Ruiz.</p>
            )}
        </Modal>
    );
};

export const ModalOnModal = () => (
    <>
        <Modal
            inline
            show
            title="Session details"
            footer={(
                <FooterActions>
                    <Button text="Keep session" />
                    <Button text="Delete session" appearance="danger" />
                </FooterActions>
            )}
        >
            <SessionNote />
        </Modal>
        <DeleteSession width="4-col" />
    </>
);
