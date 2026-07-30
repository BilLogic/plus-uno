import React from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/messaging/Modal';

/**
 * Save & Exit confirmation for the post-session reflection flow.
 * Matches the Figma scrim: leave without saving vs save and leave.
 *
 * @param {object} props
 * @param {boolean} props.show - Controls modal visibility
 * @param {() => void} props.onClose - Close / dismiss handler
 * @param {() => void} [props.onExitWithoutSaving] - Discard and leave
 * @param {() => void} [props.onSaveAndExit] - Persist draft and leave
 * @param {string} [props.title='Save & Exit?'] - Modal title
 * @param {string} [props.body] - Modal body copy
 */
const SaveAndExitModal = ({
    show,
    onClose,
    onExitWithoutSaving,
    onSaveAndExit,
    title = 'Save & Exit?',
    body = 'Your progress will be saved as a draft so you can finish this reflection later.',
}) => (
    <Modal
        show={show}
        onClose={onClose}
        title={title}
        body={body}
        width={420}
        primaryButton={{
            text: 'Save & Exit',
            onClick: onSaveAndExit,
        }}
        secondaryButton={{
            text: 'Exit without saving',
            onClick: onExitWithoutSaving,
        }}
    />
);

SaveAndExitModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onExitWithoutSaving: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    title: PropTypes.string,
    body: PropTypes.string,
};

export default SaveAndExitModal;
