import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RBAlert from 'react-bootstrap/Alert';
import CloseButton from '@/components/actions/CloseButton';
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
    dismissible = true,
    /** @deprecated Prefer `dismissible` — kept for existing call sites */
    dismissable,
    onDismiss,
    className = '',
    variant,
    ...props
}) => {
    const [show, setShow] = useState(true);
    /** Prefer `dismissible`; honor legacy `dismissable` when explicitly passed */
    const canDismiss = dismissable !== undefined ? dismissable : dismissible;

    if (!show) return null;

    const handleClose = () => {
        setShow(false);
        if (onDismiss) onDismiss();
    };

    // The 'style' prop maps to our SCSS classes (primary, secondary, etc.)
    const alertStyle = style || 'primary';

    // The × centers on the first line of text: the title line when there is a
    // title, otherwise the first body line. An invisible strut in that line's
    // text style gives the dismiss column exactly one line of height; the
    // button itself stays 24×24 whatever the text size.
    const firstLineClass = title ? 'h4' : 'body2-txt';

    return (
        <RBAlert
            id={id}
            variant={variant || alertStyle}
            show={show}
            onClose={canDismiss ? handleClose : undefined}
            dismissible={false} // Custom dismiss button used in SCSS structure
            className={`plus-alert ${alertStyle} ${className}`}
            {...props}
        >
            <div className="plus-alert-content">
                {title && <RBAlert.Heading className="plus-alert-title h4">{title}</RBAlert.Heading>}
                <div className="plus-alert-text body2-txt">{children}</div>
            </div>

            {canDismiss && (
                <div className="plus-alert-dismiss">
                    <span className={`plus-alert-dismiss-strut ${firstLineClass}`} aria-hidden="true">{'\u200B'}</span>
                    <CloseButton aria-label="Close alert" onClick={handleClose} />
                </div>
            )}
        </RBAlert>
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
    dismissible: PropTypes.bool,
    /** @deprecated Prefer `dismissible` */
    dismissable: PropTypes.bool,
    /** Callback when alert is dismissed */
    onDismiss: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default Alert;

