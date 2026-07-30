import React, { useState } from 'react';
import Button from '@/components/actions/Button';
import ConfirmationPopUp from './ConfirmationPopUp';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Modals/Confirmation Pop-up',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Local organism — Confirmation Pop-up. type: exit (after Save & Exit) | exit without saving (Cancel with dirty form).',
            },
        },
    },
};

/**
 * @param {'exit-without-saving'|'exit'} type
 */
function ModalDemo({ type }) {
    const [show, setShow] = useState(true);
    return (
        <div style={{ minHeight: '280px' }}>
            {!show && (
                <Button
                    text={`Open ${type}`}
                    style="primary"
                    fill="filled"
                    onClick={() => setShow(true)}
                />
            )}
            <ConfirmationPopUp
                show={show}
                type={type}
                onClose={() => setShow(false)}
                onPrimary={() => setShow(false)}
                onSecondary={() => setShow(false)}
            />
        </div>
    );
}

/** Triggered by Cancel when there are unsaved changes. */
export const ExitWithoutSaving = {
    name: 'Exit without saving',
    render: () => <ModalDemo type="exit-without-saving" />,
};

/** Triggered after Save & Exit succeeds. */
export const ExitSaved = {
    name: 'Exit (saved)',
    render: () => <ModalDemo type="exit" />,
};
