/**
 * DeleteTutorModal Component
 * 
 * Confirmation modal for deleting a tutor.
 * Matches Figma: node-id=258-262383
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import Button from '../../../../../components/Button/Button';
import './DeleteTutorModal.scss';

const DeleteTutorModal = ({
    show = false,
    onHide,
    onDelete,
    className = '',
    ...props
}) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            className={`delete-tutor-modal ${className}`}
            {...props}
        >
            <div className="delete-tutor-modal__container">
                <h4 className="h4 delete-tutor-modal__title">Delete Tutor?</h4>
                <p className="body1-txt delete-tutor-modal__message">
                    All data related to this tutor will be removed. This tutor will lose access to the PLUS system.
                </p>
                <div className="delete-tutor-modal__actions">
                    <Button
                        text="Delete Tutor"
                        style="danger"
                        fill="text"
                        onClick={onDelete}
                        className="delete-tutor-modal__delete-btn"
                    />
                    <Button
                        text="Keep Tutor"
                        style="primary"
                        fill="filled"
                        onClick={onHide}
                    />
                </div>
            </div>
        </Modal>
    );
};

DeleteTutorModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
    onDelete: PropTypes.func,
    className: PropTypes.string,
};

export default DeleteTutorModal;
