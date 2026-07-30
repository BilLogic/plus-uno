import React from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/messaging/Modal';
import './ConfirmationPopUp.scss';

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
 * Confirmation pop-up (Figma Modals · Confirmation Pop-up).
 * Types: exit | exit without saving | reflection submitted.
 *
 * @param {object} props
 */
const ConfirmationPopUp = ({
    show,
    type = 'exit-without-saving',
    onClose,
    onPrimary,
    onSecondary,
    renderAs = 'modal',
}) => {
    const copy = COPY[type] || COPY['exit-without-saving'];
    return (
        <Modal
            show={show}
            onClose={onClose}
            title={copy.title}
            body={<p className="body1-txt m-0" style={{ color: 'var(--color-on-surface)' }}>{copy.body}</p>}
            width={340}
            paddingSize="sm"
            gapSize="sm"
            radiusSize="sm"
            renderAs={renderAs}
            className="plus-modal--confirmation-popup"
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
    renderAs: PropTypes.oneOf(['modal', 'inline']),
};

export default ConfirmationPopUp;
