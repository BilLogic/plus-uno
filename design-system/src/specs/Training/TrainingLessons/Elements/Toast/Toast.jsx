import React from 'react';
import PropTypes from 'prop-types';
import './Toast.scss';

/**
 * Toast Component
 * 
 * A toast notification component with a header and body content.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178085
 */
const Toast = ({
    title,
    message,
    actionLabel,
    onAction,
    onClose,
    show = true,
    className = '',
    style
}) => {
    if (!show) return null;

    return (
        <div
            className={`plus-toast ${className}`}
            style={style}
            data-node-id="63:178085"
            role="alert"
        >
            <div className="plus-toast__header">
                <div className="plus-toast__icon-badge" />
                <h4 className="plus-toast__title">{title}</h4>
                {onClose && (
                    <button
                        className="plus-toast__close"
                        onClick={onClose}
                        aria-label="Close notification"
                    >
                        <i className="fas fa-times" />
                    </button>
                )}
            </div>
            <div className="plus-toast__body">
                <p className="plus-toast__message">{message}</p>
                {actionLabel && (
                    <button
                        className="plus-toast__action"
                        onClick={onAction}
                        type="button"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

Toast.propTypes = {
    /** Title text displayed in the header */
    title: PropTypes.string,
    /** Main message text displayed in the body */
    message: PropTypes.string,
    /** Label for the action button */
    actionLabel: PropTypes.string,
    /** Handler for action button click */
    onAction: PropTypes.func,
    /** Handler for close button click */
    onClose: PropTypes.func,
    /** Whether the toast is visible */
    show: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default Toast;
