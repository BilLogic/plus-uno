import React from 'react';
import PropTypes from 'prop-types';
import ConfirmationPopUp from '../ConfirmationPopUp/ConfirmationPopUp';

/**
 * Back-compat wrapper — prefer ConfirmationPopUp with type="exit-without-saving".
 * Kept so existing stories / prototype imports keep working.
 *
 * @param {object} props
 */
const SaveAndExitModal = ({
    show,
    onClose,
    onExitWithoutSaving,
    onSaveAndExit,
    title,
    body,
}) => (
    <ConfirmationPopUp
        show={show}
        type="exit-without-saving"
        onClose={onClose}
        onPrimary={onExitWithoutSaving}
        onSecondary={onSaveAndExit}
        // title/body ignored — ConfirmationPopUp owns Figma copy
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
