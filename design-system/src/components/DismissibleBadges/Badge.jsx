import React from 'react';
import PropTypes from 'prop-types';
import RBBadge from 'react-bootstrap/Badge';
import './Badge.scss';

export const Badge = ({
    text,
    children,
    style = 'primary',
    size = 'b2',
    leadingVisual,
    trailingVisual,
    counter,
    dismissible = false,
    onDismiss,
    className = '',
    id
}) => {
    // Support both text prop and children (children takes precedence)
    const displayText = children || text;
    
    // Determine visuals
    let definedTrailingVisual = trailingVisual;

    // If dismissible, force strict Dismissible Badge behavior
    if (dismissible) {
        // Dismissible badges use an X mark for the trailing visual
        definedTrailingVisual = (
            <button
                type="button"
                className="plus-badge-dismiss-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onDismiss) onDismiss();
                }}
                aria-label="Dismiss"
            >
                <i className="fa-solid fa-xmark"></i>
            </button>
        );
    }

    // Map sizes to typography utility classes
    // Body sizes get explicit semibold modifier (like Button) to ensure weight 400
    const typographyClass = {
        'h1': 'h1',
        'h2': 'h2',
        'h3': 'h3',
        'h4': 'h4',
        'h5': 'h5',
        'h6': 'h6',
        'b1': 'body1-txt font-weight-semibold',
        'b2': 'body2-txt font-weight-semibold',
        'b3': 'body3-txt font-weight-semibold'
    }[size] || 'body2-txt font-weight-semibold';

    return (
        <RBBadge
            id={id}
            bg="" // Reset default BS bg
            className={`
                plus-badge 
                ${typographyClass}
                plus-badge--${style} 
                ${dismissible ? 'plus-badge--dismissible' : ''} 
                ${className}
            `}
            role={dismissible ? 'button' : undefined}
            tabIndex={dismissible ? 0 : undefined}
        >
            {/* Leading Visual */}
            {leadingVisual && (
                <span className="plus-badge-visual plus-badge-visual--leading">
                    {leadingVisual}
                </span>
            )}

            {/* Main Text */}
            <span className="plus-badge-text">{displayText}</span>

            {/* Counter */}
            {counter !== undefined && (
                <span className="plus-badge-counter">
                    {counter}
                </span>
            )}

            {/* Trailing Visual (or Dismiss Button) */}
            {definedTrailingVisual && (
                <span className="plus-badge-visual plus-badge-visual--trailing">
                    {definedTrailingVisual}
                </span>
            )}
        </RBBadge>
    );
};

Badge.propTypes = {
    /** Badge label text (alternative to children) */
    text: PropTypes.string,
    /** Badge label content (alternative to text prop) */
    children: PropTypes.node,
    style: PropTypes.oneOf([
        'primary', 'secondary', 'tertiary', 'success', 'warning', 'danger', 'info',
        'social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'
    ]),
    size: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3']),
    leadingVisual: PropTypes.node,
    trailingVisual: PropTypes.node,
    counter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dismissible: PropTypes.boolean,
    onDismiss: PropTypes.func,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Badge;
