import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { devWarn } from '../../../lib/devWarn';

import Tooltip from '../../overlays-and-layering/Tooltip';
import useTagOpen from '../useTagOpen';
import { useIsTruncated } from '../../../lib/useIsTruncated';
import Icon from '../../images-and-icons/Icon';
import Spinner from '../../loading/Spinner/Spinner';
import Popup from '../../overlays-and-layering/Popup';
import './DateTag.scss';

/**
 * `DateTag` — a due or event date.
 *
 * OUTLINED, WITH A FIXED ICON. No fill: the border and text carry the
 * appearance, and the icon follows it (calendar, clock, alert) — never a
 * caller's choice.
 *
 * THE APP PICKS THE APPEARANCE, NEVER TASTE. `neutral` when the date is not
 * close, `warning` when it is due soon, `danger` when it is overdue. Derive it
 * from the date and the due-soon window, and write the label as people say it.
 *
 * A DATE TAG IS A LABEL UNTIL IT HAS A `menu`. Without one it is a `span`
 * with no role and no click handler; the one time it takes focus is when its
 * text is truncated, so a keyboard user can reach the tooltip that holds the
 * full text. With `menu`, normally a `Calendar`, the same tag is the trigger of
 * a `Popup`: a real button, with a chevron, that opens the picker in place.
 */

export const DATE_TAG_APPEARANCES = ['neutral', 'warning', 'danger'];
export const DATE_TAG_SPACINGS = ['default', 'spacious'];

/** The fixed icon of each appearance: calendar, clock, alert. */
export const DATE_TAG_ICONS = {
    neutral: 'calendar',
    warning: 'clock',
    danger: 'triangle-exclamation',
};

const warn = devWarn('DateTag');

/** An outlined label for a due or event date, such as "Due tomorrow". The app picks the appearance from how close the date is; it is never a button. */
export const DateTag = ({
    children,
    appearance = 'neutral',
    spacing = 'default',
    maxWidth = 200,
    menu,
    isOpen,
    defaultOpen,
    onOpenChange,
    isLoading = false,
    isDisabled = false,
    className = '',
    id,
    onClick,
    role,
    tabIndex,
    ...rest
}) => {
    /*
     * Anything that would make it a control is dropped, not passed through: a
     * click handler, a role, a tab stop. Whether it takes focus is decided by
     * truncation alone.
     */
    const isMenu = menu !== undefined && menu !== null && menu !== false;
    const { isOpen: open, setOpen } = useTagOpen({ isOpen, defaultOpen, onOpenChange });
    for (const [name, value] of [['onClick', onClick], ['role', role], ['tabIndex', tabIndex]]) {
        if (value !== undefined) {
            warn(`\`${name}\` is ignored: a Date tag is a label. Give it a \`menu\` to let a person change the date in place.`);
        }
    }
    if (!isMenu) {
        for (const [name, value] of [['isOpen', isOpen], ['defaultOpen', defaultOpen], ['onOpenChange', onOpenChange], ['isLoading', isLoading || undefined], ['isDisabled', isDisabled || undefined]]) {
            if (value !== undefined) warn(`\`${name}\` does nothing without a \`menu\`.`);
        }
    }

    let effectiveAppearance = appearance;
    if (!DATE_TAG_APPEARANCES.includes(effectiveAppearance)) {
        warn(`appearance="${appearance}" is not one of ${DATE_TAG_APPEARANCES.join(', ')}; it falls back to neutral.`);
        effectiveAppearance = 'neutral';
    }

    let effectiveSpacing = spacing;
    if (!DATE_TAG_SPACINGS.includes(spacing)) {
        warn(`spacing="${spacing}" is not one of ${DATE_TAG_SPACINGS.join(', ')}; it falls back to default.`);
        effectiveSpacing = 'default';
    }

    const icon = DATE_TAG_ICONS[effectiveAppearance];

    const labelRef = useRef(null);
    const truncated = useIsTruncated(labelRef, [children, effectiveSpacing, maxWidth]);

    const classes = [
        'plus-date-tag',
        `plus-date-tag--${effectiveAppearance}`,
        `plus-date-tag--${effectiveSpacing}`,
        isMenu ? 'plus-date-tag--menu' : '',
        isMenu && isLoading ? 'plus-date-tag--loading' : '',
        className,
    ].filter(Boolean).join(' ');

    if (isMenu) {
        if (!rest['aria-label']) {
            warn('A Date tag with a `menu` needs an `aria-label` naming the field and the record: "Due date, Session 12: Due tomorrow".');
        }
        const trigger = (
            <button
                type="button"
                id={id}
                className={classes}
                style={{ '--plus-date-tag-max': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
                aria-busy={isLoading || undefined}
                disabled={isDisabled || isLoading}
                {...rest}
            >
                <span className="plus-date-tag__content">
                    <span className="plus-date-tag__visual" aria-hidden="true">
                        <Icon name={icon} />
                    </span>
                    <span className="plus-date-tag__label">{children}</span>
                </span>
                <span className="plus-date-tag__chevron" aria-hidden="true">
                    <Icon name={open ? 'angle-up' : 'angle-down'} iconStyle="solid" />
                </span>
                {isLoading && (
                    <span className="plus-date-tag__spinner" aria-hidden="true">
                        <Spinner size={effectiveSpacing === 'spacious' ? 16 : 12} appearance="inherit" label="" />
                    </span>
                )}
            </button>
        );
        return (
            <Popup trigger={trigger} placement="bottom-start" show={open} onToggle={setOpen}>
                {menu}
            </Popup>
        );
    }

    /*
     * `maxWidth` travels as a custom property, not an inline `max-width`, so
     * the stylesheet can also clamp to the container. The tooltip is always
     * mounted and switched on only while the label is clipped, so the element
     * a person is focused on never remounts under them when the page resizes.
     */
    return (
        <Tooltip text={children} trigger={truncated ? ['hover', 'focus'] : []}>
            <span
                id={id}
                className={classes}
                style={{ '--plus-date-tag-max': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
                {...rest}
                tabIndex={truncated ? 0 : undefined}
            >
                <span className="plus-date-tag__content">
                    <span className="plus-date-tag__visual" aria-hidden="true">
                        <Icon name={icon} />
                    </span>
                    <span
                        ref={labelRef}
                        className="plus-date-tag__label"
                    >
                        {children}
                    </span>
                </span>
            </span>
        </Tooltip>
    );
};

DateTag.propTypes = {
    /** The date, as people say it: "Due tomorrow", "2 days overdue". */
    children: PropTypes.node.isRequired,
    /** `neutral` (not close), `warning` (due soon) or `danger` (overdue). Drives the fixed icon too. */
    appearance: PropTypes.oneOf(DATE_TAG_APPEARANCES),
    /** `default` (20) in rows, lists and sentences; `spacious` (32) beside a heading. */
    spacing: PropTypes.oneOf(DATE_TAG_SPACINGS),
    /** The widest the Date tag grows, in px or any CSS length, and never wider than its container. Past it the label ends in an ellipsis and the full text is a tooltip. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The popup's content, normally a `Calendar`. With it the tag is a button that opens the popup; without it the tag is a label. Name it with `aria-label`: "Due date, Session 12: Due tomorrow". */
    menu: PropTypes.node,
    /** Controlled open state of the popup. Pair it with `onOpenChange`. The open tag is drawn as selected. */
    isOpen: PropTypes.bool,
    /** Whether an uncontrolled popup starts open. */
    defaultOpen: PropTypes.bool,
    /** Called with the next open state when the popup opens or closes. */
    onOpenChange: PropTypes.func,
    /** A change is saving: the content hides, keeping its width, and a spinner draws over the tag. The tag cannot be pressed. */
    isLoading: PropTypes.bool,
    /** Prevents opening the popup. Drawn in the disabled tokens, never faded. */
    isDisabled: PropTypes.bool,
    /** Extra class names added to the tag element beside the component's own. */
    className: PropTypes.string,
    /** The `id` attribute of the tag element. */
    id: PropTypes.string,
};

export default DateTag;
