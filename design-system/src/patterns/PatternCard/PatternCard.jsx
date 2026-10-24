import React from 'react';
import PropTypes from 'prop-types';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './PatternCard.scss';

/**
 * Card pattern for PLUS design system. Mirrors Figma `Pattern/Card`:
 * an optional image, then the content (the `_Card header` over the body), then
 * an optional footer, on the raised surface role with an outline border.
 *
 * - **Header** (`_Card header`): `title` (Heading/small 16, one heading level
 *   below its section) over an optional `description` (Body/default 14), with
 *   `actions` at the end of the row. `header` replaces that block with custom
 *   content, like the header's `custom` type, for tabs or a toolbar.
 * - **Spacing** comes from the Card tokens: `padding` sets Card/pad-sm · md · lg,
 *   the header sits Card/stack-md above the body (`gap` picks the stack step),
 *   and the footer sits Card/stack-lg below. The footer is left-aligned.
 * - The card hugs its content; in a row it stretches to the tallest card.
 * - **Elevation**: flat at rest, a 1px outline and no shadow. A card with an
 *   `onClick` lifts to the raised shadow (Light/2) on hover, and `dragging`
 *   lifts any card while it moves.
 */
const PatternCard = ({
    id,
    title,
    description,
    actions,
    header,
    image,
    footer,
    padding = 'md',
    gap = 'md',
    minWidth,
    dragging = false,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-card',
        `plus-pattern-card-pad-${padding}`,
        `plus-pattern-card-gap-${gap}`,
        props.onClick ? 'plus-pattern-card--clickable' : '',
        dragging ? 'plus-pattern-card--dragging' : '',
        className,
    ].filter(Boolean).join(' ');

    const cardStyle = {
        ...style,
        minWidth: minWidth ?? style?.minWidth,
    };

    const Title = headingTag(useHeadingLevel() + 1);
    const hasHeading = title || description || actions;

    return (
        <div id={id} className={classes} style={cardStyle} {...props}>
            {image && <div className="plus-pattern-card-image">{image}</div>}
            <div className="plus-pattern-card-inner">
                <div className="plus-pattern-card-content">
                    {header && <div className="plus-pattern-card-header">{header}</div>}
                    {!header && hasHeading && (
                        <div className="plus-pattern-card-header plus-pattern-card-header--default">
                            <div className="plus-pattern-card-heading">
                                {title && <Title className="plus-pattern-card-title">{title}</Title>}
                                {description && <p className="plus-pattern-card-description">{description}</p>}
                            </div>
                            {actions && <div className="plus-pattern-card-actions">{actions}</div>}
                        </div>
                    )}
                    {children != null && <div className="plus-pattern-card-body">{children}</div>}
                </div>
                {footer && <div className="plus-pattern-card-footer">{footer}</div>}
            </div>
        </div>
    );
};

PatternCard.propTypes = {
    id: PropTypes.string,
    /** The card's title: Heading/small 16, tagged one heading level below its section */
    title: PropTypes.node,
    /** Body/default 14 under the title */
    description: PropTypes.node,
    /** Actions at the end of the header row: buttons, a pager or an overflow */
    actions: PropTypes.node,
    /** Custom header that replaces title, description and actions (tabs, a toolbar) */
    header: PropTypes.node,
    /** Image slot above the content, full bleed */
    image: PropTypes.node,
    /** Footer slot: commit actions, left-aligned, Card/stack-lg below the body */
    footer: PropTypes.node,
    /** Padding scale: Card/pad-sm · md · lg (16 · 20 · 24) */
    padding: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Header-to-body stack: Card/stack-sm · md · lg (4 · 8 · 12) */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Minimum width constraint (number of px or any CSS length) */
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The card is being dragged: it lifts to the raised shadow (Light/2) */
    dragging: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Body content slot */
    children: PropTypes.node,
};

export default PatternCard;
