import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RBAlert from 'react-bootstrap/Alert';
import CloseButton from '@/components/actions/CloseButton';
import './Alert.scss';

/** The six styles, as the Figma Alert set names them. */
export const ALERT_STYLES = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];

/** The default leading icon of each style (Font Awesome solid names). */
export const ALERT_ICONS = {
    primary: 'circle-info',
    secondary: 'circle-info',
    success: 'circle-check',
    danger: 'circle-exclamation',
    warning: 'triangle-exclamation',
    info: 'circle-info',
};

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
 *
 * // Leading icon: each style has a default; a name or a node replaces it, false removes it
 * <Alert style="info" leadingVisual="bell">Reminders are on.</Alert>
 * <Alert style="warning" leadingVisual={false}>Sign-in didn't complete. Please try again.</Alert>
 */
const Alert = ({
    id,
    style = 'primary',
    title,
    children,
    leadingVisual = true,
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

    // The leading icon and the × center on the first line of text: the title
    // line when there is a title, otherwise the first body line. An invisible
    // strut in that line's text style gives each column exactly one line of
    // height; the icon stays a 20px square (the column's width) and the button
    // 24×24 whatever the text size.
    const firstLineClass = title ? 'h4' : 'body2-txt';
    const strut = <span className={`plus-alert-strut ${firstLineClass}`} aria-hidden="true">{'\u200B'}</span>;

    // `true` (the default) is the style's own icon; a string is a Font Awesome
    // solid name, as Button and Status take it; a node renders as given.
    const visual = leadingVisual === true ? (ALERT_ICONS[alertStyle] ?? ALERT_ICONS.primary) : leadingVisual;

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
            {visual !== false && visual != null && (
                <div className="plus-alert-leading" aria-hidden="true">
                    {strut}
                    {typeof visual === 'string'
                        ? <i className={`plus-alert-leading-icon fa-solid fa-${visual}`} />
                        : <span className="plus-alert-leading-icon">{visual}</span>}
                </div>
            )}

            <div className="plus-alert-content">
                {title && <RBAlert.Heading className="plus-alert-title h4">{title}</RBAlert.Heading>}
                <div className="plus-alert-text body2-txt">{children}</div>
            </div>

            {canDismiss && (
                <div className="plus-alert-dismiss">
                    {strut}
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
    style: PropTypes.oneOf(ALERT_STYLES),
    /** React Bootstrap variant (for accessibility attributes) */
    variant: PropTypes.string,
    /** Optional title/heading for the alert */
    title: PropTypes.string,
    /** Alert content - supports text, JSX, or React components */
    children: PropTypes.node.isRequired,
    /** Leading icon on the first line: `true` for the style's default, a Font Awesome solid name or a node to replace it, `false` to remove it. Always decorative. */
    leadingVisual: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.node]),
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

