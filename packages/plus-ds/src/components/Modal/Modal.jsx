import React from 'react';
import PropTypes from 'prop-types';
import BootstrapModal from 'react-bootstrap/Modal';
import Button from '@/components/Button';

/**
 * Modal component for PLUS design system.
 * Universal modal component for creating dialog windows that overlay the main content.
 *
 * Note: This component is wrapped in a react-bootstrap Modal under the hood to handle
 * automatic overlay creation, backdrop clicking, and centering.
 */
const Modal = ({
    id,
    title,
    body,
    type = 'default',
    showBottomButtons = true,
    primaryButton,
    secondaryButton,
    show = false,
    onClose,
    backdrop = true,
    keyboard = true,
    centered = true,
    paddingSize,
    gapSize,
    radiusSize = 'md',
    width = 340,
    className = '',
    style,
    children,
    ...props
}) => {
    // Set padding and gap based on type if not explicitly provided
    const effectivePaddingSize = paddingSize || ((type === 'scrollable' && showBottomButtons) ? 'md' : 'sm');
    const effectiveGapSize = gapSize || ((type === 'scrollable' && showBottomButtons) ? 'md' : 'sm');

    const bodyOnly = !title && !showBottomButtons;

    const classes = [
        'plus-modal',
        type === 'scrollable' ? 'plus-modal-scrollable' : 'plus-modal-default',
        `plus-modal-pad-${effectivePaddingSize}`,
        `plus-modal-gap-${effectiveGapSize}`,
        radiusSize ? `plus-modal-radius-${radiusSize}` : '',
        showBottomButtons ? 'plus-modal-with-buttons' : 'plus-modal-no-buttons',
        bodyOnly ? 'plus-modal-body-only' : '',
        className
    ].filter(Boolean).join(' ');

    const modalStyle = {
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        ...style,
    };

    const closeBtnClass = showBottomButtons ? 'plus-modal-close-btn-h5' : 'plus-modal-close-btn-h3';

    const modalContent = (
        <div id={id} className={classes} style={modalStyle} {...props}>
            {!bodyOnly && (
                <>
                    <div className="plus-modal-header">
                        {title && <div className="plus-modal-title h5">{title}</div>}
                        <button
                            type="button"
                            className={`plus-modal-close-btn ${closeBtnClass}`}
                            aria-label="Close modal"
                            onClick={onClose}
                        >
                            <i className="fas fa-xmark" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="plus-modal-divider" />
                </>
            )}

            <div className={`plus-modal-body ${type === 'scrollable' ? 'plus-modal-body-scrollable' : ''}`}>
                <div className="plus-modal-content">
                    {body && (typeof body === 'string' ? <div className="body1-txt">{body}</div> : body)}
                    {children}
                </div>
                {type === 'scrollable' && (
                    <div className="plus-modal-scrollbar">
                        <div className="plus-modal-scrollbar-icon">
                            <i className="fas fa-caret-up" />
                        </div>
                        <div className="plus-modal-scrollbar-track">
                            <div className="plus-modal-scrollbar-bar" />
                        </div>
                        <div className="plus-modal-scrollbar-icon">
                            <i className="fas fa-caret-down" />
                        </div>
                    </div>
                )}
            </div>

            {showBottomButtons && (primaryButton || secondaryButton) && (
                <>
                    <div className="plus-modal-divider" />
                    <div className="plus-modal-footer">
                        <div className="plus-modal-button-row">
                            {secondaryButton && (
                                <Button
                                    text={secondaryButton.text || 'Cancel'}
                                    style={secondaryButton.style || 'secondary'}
                                    fill={secondaryButton.fill || 'tonal'}
                                    size={secondaryButton.size || 'medium'}
                                    onClick={secondaryButton.onClick}
                                    leadingVisual={secondaryButton.icon}
                                    className="plus-modal-button plus-modal-button-secondary"
                                />
                            )}
                            {primaryButton && (
                                <Button
                                    text={primaryButton.text || 'Confirm'}
                                    style={primaryButton.style || 'primary'}
                                    fill={primaryButton.fill || 'filled'}
                                    size={primaryButton.size || 'medium'}
                                    onClick={primaryButton.onClick}
                                    leadingVisual={primaryButton.icon}
                                    className="plus-modal-button plus-modal-button-primary"
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <BootstrapModal
            show={show}
            onHide={onClose}
            backdrop={backdrop}
            keyboard={keyboard}
            centered={centered}
            contentClassName="plus-bootstrap-modal-content-reset"
            dialogClassName="plus-bootstrap-modal-dialog-reset"
        >
            {modalContent}
        </BootstrapModal>
    );
};

Modal.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    body: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    type: PropTypes.oneOf(['default', 'scrollable']),
    showBottomButtons: PropTypes.bool,
    show: PropTypes.bool,
    backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    keyboard: PropTypes.bool,
    centered: PropTypes.bool,
    primaryButton: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        style: PropTypes.string,
        fill: PropTypes.string,
        size: PropTypes.string,
        icon: PropTypes.string,
        iconPosition: PropTypes.string,
    }),
    secondaryButton: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        style: PropTypes.string,
        fill: PropTypes.string,
        size: PropTypes.string,
        icon: PropTypes.string,
        iconPosition: PropTypes.string,
    }),
    onClose: PropTypes.func,
    paddingSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    gapSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    radiusSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

export default Modal;
