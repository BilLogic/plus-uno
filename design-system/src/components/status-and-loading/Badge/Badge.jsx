import React from 'react';
import PropTypes from 'prop-types';
import RBBadge from 'react-bootstrap/Badge';
import './Badge.scss';

/**
 * `Badge` — deprecated, and still rendering exactly as it did while its uses
 * move. Is it a number? Count. Is it the condition something is in, and can
 * that condition change? Status. Otherwise, Tag.
 *
 * Every render warns in development with the replacement for the props it was
 * given, so a call moves by copying what the console says: a status style is a
 * Status, a curriculum style is a Tag in the color that borrows that hue, a
 * dismissible badge is a removable Tag, and a counter moves to the
 * replacement's `count`.
 */

/** The four status styles, which keep their names on Status. */
const STATUS_STYLES = ['success', 'warning', 'danger', 'info'];

/** Each curriculum style and the Tag color that borrows its hue. */
const TAG_COLOR_OF = {
    'social-emotional': 'yellow',
    'mastering-content': 'purple',
    advocacy: 'green',
    relationship: 'magenta',
    'technology-tools': 'blue',
};

/** The replacement for a Badge with these props, written as the call to make. */
const replacementFor = ({ style, dismissible, counter }) => {
    const color = TAG_COLOR_OF[style] ? ` color="${TAG_COLOR_OF[style]}"` : '';
    if (dismissible) return `<Tag behavior="removable"${color}>`;
    if (color) return `<Tag${color}>`;
    const count = counter !== undefined ? ' count' : '';
    if (STATUS_STYLES.includes(style)) return `<Status style="${style}"${count}>`;
    return `<Status${count}> for a state, or <Tag> for a category`;
};

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
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[Badge] is deprecated; use ${replacementFor({ style, dismissible, counter })}.`);
    }

    // Support both text prop and children (children takes precedence)
    const displayText = children || text;
    // ... (logic for visuals/dismiss button same) ...
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
            // Only the dismiss button below is interactive — the badge itself
            // has no click handler, so it must not carry button semantics too.
            // (A `role="button"` wrapper here would nest one interactive
            // control inside another, which is invalid per ARIA.)
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
    dismissible: PropTypes.bool,
    onDismiss: PropTypes.func,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Badge;
