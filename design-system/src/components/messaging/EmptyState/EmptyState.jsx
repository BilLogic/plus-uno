import React from 'react';
import PropTypes from 'prop-types';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './EmptyState.scss';
import { iconClass } from '../../../lib/icon';

/** The two spacings: roomy for a whole page or panel, or compact for the room inside a table or card. */
export const EMPTY_STATE_SPACINGS = ['default', 'compact'];

/**
 * What a view shows when it has nothing to show yet: a picture, a short
 * header, one line saying what goes here, and the action that fills it. It
 * invites; it does not apologize.
 *
 * - **image** is a slot for an Illustration or any picture. Without it, `icon`
 *   (a Font Awesome Free solid name) stands in. Both are decorative.
 * - **header** is a heading one level below the section that holds the
 *   EmptyState, so it joins the page's outline.
 * - **primaryAction** is one filled Button; **secondaryAction** an optional
 *   outlined one after it.
 * - **spacing** `default` centers in a view on Heading/medium 20; `compact` fits a
 *   table body or a card on Heading/small 16 with a smaller picture.
 *
 * Pass it to a Table's `emptyState` slot.
 */
const EmptyState = ({
    header,
    description,
    image,
    icon,
    primaryAction,
    secondaryAction,
    spacing = 'default',
    className = '',
    ...props
}) => {
    const resolvedSpacing = spacing === 'compact' ? 'compact' : 'default';
    const Heading = headingTag(useHeadingLevel() + 1);
    const actions = primaryAction || secondaryAction;

    return (
        <div className={['plus-empty-state', `plus-empty-state--${resolvedSpacing}`, className].filter(Boolean).join(' ')} {...props}>
            {image ? (
                <div className="plus-empty-state__image" aria-hidden="true">{image}</div>
            ) : icon ? (
                <i className={`plus-empty-state__icon ${iconClass(icon)}`} aria-hidden="true" />
            ) : null}
            {(header || description) && (
                <div className="plus-empty-state__text">
                    {header && <Heading className="plus-empty-state__header">{header}</Heading>}
                    {description && <p className="plus-empty-state__description">{description}</p>}
                </div>
            )}
            {actions && (
                <div className="plus-empty-state__actions">
                    {primaryAction}
                    {secondaryAction}
                </div>
            )}
        </div>
    );
};

EmptyState.propTypes = {
    /** What this view is, as a heading: "No students yet". */
    header: PropTypes.node,
    /** One line on what goes here and what to do, in an inviting voice. */
    description: PropTypes.node,
    /** Picture slot, such as an Illustration. Takes the place of `icon`. */
    image: PropTypes.node,
    /** A Font Awesome Free solid name, such as "user-group", shown when there is no `image`. */
    icon: PropTypes.string,
    /** The one action that fills the view: a filled Button. */
    primaryAction: PropTypes.node,
    /** An optional second action: an outlined Button. */
    secondaryAction: PropTypes.node,
    /** `default` for a view or panel; `compact` for a table body or a card. */
    spacing: PropTypes.oneOf(EMPTY_STATE_SPACINGS),
    className: PropTypes.string,
};

export default EmptyState;
