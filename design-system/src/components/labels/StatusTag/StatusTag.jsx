import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import CountTag, { formatCount } from '../CountTag/CountTag';
import Tooltip from '../../overlays-and-layering/Tooltip';
import { useIsTruncated } from '../../../lib/useIsTruncated';
import './StatusTag.scss';

/**
 * `StatusTag` — the condition something is in.
 *
 * WHICH LABEL, IN THREE QUESTIONS. Is it a number? Count tag. Is it the
 * condition something is in, and can that condition change? Status tag, whether
 * the system calculated it or a person set it. Otherwise, Tag. A Status tag is
 * filled (a meaning); Tag is outlined (a category).
 *
 * THE NAMES FOLLOW THE LIBRARY. `type`, `appearance`, `spacing`,
 * `leadingVisual` and `count` take the same words Button and Count tag use, and
 * the same values as the Status tag set in Figma, so handoff needs no
 * translation.
 *
 * A STATUS TAG IS NEVER A BUTTON. It is a `span` with no role and no click
 * handler. Where a status can be edited, the field around it becomes an inline
 * Dropdown; the label itself never becomes a control. The one time it takes
 * focus is when its text is truncated, so a keyboard user can reach the tooltip
 * that holds the full text.
 *
 * A DATE IS OUTLINED, AND THE APP PICKS ITS APPEARANCE. `type="date"` takes
 * neutral (not close), warning (due soon) and danger (overdue), each with a
 * fixed icon. The appearance comes from the date and the due-soon window, never
 * from taste; any other appearance falls back to neutral with a development
 * warning, as an unknown appearance does on a state and an unknown type falls
 * back to state.
 *
 * A SMART SUBJECT KEEPS ITS COLORS. The five SMART subjects are appearances of a
 * state, drawn from the subject's own `smart` tokens.
 */

export const STATUS_TAG_TYPES = ['state', 'date'];
export const STATUS_TAG_STATUS_APPEARANCES = ['neutral', 'success', 'warning', 'danger', 'info', 'discovery'];
export const STATUS_TAG_SMART_APPEARANCES = ['social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'];
export const STATUS_TAG_APPEARANCES = [...STATUS_TAG_STATUS_APPEARANCES, ...STATUS_TAG_SMART_APPEARANCES];
export const STATUS_TAG_DATE_APPEARANCES = ['neutral', 'warning', 'danger'];
export const STATUS_TAG_SPACINGS = ['default', 'spacious'];

/** The fixed icon of each date appearance: calendar, clock, alert. */
export const STATUS_TAG_DATE_ICONS = {
    neutral: 'calendar',
    warning: 'clock',
    danger: 'triangle-exclamation',
};

const warn = (message) => {
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[StatusTag] ${message}`);
    }
};

/** A string is a Font Awesome solid icon name, as Button takes it; anything else renders as given. */
const renderVisual = (visual) => (typeof visual === 'string'
    ? <i className={`fa-solid fa-${visual}`} aria-hidden="true" />
    : visual);

export const StatusTag = ({
    children,
    type = 'state',
    appearance = 'neutral',
    spacing = 'default',
    leadingVisual,
    count,
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
            warn(`\`${name}\` is ignored: a Status tag is never a button. Edit a status through an inline Dropdown in its field.`);
        }
    }

    let effectiveType = type;
    if (!STATUS_TAG_TYPES.includes(type)) {
        warn(`type="${type}" is not one of ${STATUS_TAG_TYPES.join(', ')}; it falls back to state.`);
        effectiveType = 'state';
    }
    const isDate = effectiveType === 'date';
    const allowed = isDate ? STATUS_TAG_DATE_APPEARANCES : STATUS_TAG_APPEARANCES;
    let effectiveAppearance = appearance;
    if (!allowed.includes(effectiveAppearance)) {
        warn(`type="${effectiveType}" takes ${allowed.join(', ')}; appearance="${appearance}" falls back to neutral.`);
        effectiveAppearance = 'neutral';
    }

    let effectiveSpacing = spacing;
    if (!STATUS_TAG_SPACINGS.includes(spacing)) {
        warn(`spacing="${spacing}" is not one of ${STATUS_TAG_SPACINGS.join(', ')}; it falls back to default.`);
        effectiveSpacing = 'default';
    }

    const visual = isDate ? STATUS_TAG_DATE_ICONS[effectiveAppearance] : leadingVisual;
    const hasCount = count !== undefined && count !== null && formatCount(count) !== null;

    /*
     * A node visual is a new object every render; keying the measurement on it
     * would rebuild the ResizeObserver each time. Its presence is what changes
     * the label's width.
     */
    const visualKey = typeof visual === 'string' ? visual : Boolean(visual);
    const labelRef = useRef(null);
    const truncated = useIsTruncated(labelRef, [children, effectiveSpacing, maxWidth, visualKey, hasCount]);

    const classes = [
        'plus-status',
        `plus-status--${effectiveType}`,
        `plus-status--${effectiveAppearance}`,
        `plus-status--${effectiveSpacing}`,
        hasCount ? 'plus-status--with-count' : '',
        className,
    ].filter(Boolean).join(' ');

    /*
     * `maxWidth` travels as a custom property, not an inline `max-width`, so
     * the stylesheet can also clamp to the container: a Status tag in a column
     * narrower than its cap truncates instead of overflowing.
     *
     * The tooltip is always mounted and switched on only while the label is
     * clipped, so the element a person is focused on never remounts under them
     * when the page resizes.
     */
    return (
        <Tooltip text={children} trigger={truncated ? ['hover', 'focus'] : []}>
            <span
                id={id}
                className={classes}
                style={{ '--plus-status-max': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
                {...rest}
                tabIndex={truncated ? 0 : undefined}
            >
                <span className="plus-status__content">
                    {visual && (
                        <span className="plus-status__visual" aria-hidden="true">{renderVisual(visual)}</span>
                    )}
                    <span
                        ref={labelRef}
                        className="plus-status__label"
                    >
                        {children}
                    </span>
                </span>
                {hasCount && (
                    <CountTag
                        value={count}
                        appearance={STATUS_TAG_STATUS_APPEARANCES.includes(effectiveAppearance) ? effectiveAppearance : 'neutral'}
                        spacing={effectiveSpacing === 'spacious' ? 'default' : 'compact'}
                    />
                )}
            </span>
        </Tooltip>
    );
};

StatusTag.propTypes = {
    /** The status text, as people say it: "Needs review", "Due tomorrow". */
    children: PropTypes.node.isRequired,
    /** `state` for a condition; `date` for a due or event date, outlined with a fixed icon. */
    type: PropTypes.oneOf(STATUS_TAG_TYPES),
    /** The meaning. `date` takes only neutral (not close), warning (due soon) and danger (overdue). Info is Tertiary; discovery is the curriculum purple. The five SMART subjects draw their own `smart` tokens. */
    appearance: PropTypes.oneOf(STATUS_TAG_APPEARANCES),
    /** `default` (20) in rows, lists and sentences; `spacious` (32) beside a heading. */
    spacing: PropTypes.oneOf(STATUS_TAG_SPACINGS),
    /** One icon before the label: a Font Awesome solid name (`circle-check`) or a node. Ignored by `date`, which has its own. */
    leadingVisual: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** A number nested inside the label as a Count tag of the same appearance: compact (16) in default, default (20) in spacious. Hidden at 0. */
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The widest the Status tag grows, in px or any CSS length, and never wider than its container. Past it the label ends in an ellipsis and the full text is a tooltip. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    id: PropTypes.string,
};

export default StatusTag;
