import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Count, { formatCount } from '../Count/Count';
import Tooltip from '../../overlays/Tooltip';
import './Status.scss';

/**
 * `Status` — the condition something is in.
 *
 * WHICH LABEL, IN THREE QUESTIONS. Is it a number? Count. Is it the condition
 * something is in, and can that condition change? Status, whether the system
 * calculated it or a person set it. Otherwise, Tag. Status is filled (a
 * meaning); Tag is outlined (a category).
 *
 * THE NAMES FOLLOW THE LIBRARY. `type`, `style`, `size`, `leadingVisual` and
 * `count` take the same words Button and Count use, and the same values as the
 * Status set in Figma, so handoff needs no translation. Figma's `leadingVisual?`
 * and `count?` are `leadingVisual` and `count` here.
 *
 * A STATUS IS NEVER A BUTTON. It is a `span` with no role and no click handler.
 * Where a status can be edited, the field around it becomes an inline Dropdown;
 * the label itself never becomes a control. The one time it takes focus is when
 * its text is truncated, so a keyboard user can reach the tooltip that holds the
 * full text.
 *
 * A DATE IS OUTLINED, AND THE APP PICKS ITS STYLE. `type="date"` takes neutral
 * (not close), warning (due soon) and danger (overdue), each with a fixed icon.
 * The style comes from the date and the due-soon window, never from taste; any
 * other style falls back to neutral with a development warning.
 */

export const STATUS_TYPES = ['state', 'date'];
export const STATUS_STYLES = ['neutral', 'success', 'warning', 'danger', 'info', 'discovery'];
export const STATUS_DATE_STYLES = ['neutral', 'warning', 'danger'];
export const STATUS_SIZES = ['medium', 'large'];

/** The fixed icon of each date style: calendar, clock, alert. */
export const STATUS_DATE_ICONS = {
    neutral: 'calendar',
    warning: 'clock',
    danger: 'triangle-exclamation',
};

const warn = (message) => {
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[Status] ${message}`);
    }
};

/** A string is a Font Awesome solid icon name, as Button takes it; anything else renders as given. */
const renderVisual = (visual) => (typeof visual === 'string'
    ? <i className={`fa-solid fa-${visual}`} aria-hidden="true" />
    : visual);

/**
 * Whether the label is clipped. Measured after layout and again whenever the
 * label resizes, because the width it has depends on the page around it.
 */
const useIsTruncated = (ref, deps) => {
    const [truncated, setTruncated] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return truncated;
};

export const Status = ({
    children,
    type = 'state',
    style = 'neutral',
    size = 'medium',
    leadingVisual,
    count,
    maxWidth = 200,
    className = '',
    id,
    onClick,
    ...rest
}) => {
    if (onClick) {
        warn('`onClick` is ignored: a Status is never a button. Edit a status through an inline Dropdown in its field.');
    }

    const isDate = type === 'date';
    let effectiveStyle = STATUS_STYLES.includes(style) ? style : 'neutral';
    if (isDate && !STATUS_DATE_STYLES.includes(effectiveStyle)) {
        warn(`type="date" takes ${STATUS_DATE_STYLES.join(', ')}; style="${style}" falls back to neutral.`);
        effectiveStyle = 'neutral';
    }

    const visual = isDate ? STATUS_DATE_ICONS[effectiveStyle] : leadingVisual;
    const hasCount = count !== undefined && count !== null && formatCount(count) !== null;

    const labelRef = useRef(null);
    const truncated = useIsTruncated(labelRef, [children, size, maxWidth, visual, hasCount]);

    const classes = [
        'plus-status',
        `plus-status--${type}`,
        `plus-status--${effectiveStyle}`,
        `plus-status--${size}`,
        hasCount ? 'plus-status--with-count' : '',
        className,
    ].filter(Boolean).join(' ');

    /*
     * The tooltip is always mounted and switched on only while the label is
     * clipped, so the element a person is focused on never remounts under them
     * when the page resizes.
     */
    return (
        <Tooltip text={children} trigger={truncated ? ['hover', 'focus'] : []}>
            <span
                id={id}
                className={classes}
                style={{ maxWidth }}
                tabIndex={truncated ? 0 : undefined}
                {...rest}
            >
                <span className="plus-status__content">
                    {visual && <span className="plus-status__visual">{renderVisual(visual)}</span>}
                    <span
                        ref={labelRef}
                        className={`plus-status__label ${size === 'large' ? 'body2-txt' : 'body3-txt'}`}
                    >
                        {children}
                    </span>
                </span>
                {hasCount && (
                    <Count
                        value={count}
                        style={effectiveStyle}
                        size={size === 'large' ? 'medium' : 'small'}
                    />
                )}
            </span>
        </Tooltip>
    );
};

Status.propTypes = {
    /** The status text, as people say it: "Needs review", "Due tomorrow". */
    children: PropTypes.node.isRequired,
    /** `state` for a condition; `date` for a due or event date, outlined with a fixed icon. */
    type: PropTypes.oneOf(STATUS_TYPES),
    /** The meaning. `date` takes only neutral (not close), warning (due soon) and danger (overdue). Info is Tertiary; discovery is the curriculum purple. */
    style: PropTypes.oneOf(STATUS_STYLES),
    /** `medium` (20) in rows, lists and sentences; `large` (32) beside a heading. */
    size: PropTypes.oneOf(STATUS_SIZES),
    /** One icon before the label: a Font Awesome solid name (`circle-check`) or a node. Ignored by `date`, which has its own. */
    leadingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** A number nested inside the label as a Count of the same style: small (16) in medium, medium (20) in large. Hidden at 0. */
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The widest the Status grows, in px or any CSS length. Past it the label ends in an ellipsis and the full text is a tooltip. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Status;
