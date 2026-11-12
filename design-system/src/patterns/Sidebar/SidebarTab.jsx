import React from 'react';
import PropTypes from 'prop-types';
import './SidebarTab.scss';
import { Icon } from '@/components';

/**
 * SidebarTab Component
 *
 * One row of a side navigation, matching the BS4 Foundation `Sidebar Tab`
 * (node 17118:127). A 32 row (`--item-height-md`) padded 12 at the sides, with
 * a 16 icon box and a Body/default 14/20 label that truncates.
 *
 * Slots, after Atlassian's side-nav item:
 * - `iconBefore`: the icon, by Font Awesome Free name. Leave it out for a row with no icon.
 * - `description`: a second line in Body/small. The row grows past 32 to hold it.
 * - `elemAfter`: a count, a badge or a status at the end of the row.
 * - `actionsOnHover`: controls (⋯, ×) that show on hover and while the row has
 *   focus. They render beside the row, never inside it, so a button does not
 *   nest in a button and pressing an action does not open the row.
 *
 * `href` makes the row a link; `external` opens it in a new tab and says so.
 *
 * States, drawn by the stylesheet:
 * - enabled: transparent, subtle text and icon
 * - hover: the neutral subtle hovered fill (pressed: its pressed step)
 * - selected: the neutral selected fill with selected text and icon, the
 *   label in the medium weight, and `aria-current="page"`, so selection never
 *   rests on fill alone
 * - focus: a 2px focused ring, 2px inside the row, and no fill
 * - disabled: the disabled text and icon colors, no tab stop
 *
 * `hover` AND `focus` ARE DOCUMENTATION VALUES, NOT BEHAVIOR (#320). They
 * exist so the design's five states can be laid out side by side in a docs
 * canvas — the real hover and focus appearances come from CSS on the rendered
 * element and need no prop at all.
 *
 * Wiring them to real events is the mistake this note exists to prevent:
 * `onMouseEnter={() => setState('hover')}` re-renders the row on every pointer
 * move, and it still does not follow the keyboard, because a focus that arrives
 * by Tab never touches the pointer handler. Leave `state` on `enabled` or
 * `selected` in an application and let the stylesheet do the rest.
 */
const SidebarTab = ({
    text,
    iconBefore,
    state = 'enabled',
    description,
    elemAfter,
    actionsOnHover,
    href,
    external = false,
    id,
    onClick,
    className = '',
    style
}) => {
    const disabled = state === 'disabled';
    const isSelected = state === 'selected';
    const isLink = Boolean(href) && !disabled;

    const classes = [
        'plus-sidebar-tab',
        `plus-sidebar-tab--${state}`,
        description ? 'plus-sidebar-tab--with-description' : '',
        className,
    ].filter(Boolean).join(' ');

    const content = (
        <>
            {iconBefore && (
                <span className="plus-sidebar-tab__icon" aria-hidden="true">
                    <Icon name={iconBefore} />
                </span>
            )}
            <span className="plus-sidebar-tab__text">
                <span className="plus-sidebar-tab__label">{text}</span>
                {description ? <span className="plus-sidebar-tab__description">{description}</span> : null}
            </span>
            {isLink && external ? <span className="visually-hidden">(opens in a new tab)</span> : null}
            {elemAfter ? <span className="plus-sidebar-tab__after">{elemAfter}</span> : null}
        </>
    );

    const shared = {
        id,
        className: classes,
        style,
        /*
         * #320. Which section you are in was a background color and nothing
         * else. `aria-current="page"` is what says it to anyone not looking at
         * the color.
         */
        'aria-current': isSelected ? 'page' : undefined,
    };

    const row = isLink ? (
        <a
            {...shared}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            onClick={onClick}
        >
            {content}
        </a>
    ) : (
        <div
            {...shared}
            onClick={!disabled ? onClick : undefined}
            /*
             * #320. Enter and Space activate a `button` ELEMENT; they do not
             * activate `role="button"`. Without this handler the row was
             * announced as a button, took a tab stop, and did nothing when
             * pressed — every row of a sidebar reachable and none openable.
             * Space is prevented so the page does not scroll under the press.
             */
            onKeyDown={!disabled && onClick ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick(event);
                }
            } : undefined}
            role="button"
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
        >
            {content}
        </div>
    );

    if (!actionsOnHover || disabled) return row;

    return (
        <div className="plus-sidebar-tab-item">
            {row}
            <div className="plus-sidebar-tab__actions">{actionsOnHover}</div>
        </div>
    );
};

SidebarTab.propTypes = {
    /** The label. It truncates with an ellipsis past the row's width. */
    text: PropTypes.string.isRequired,
    /** Font Awesome Free name for the 16 icon before the label, e.g. `house`; drawn outlined, selected or not */
    iconBefore: PropTypes.string,
    /** `hover` and `focus` are documentation values; drive only `enabled`, `selected` and `disabled`. */
    state: PropTypes.oneOf(['enabled', 'hover', 'selected', 'disabled', 'focus']),
    /** A second line under the label, in Body/small */
    description: PropTypes.node,
    /** A count, badge or status at the end of the row */
    elemAfter: PropTypes.node,
    /** Controls shown on hover and focus, rendered beside the row (never inside it) */
    actionsOnHover: PropTypes.node,
    /** Makes the row a link */
    href: PropTypes.string,
    /** With `href`: open in a new tab, announced as "(opens in a new tab)" */
    external: PropTypes.bool,
    id: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default SidebarTab;
