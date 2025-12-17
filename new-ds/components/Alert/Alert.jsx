import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RBAlert from 'react-bootstrap/Alert';
import './Alert.scss';

/**
 * Alert component for PLUS design system.
 * Universal element component for displaying alert messages.
 * Matches Figma design (Node: 11-324) 1:1 via Alert.scss.
 */
const Alert = ({
    id,
    style = 'primary',
    title,
    text,
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
    // We use 'variant' for the RB component to ensure basic accessibility attributes are set, 
    // but our custom styles override purely visual aspects via classNames.
    const alertStyle = style || 'primary';

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
                <div className="plus-alert-text body1-txt">{text}</div>
            </div>

            {dismissable && (
                <button
                    type="button"
                    className="plus-alert-dismiss-btn h4"
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
    id: PropTypes.string,
    style: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']),
    variant: PropTypes.string,
    title: PropTypes.string,
    text: PropTypes.node.isRequired,
    dismissable: PropTypes.bool,
    onDismiss: PropTypes.func,
    className: PropTypes.string,
};

export default Alert;
