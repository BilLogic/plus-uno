import React from 'react';
import PropTypes from 'prop-types';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './Card.scss';

/**
 * PLUS card: an optional image, content and footer on a `sunken`, `default`, or
 * `raised` surface.
 *
 * - **Surface**: `sunken` (default, flat), `default` (page surface with a 1px
 *   border, flat), or `raised` (raised surface and shadow). Every card carries
 *   a 1px border (transparent on sunken and raised) so forced colors draw its
 *   edge.
 * - **Image placement**: `top` (default), `start` or `end`. Side images apply
 *   at the 480 minimum width and fill the height. `imageSplit` chooses
 *   one third (default) or one half; half uses Heading md on a side card.
 *   Below the 480 minimum width, the image returns to the top with its own ratio.
 * - **Image ratio**: `imageRatio` is `16:9` (default), `4:3` or `1:1`. A top
 *   image's height is the card width times the ratio, rounded to a multiple of
 *   4 so the card stays on the 4 px grid; the picture crops to cover and the
 *   text sets the rest of the height.
 * - **Header** (`_Card header`): `title` (the card title type, shared with Card
 *   in `styles/_card-title.scss`, one heading level below its section) over an
 *   optional `description` (Body/default 14), with
 *   `actions` at the end of the row. `header` replaces that block with custom
 *   content, like the header's `custom` type, for tabs or a toolbar.
 * - **Spacing** comes from the Card tokens: padding uses `--card-pad` and radius
 *   uses `--card-radius` at every size, the header sits Card/stack-md above the body (`gap` picks the stack step),
 *   and the footer sits Card/stack-lg below. The footer hugs the start: one action that
 *   goes somewhere is a link (`appearance="link"`), two are a compact pair with no
 *   Primary, and a card that is all one action is clickable with no buttons.
 * - The card hugs its content; in a row it stretches to the tallest card.
 * - **Elevation**: a clickable `sunken` or `default` card lifts to Raised on
 *   hover in place and settles to the raised shadow while pressed; a clickable
 *   `raised` card lifts to the raised hovered step under the overlay shadow and
 *   settles back onto the raised shadow while pressed; `dragging` puts any card
 *   on the overlay pair while it moves. The card also sets the current surface,
 *   so a sticky table cell inside it matches the card.
 */
const Card = ({
    id,
    title,
    description,
    actions,
    header,
    image,
    footer,
    surface = 'sunken',
    imagePlacement = 'top',
    imageRatio = '16:9',
    imageSplit = '1/3',
    gap = 'md',
    minWidth,
    dragging = false,
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-template-card',
        `plus-template-card--surface-${surface}`,
        image ? `plus-template-card--image-${imagePlacement}` : '',
        image ? `plus-template-card--ratio-${imageRatio.replace(':', '-')}` : '',
        image && imageSplit === '1/2' ? 'plus-template-card--image-half' : '',
        `plus-template-card-gap-${gap}`,
        props.onClick ? 'plus-template-card--clickable' : '',
        dragging ? 'plus-template-card--dragging' : '',
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
            {image && <div className="plus-template-card-image">{image}</div>}
            <div className="plus-template-card-inner">
                <div className="plus-template-card-content">
                    {header && <div className="plus-template-card-header">{header}</div>}
                    {!header && hasHeading && (
                        <div className="plus-template-card-header plus-template-card-header--default">
                            <div className="plus-template-card-heading">
                                {title && <Title className="plus-template-card-title">{title}</Title>}
                                {description && <p className="plus-template-card-description">{description}</p>}
                            </div>
                            {actions && <div className="plus-template-card-actions">{actions}</div>}
                        </div>
                    )}
                    {children != null && <div className="plus-template-card-body">{children}</div>}
                </div>
                {footer && <div className="plus-template-card-footer">{footer}</div>}
            </div>
        </div>
    );
};

Card.propTypes = {
    id: PropTypes.string,
    /** The card's title, in the card title type (`styles/_card-title.scss`), tagged one heading level below its section
     * @ds-context Used in: Card.title (ds guide card)
     */
    title: PropTypes.node,
    /** Body/default 14 under the title
     * @ds-context Used in: Card.description (ds guide card)
     */
    description: PropTypes.node,
    /** Actions at the end of the header row: buttons, a pager or an overflow
     * @ds-context Used in: Card.actions (ds guide card)
     * @ds-context Governed by: Common actions (ds guide common-actions); Overflow (ds guide overflow)
     */
    actions: PropTypes.node,
    /** Custom header that replaces title, description and actions (tabs, a toolbar)
     * @ds-context Used in: Card.header (ds guide card)
     * @ds-context Governed by: Common actions (ds guide common-actions)
     */
    header: PropTypes.node,
    /** Image slot, full bleed: above the content, or at the start or end edge per `imagePlacement`
     * @ds-context Used in: Card.image (ds guide card)
     */
    image: PropTypes.node,
    /** Image position. Side placements apply from the 480 minimum width; narrower cards put the image on top. */
    imagePlacement: PropTypes.oneOf(['top', 'start', 'end']),
    /** Image shape on a top image: its height follows the card width at 16:9, 4:3 or 1:1, rounded to a multiple of 4, and the picture crops to cover. A side image fills the card height instead. */
    imageRatio: PropTypes.oneOf(['16:9', '4:3', '1:1']),
    /** Side image share. One half also steps the title up to Heading md. Ignored for top placement. */
    imageSplit: PropTypes.oneOf(['1/3', '1/2']),
    /** Footer slot: a link for one action that leaves, or a compact pair with no Primary, start-aligned, Card/stack-lg below the body
     * @ds-context Used in: Card.footer (ds guide card)
     * @ds-context Governed by: Common actions (ds guide common-actions)
     */
    footer: PropTypes.node,
    /** Surface level: sunken (default, flat), default (page fill with a 1px border, flat), or raised (raised fill and shadow) */
    surface: PropTypes.oneOf(['sunken', 'default', 'raised']),
    /** Header-to-body stack: Card/stack-sm · md · lg (4 · 8 · 12) */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Minimum width constraint (number of px or any CSS length) */
    minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /**
     * Click handler, passed to the card's root element. Its presence adds the
     * clickable class: a pointer cursor and the hover lift. It adds no role or
     * tab stop; pass `role` and `tabIndex` for a card clickable as a whole.
     */
    onClick: PropTypes.func,
    /**
     * Key handler, passed to the card's root element. A card clickable as a
     * whole takes Enter and Space here, beside its `role` and `tabIndex`.
     */
    onKeyDown: PropTypes.func,
    /** The card is being dragged: it lifts to the overlay pair */
    dragging: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Body content slot
     * @ds-context Used in: Card.children (ds guide card)
     */
    children: PropTypes.node,
};

export default Card;
