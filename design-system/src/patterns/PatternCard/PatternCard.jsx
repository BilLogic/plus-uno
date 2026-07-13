import React from 'react';
import PropTypes from 'prop-types';
import './PatternCard.scss';

/**
 * Card pattern for PLUS design system.
 * Componentized card shell with baked-in tokens: `--color-surface-container-lowest`
 * background, elevation 1, card radius, and outline-variant border.
 * Slots: optional `header`, body `children`, optional `footer`.
 * Mirrors the "Card" slot component in the Figma design system file.
 */
const PatternCard = ({
    id,
    header,
    footer,
    padding = 'md',
    gap = 'md',
    minWidth,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-card',
        `plus-pattern-card-pad-${padding}`,
        `plus-pattern-card-gap-${gap}`,
        className,
    ].filter(Boolean).join(' ');

    const cardStyle = {
        ...style,
        minWidth: minWidth ?? style?.minWidth,
    };

    return (
        <div id={id} className={classes} style={cardStyle} {...props}>
            {header && <div className="plus-pattern-card-header">{header}</div>}
            <div className="plus-pattern-card-body">{children}</div>
            {footer && <div className="plus-pattern-card-footer">{footer}</div>}
        </div>
    );
};

PatternCard.propTypes = {
    id: PropTypes.string,
    /** Header slot (rendered above the body with an inner divider) */
    header: PropTypes.node,
    /** Footer slot (rendered below the body with an inner divider) */
    footer: PropTypes.node,
    /** Padding scale (card padding tokens) */
    padding: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Gap scale between header, body, and footer (card gap tokens) */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Minimum width constraint (number of px or any CSS length) */
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    style: PropTypes.object,
    /** Body content slot */
    children: PropTypes.node,
};

export default PatternCard;
