import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { devWarn } from '../../../lib/devWarn';

import VisuallyHidden from '@/components/text-and-data-display/VisuallyHidden';
import Icon from '../../images-and-icons/Icon';
import './ChangeTag.scss';

/**
 * `ChangeTag` — change over time, such as "▲ +3 vs last week".
 *
 * THE SIGN IS THE DIRECTION. `value` is a signed number: above zero draws an
 * up arrow and a plus, below zero a down arrow and a minus, zero a flat arrow.
 * `null` means there is nothing to compare, and draws an em dash.
 *
 * THE TONE IS A SEPARATE CALL. `goodDirection` says which way is good: `up`
 * for sessions held, `down` for no-shows, `none` for a change with no value
 * judgment (hours tutored). Success and danger come from that, never from the
 * arrow, so "up is bad" needs no hand-flipped color.
 *
 * COLOR NEVER CARRIES IT ALONE. The arrow and the sign say the direction, and
 * a screen reader hears it in words ("Up 3 vs last week"); the visible chip is
 * `aria-hidden` so nothing is read twice.
 *
 * A CHANGE TAG IS NEVER A BUTTON. It is a `span` with no role, no click
 * handler and no tab stop.
 */

export const CHANGE_TAG_FORMATS = ['number', 'percent', 'points'];
export const CHANGE_TAG_GOOD_DIRECTIONS = ['up', 'down', 'none'];
export const CHANGE_TAG_SPACINGS = ['default', 'compact'];

/** The arrow each direction draws. */
export const CHANGE_TAG_ICONS = {
    up: 'arrow-up',
    down: 'arrow-down',
    flat: 'arrow-right',
};

/** A true minus sign, not a hyphen, so "−12%" lines up with "+12%". */
const MINUS = '−';
const EM_DASH = '—';

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

const warn = devWarn('ChangeTag');

/**
 * What the tag shows and says for a value. `direction` is `up`, `down`,
 * `flat`, or `null` when there is no number to compare.
 */
export const describeChange = (value, format = 'number') => {
    const n = value === null || value === undefined || value === '' ? NaN : Number(value);
    if (!Number.isFinite(n)) {
        return { direction: null, text: EM_DASH, spoken: 'No change data' };
    }
    const amount = numberFormat.format(Math.abs(n));
    const direction = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
    const sign = direction === 'up' ? '+' : direction === 'down' ? MINUS : '';
    const shown = format === 'percent' ? `${amount}%` : format === 'points' ? `${amount} pts` : amount;
    if (direction === 'flat') {
        return { direction, text: shown, spoken: 'No change' };
    }
    const unit = format === 'percent' ? '%' : format === 'points' ? (Math.abs(n) === 1 ? ' point' : ' points') : '';
    return {
        direction,
        text: `${sign}${shown}`,
        spoken: `${direction === 'up' ? 'Up' : 'Down'} ${amount}${unit}`,
    };
};

/** The tone a direction takes, given which way is good. */
export const changeTone = (direction, goodDirection = 'none') => {
    if (goodDirection === 'none' || direction === null || direction === 'flat') return 'neutral';
    return direction === goodDirection ? 'success' : 'danger';
};

/** A small label for change over time, such as "+3 vs last week". The sign sets the arrow, `goodDirection` sets the tone, and the change is spoken in words. It is never a button. */
export const ChangeTag = ({
    value,
    format = 'number',
    goodDirection = 'none',
    comparison,
    spacing = 'default',
    iconBefore,
    className = '',
    id,
    onClick,
    role,
    tabIndex,
    ...rest
}) => {
    for (const [name, given] of [['onClick', onClick], ['role', role], ['tabIndex', tabIndex]]) {
        if (given !== undefined) {
            warn(`\`${name}\` is ignored: a Change tag is never a button.`);
        }
    }

    let effectiveFormat = format;
    if (!CHANGE_TAG_FORMATS.includes(format)) {
        warn(`format="${format}" is not one of ${CHANGE_TAG_FORMATS.join(', ')}; it falls back to number.`);
        effectiveFormat = 'number';
    }

    let effectiveGood = goodDirection;
    if (!CHANGE_TAG_GOOD_DIRECTIONS.includes(goodDirection)) {
        warn(`goodDirection="${goodDirection}" is not one of ${CHANGE_TAG_GOOD_DIRECTIONS.join(', ')}; it falls back to none.`);
        effectiveGood = 'none';
    }

    let effectiveSpacing = spacing;
    if (!CHANGE_TAG_SPACINGS.includes(spacing)) {
        warn(`spacing="${spacing}" is not one of ${CHANGE_TAG_SPACINGS.join(', ')}; it falls back to default.`);
        effectiveSpacing = 'default';
    }

    const { direction, text, spoken } = describeChange(value, effectiveFormat);
    const tone = changeTone(direction, effectiveGood);
    const icon = iconBefore ?? (direction ? CHANGE_TAG_ICONS[direction] : null);

    /*
     * A new value fades in. The value is keyed on how many times it has
     * changed, so a re-render with the same value keeps its element, and the
     * first render does not animate at all: only a change does. The chip's
     * color change is a plain transition on the element that stays.
     */
    const lastText = useRef(text);
    const changes = useRef(0);
    if (lastText.current !== text) {
        lastText.current = text;
        changes.current += 1;
    }

    const classes = [
        'plus-change-tag',
        `plus-change-tag--${tone}`,
        `plus-change-tag--${effectiveSpacing}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <span id={id} className={classes} {...rest}>
            <span className="plus-change-tag__chip" aria-hidden="true">
                {icon && (
                    <span className="plus-change-tag__visual">
                        <Icon name={icon} />
                    </span>
                )}
                <span
                    key={changes.current}
                    className={`plus-change-tag__value${changes.current > 0 ? ' plus-change-tag__value--entering' : ''}`}
                >
                    {text}
                </span>
            </span>
            {comparison !== undefined && comparison !== null && comparison !== '' && (
                <span className="plus-change-tag__comparison" aria-hidden="true">{comparison}</span>
            )}
            <VisuallyHidden>
                {spoken}
                {comparison !== undefined && comparison !== null && comparison !== '' && <> {comparison}</>}
            </VisuallyHidden>
        </span>
    );
};

ChangeTag.propTypes = {
    /** The signed change. Above zero is up, below is down, zero is flat; `null` shows an em dash and reads "No change data". */
    value: PropTypes.number,
    /** `number` (+3), `percent` (+12%) or `points` (+3 pts). Always signed. */
    format: PropTypes.oneOf(CHANGE_TAG_FORMATS),
    /** Which way is good: `up` or `down` turn the tag success or danger; `none` keeps it neutral for a change with no value judgment. */
    goodDirection: PropTypes.oneOf(CHANGE_TAG_GOOD_DIRECTIONS),
    /** What the change is measured against, such as "vs last week", in subtle text after the tag. */
    comparison: PropTypes.node,
    /** `default` (20) in cards and headers; `compact` (16) in table cells. */
    spacing: PropTypes.oneOf(CHANGE_TAG_SPACINGS),
    /** Replaces the direction arrow: a Font Awesome Free name (`arrow-trend-up`). Decorative; the words carry the direction. */
    iconBefore: PropTypes.string,
    /** Extra class names added to the tag element beside the component's own. */
    className: PropTypes.string,
    /** The `id` attribute of the tag element. */
    id: PropTypes.string,
};

export default ChangeTag;
