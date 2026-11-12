import React from 'react';
import PropTypes from 'prop-types';
import { devWarn } from '../../../lib/devWarn';

import CountTag, { COUNT_TAG_APPEARANCES, formatCount } from '../CountTag/CountTag';
import { ClippedTooltip } from '../../../lib/ClippedTooltip';
import Icon from '../../images-and-icons/Icon';
import './StatusTag.scss';

/**
 * `StatusTag` — the condition something is in.
 *
 * WHICH LABEL, IN FOUR QUESTIONS. Is it a number? Count tag. Is it a due or
 * event date? Date tag. Is it the condition something is in, and can that
 * condition change? Status tag, whether the system calculated it or a person
 * set it. Otherwise, Tag (or SmartTag for a SMART subject). A Status tag is
 * filled (a meaning); Tag is outlined (a category).
 *
 * THE NAMES FOLLOW THE LIBRARY. `appearance`, `spacing`, `iconBefore` and
 * `trailingMetric` take the same words Button and Count tag use, and the same
 * values as the Status tag set in Figma, so handoff needs no translation.
 *
 * A STATUS TAG IS NEVER A BUTTON. It is a `span` with no role and no click
 * handler. Where a status can be edited, the field around it becomes an inline
 * Dropdown; the label itself never becomes a control. The one time it takes
 * focus is when its text is truncated, so a keyboard user can reach the tooltip
 * that holds the full text.
 */

export const STATUS_TAG_APPEARANCES = ['neutral', 'success', 'warning', 'danger', 'info', 'discovery'];
export const STATUS_TAG_SPACINGS = ['default', 'spacious'];

const warn = devWarn('StatusTag');

/** A filled label for the condition something is in, such as "Needs review" or "Overdue". It is never a button; its appearance carries the meaning. */
export const StatusTag = ({
    children,
    appearance = 'neutral',
    spacing = 'default',
    iconBefore,
    trailingMetric,
    trailingMetricAppearance,
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

    let effectiveAppearance = appearance;
    if (!STATUS_TAG_APPEARANCES.includes(effectiveAppearance)) {
        warn(`appearance="${appearance}" is not one of ${STATUS_TAG_APPEARANCES.join(', ')}; it falls back to neutral.`);
        effectiveAppearance = 'neutral';
    }

    let effectiveSpacing = spacing;
    if (!STATUS_TAG_SPACINGS.includes(spacing)) {
        warn(`spacing="${spacing}" is not one of ${STATUS_TAG_SPACINGS.join(', ')}; it falls back to default.`);
        effectiveSpacing = 'default';
    }

    const wantsMetric = trailingMetric !== undefined && trailingMetric !== null && formatCount(trailingMetric) !== null;
    let metricAppearance = effectiveAppearance;
    if (trailingMetricAppearance !== undefined) {
        if (COUNT_TAG_APPEARANCES.includes(trailingMetricAppearance)) metricAppearance = trailingMetricAppearance;
        else warn(`trailingMetricAppearance="${trailingMetricAppearance}" is not one of ${COUNT_TAG_APPEARANCES.join(', ')}; it follows appearance.`);
    }

    const classes = [
        'plus-status',
        `plus-status--${effectiveAppearance}`,
        `plus-status--${effectiveSpacing}`,
        wantsMetric ? 'plus-status--with-count' : '',
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
        <ClippedTooltip
            text={children}
            deps={[effectiveSpacing, maxWidth, iconBefore, wantsMetric]}
        >
            {({ measureRef, truncated }) => (
                <span
                    id={id}
                    className={classes}
                    style={{ '--plus-status-max': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
                    {...rest}
                    tabIndex={truncated ? 0 : undefined}
                >
                    <span className="plus-status__content">
                        {iconBefore && (
                            <span className="plus-status__visual" aria-hidden="true"><Icon name={iconBefore} /></span>
                        )}
                        <span
                            ref={measureRef}
                            className="plus-status__label"
                        >
                            {children}
                        </span>
                    </span>
                    {wantsMetric && (
                        <CountTag
                            value={trailingMetric}
                            appearance={metricAppearance}
                            spacing={effectiveSpacing === 'spacious' ? 'default' : 'compact'}
                        />
                    )}
                </span>
            )}
        </ClippedTooltip>
    );
};

StatusTag.propTypes = {
    /** The status text, as people say it: "Needs review", "Due tomorrow". */
    children: PropTypes.node.isRequired,
    /** The meaning. Info is Tertiary; discovery is the curriculum purple. */
    appearance: PropTypes.oneOf(STATUS_TAG_APPEARANCES),
    /** `default` (20) in rows, lists and sentences; `spacious` (32) beside a heading. */
    spacing: PropTypes.oneOf(STATUS_TAG_SPACINGS),
    /** One icon before the label: a Font Awesome Free name (`circle-check`). */
    iconBefore: PropTypes.string,
    /** A small count at the end of the tag, a Count tag nested inside it: compact (16) in default, default (20) in spacious. Hidden at 0. */
    trailingMetric: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** The Count tag's appearance. Defaults to the Status tag's own. */
    trailingMetricAppearance: PropTypes.oneOf(COUNT_TAG_APPEARANCES),
    /** The widest the Status tag grows, in px or any CSS length, and never wider than its container. Past it the label ends in an ellipsis and the full text is a tooltip. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Extra class names added to the tag element beside the component's own. */
    className: PropTypes.string,
    /** The `id` attribute of the tag element. */
    id: PropTypes.string,
};

export default StatusTag;
