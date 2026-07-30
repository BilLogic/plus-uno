import React from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/messaging/Modal';

const COPY = {
    'exit-without-saving': {
        title: 'Exit without saving?',
        body: 'Any changes you made will be discarded.',
        secondary: 'Save & Exit',
        primary: 'Exit without saving',
    },
    exit: {
        title: 'Saved',
        body: 'Your progress was saved.',
        secondary: 'Continue Editing',
        primary: 'Exit',
    },
    'reflection-submitted': {
        title: 'Reflection submitted',
        body: 'Your reflection was submitted successfully.',
        secondary: 'Edit reflection',
        primary: 'Back to sessions',
    },
};

/**
 * Confirmation pop-up for the reflection form
 * (Figma: Confirmation Pop-up — exit | exit without saving | reflection submitted).
 *
 * Uses DS Modal with small primary/tonal secondary buttons and surface-container-high shell.
 *
 * @param {object} props
 * @param {boolean} props.show
 * @param {'exit-without-saving'|'exit'|'reflection-submitted'} [props.type='exit-without-saving']
 * @param {() => void} props.onClose
 * @param {() => void} [props.onPrimary]
 * @param {() => void} [props.onSecondary]
 */
const ConfirmationPopUp = ({
    show,
    type = 'exit-without-saving',
    onClose,
    onPrimary,
    onSecondary,
}) => {
    const copy = COPY[type] || COPY['exit-without-saving'];
    return (
        <Modal
            show={show}
            onClose={onClose}
            title={copy.title}
            body={copy.body}
            width={340}
            className="plus-modal--surface-container-high"
            style={{ backgroundColor: 'var(--color-surface-container-high, var(--color-surface))' }}
            primaryButton={{
                text: copy.primary,
                style: 'primary',
                fill: 'filled',
                size: 'small',
                onClick: onPrimary || onClose,
            }}
            secondaryButton={{
                text: copy.secondary,
                style: 'primary',
                fill: 'tonal',
                size: 'small',
                onClick: onSecondary || onClose,
            }}
        />
    );
};

ConfirmationPopUp.propTypes = {
    show: PropTypes.bool.isRequired,
    type: PropTypes.oneOf(['exit-without-saving', 'exit', 'reflection-submitted']),
    onClose: PropTypes.func.isRequired,
    onPrimary: PropTypes.func,
    onSecondary: PropTypes.func,
};

export default ConfirmationPopUp;
