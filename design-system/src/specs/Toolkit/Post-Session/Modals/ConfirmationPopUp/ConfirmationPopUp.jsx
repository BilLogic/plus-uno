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
};

/**
 * Confirmation pop-up for leaving the reflection form
 * (Figma: Confirmation Pop-up — type: exit | exit without saving).
 *
 * @param {object} props
 * @param {boolean} props.show
 * @param {'exit-without-saving'|'exit'} [props.type='exit-without-saving']
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
            primaryButton={{
                text: copy.primary,
                onClick: onPrimary || onClose,
            }}
            secondaryButton={{
                text: copy.secondary,
                onClick: onSecondary || onClose,
            }}
        />
    );
};

ConfirmationPopUp.propTypes = {
    show: PropTypes.bool.isRequired,
    type: PropTypes.oneOf(['exit-without-saving', 'exit']),
    onClose: PropTypes.func.isRequired,
    onPrimary: PropTypes.func,
    onSecondary: PropTypes.func,
};

export default ConfirmationPopUp;
