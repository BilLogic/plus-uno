import React from 'react';
import PropTypes from 'prop-types';
import './CountTag.scss';

/**
 * `CountTag` — a number on its own, as a near-square badge.
 *
 * WHICH LABEL, IN THREE QUESTIONS. Is it a number? Count tag. Is it the
 * condition something is in, and can that condition change? Status tag.
 * Otherwise, Tag. `spacing="compact"` (16) is for use inside a label: Status
 * tag and Tag nest it, so there is one count shape across the product.
 *
 * THE NAMES FOLLOW THE LIBRARY. `appearance`, `spacing` and the `is…`/`has…`
 * booleans take the same words Button uses, and the same values as the Count
 * tag set in Figma, so handoff needs no translation.
 *
 * THE COUNT IS NOT A CONTROL. It is a `span`, never a button: it sits inside
 * buttons, tabs and nav items, and a control inside a control is invalid per
 * ARIA. Whatever is pressable is the thing around it.
 */

export const COUNT_TAG_APPEARANCES = ['neutral', 'success', 'warning', 'danger', 'info', 'discovery'];
export const COUNT_TAG_SPACINGS = ['default', 'compact'];

/**
 * What the badge shows for a value. `null` means "render nothing": a count of
 * zero is an empty tab, and an empty tab showing "0" is noise unless the caller
 * asks for it.
 */
export const formatCount = (value, { max = 99, showZero = false } = {}) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n <= 0 && !showZero) return null;
    return n > max ? `${max}+` : String(n);
};

/** CountTag: a number on its own, as a near-square badge. */
export const CountTag = ({
    value,
    max = 99,
    showZero = false,
    appearance = 'neutral',
    spacing = 'default',
    isBold = false,
    isInverse = false,
    isDot = false,
    hasRing = false,
    label,
    className = '',
    id,
    ...rest
}) => {
    /*
     * A dot has no number, so without a label it is a colored circle announced
     * as nothing. Warn in development rather than throw: the dot still renders,
     * and the console says what is missing.
     */
    if (isDot && !label && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[CountTag] isDot needs a `label`: a dot with no name is announced as nothing.');
    }

    const text = isDot ? null : formatCount(value, { max, showZero });
    if (!isDot && text === null) return null;

    let emphasis = 'subtle';
    if (isInverse) emphasis = 'inverse';
    else if (isBold) emphasis = 'bold';

    const classes = [
        'plus-count',
        isDot ? 'plus-count--dot' : `plus-count--${emphasis}`,
        `plus-count--${appearance}`,
        isDot ? '' : `plus-count--${spacing}`,
        hasRing ? 'plus-count--ring' : '',
        className,
    ].filter(Boolean).join(' ');

    if (isDot) {
        return (
            <span
                id={id}
                className={classes}
                role="img"
                aria-label={label}
                {...rest}
            />
        );
    }

    /*
     * With a label, the number is still what a sighted reader sees, and the
     * label is what a screen reader hears — "4" beside "Messages" is a number,
     * "4 unread messages" is information.
     */
    return (
        <span id={id} className={classes} {...rest}>
            <span className="plus-count__value" aria-hidden={label ? 'true' : undefined}>
                {text}
            </span>
            {label && <span className="plus-count__label">{label}</span>}
        </span>
    );
};

CountTag.propTypes = {
    /** The number. Hidden at 0 (and below) unless `showZero`. Ignored by `isDot`. */
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Above this the count shows `{max}+`. */
    max: PropTypes.number,
    /** Render a count of 0 instead of nothing. */
    showZero: PropTypes.bool,
    /** The intent. Use one only when the number carries it. */
    appearance: PropTypes.oneOf(COUNT_TAG_APPEARANCES),
    /** `default` (20) on its own; `compact` (16) is for use inside a label. A dot is always 8. */
    spacing: PropTypes.oneOf(COUNT_TAG_SPACINGS),
    /** The solid fill: asks for action now (at most one per area). */
    isBold: PropTypes.bool,
    /** A solid white badge with dark text, for filled buttons and dark grounds. Always neutral. */
    isInverse: PropTypes.bool,
    /** Presence without a number. Needs `label`. */
    isDot: PropTypes.bool,
    /** A 2px ring in the page color, for a count pinned to the corner of an icon or avatar. */
    hasRing: PropTypes.bool,
    /** The accessible name. Required for `isDot`; on a number it replaces the bare digits for screen readers. */
    label: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default CountTag;
