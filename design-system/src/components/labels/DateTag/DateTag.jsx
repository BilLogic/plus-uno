import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import Tooltip from '../../overlays-and-layering/Tooltip';
import { useIsTruncated } from '../../../lib/useIsTruncated';
import './DateTag.scss';
import { iconClass } from '../../../lib/icon';

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
 * A DATE TAG IS NEVER A BUTTON. It is a `span` with no role and no click
 * handler. The one time it takes focus is when its text is truncated, so a
 * keyboard user can reach the tooltip that holds the full text.
 */

export const DATE_TAG_APPEARANCES = ['neutral', 'warning', 'danger'];
export const DATE_TAG_SPACINGS = ['default', 'spacious'];

/** The fixed icon of each appearance: calendar, clock, alert. */
export const DATE_TAG_ICONS = {
    neutral: 'calendar',
    warning: 'clock',
    danger: 'triangle-exclamation',
};

const warn = (message) => {
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[DateTag] ${message}`);
    }
};

/** An outlined label for a due or event date, such as "Due tomorrow". The app picks the appearance from how close the date is; it is never a button. */
export const DateTag = ({
    children,
    appearance = 'neutral',
    spacing = 'default',
    maxWidth = 200,
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
    for (const [name, value] of [['onClick', onClick], ['role', role], ['tabIndex', tabIndex]]) {
        if (value !== undefined) {
            warn(`\`${name}\` is ignored: a Date tag is never a button.`);
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
        className,
    ].filter(Boolean).join(' ');

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
                        <i className={iconClass(icon)} aria-hidden="true" />
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
    /** Extra class names added to the tag element beside the component's own. */
    className: PropTypes.string,
    /** The `id` attribute of the tag element. */
    id: PropTypes.string,
};

export default DateTag;
