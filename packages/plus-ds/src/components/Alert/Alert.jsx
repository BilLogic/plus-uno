import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RBAlert from 'react-bootstrap/Alert';
import './Alert.scss';

/**
 * Alert component for PLUS design system.
 * 
 * Uses the standard React children pattern for content (matching React Bootstrap convention).
 * 
 * @example
 * // Simple alert
 * <Alert style="warning">Warning message here</Alert>
 * 
 * // With title
 * <Alert style="info" title="Info">This is an info alert.</Alert>
 * 
 * // Rich content
 * <Alert style="danger">
 *   <strong>Error:</strong> Something went wrong. <a href="/help">Get help</a>
 * </Alert>
 */
const Alert = ({
    id,
    style = 'primary',
    title,
    children,
    dismissable = true,
    onDismiss,
    className = '',
    variant,
    ...props
}) => {
    const [show, setShow] = useState(true);

    if (!show) return null;

    const handleClose = () => {
        setShow(false);
        if (onDismiss) onDismiss();
    };

    // The 'style' prop maps to our SCSS classes (primary, secondary, etc.)
    const alertStyle = style || 'primary';

    // Dismiss button matches the hierarchy: h4 with title, body1-txt without
    const dismissBtnClass = title ? 'h4' : 'body1-txt';

    return (
        <RBAlert
            id={id}
            variant={variant || alertStyle}
            show={show}
            onClose={dismissable ? handleClose : undefined}
            dismissible={false} // Custom dismiss button used in SCSS structure
            className={`plus-alert ${alertStyle} ${className}`}
            {...props}
        >
            <div className="plus-alert-content">
                {title && <RBAlert.Heading className="plus-alert-title h4">{title}</RBAlert.Heading>}
                <div className="plus-alert-text body1-txt">{children}</div>
            </div>

            {dismissable && (
                <button
                    type="button"
                    className={`plus-alert-dismiss-btn ${dismissBtnClass}`}
                    onClick={handleClose}
                    aria-label="Close alert"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            )}
        </RBAlert >
    );
};

Alert.propTypes = {
    /** Unique identifier for the alert element */
    id: PropTypes.string,
    /** Color style variant */
    style: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
    /** React Bootstrap variant (for accessibility attributes) */
    variant: PropTypes.string,
    /** Optional title/heading for the alert */
    title: PropTypes.string,
    /** Alert content - supports text, JSX, or React components */
    children: PropTypes.node.isRequired,
    /** Whether the alert can be dismissed */
    dismissable: PropTypes.bool,
    /** Callback when alert is dismissed */
    onDismiss: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default Alert;

