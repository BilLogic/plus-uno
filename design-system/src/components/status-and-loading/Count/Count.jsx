import React from 'react';
import PropTypes from 'prop-types';
import './Count.scss';

/**
 * `Count` — a number on its own, as a pill.
 *
 * WHICH LABEL, IN THREE QUESTIONS. Is it a number? Count. Is it the condition
 * something is in, and can that condition change? Status. Otherwise, Tag. `size`
 * small (16) is for use inside a label; Status and Tag will nest it when they
 * ship, so there is one count shape across the product.
 *
 * THE NAMES FOLLOW THE LIBRARY. `appearance`, `style` and `size` take the same
 * words Button and Alert use, and the same values as the Count set in Figma, so
 * handoff needs no translation. Figma's `ring?` is `ring` here.
 *
 * THE COUNT IS NOT A CONTROL. It is a `span`, never a button: it sits inside
 * buttons, tabs and nav items, and a control inside a control is invalid per
 * ARIA. Whatever is pressable is the thing around it.
 */

export const COUNT_APPEARANCES = ['subtle', 'bold', 'inverse', 'dot'];
export const COUNT_STYLES = ['neutral', 'success', 'warning', 'danger', 'info', 'discovery'];
export const COUNT_SIZES = ['medium', 'small'];

/**
 * What the pill shows for a value. `null` means "render nothing": a count of
 * zero is an empty tab, and an empty tab showing "0" is noise unless the caller
 * asks for it.
 */
export const formatCount = (value, { max = 99, showZero = false } = {}) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n <= 0 && !showZero) return null;
    return n > max ? `${max}+` : String(n);
};

export const Count = ({
    value,
    max = 99,
    showZero = false,
    appearance = 'subtle',
    style = 'neutral',
    size = 'medium',
    ring = false,
    label,
    className = '',
    id,
    ...rest
}) => {
    const isDot = appearance === 'dot';

    /*
     * A dot has no number, so without a label it is a colored circle announced
     * as nothing. Warn in development rather than throw: the dot still renders,
     * and the console says what is missing.
     */
    if (isDot && !label && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Count] appearance="dot" needs a `label`: a dot with no name is announced as nothing.');
    }

    const text = isDot ? null : formatCount(value, { max, showZero });
    if (!isDot && text === null) return null;

    const classes = [
        'plus-count',
        `plus-count--${appearance}`,
        `plus-count--${style}`,
        isDot ? '' : `plus-count--${size}`,
        ring ? 'plus-count--ring' : '',
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
            <span className="plus-count__value body3-txt" aria-hidden={label ? 'true' : undefined}>
                {text}
            </span>
            {label && <span className="plus-count__label">{label}</span>}
        </span>
    );
};

Count.propTypes = {
    /** The number. Hidden at 0 (and below) unless `showZero`. Ignored by `dot`. */
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Above this the pill shows `{max}+`. */
    max: PropTypes.number,
    /** Render a count of 0 instead of nothing. */
    showZero: PropTypes.bool,
    /** `subtle` by default; `bold` asks for action now (at most one per area); `inverse` sits on dark surfaces such as inverse-surface; `dot` is presence without a number. */
    appearance: PropTypes.oneOf(COUNT_APPEARANCES),
    /** The intent. Use one only when the number carries it. `inverse` is always neutral. */
    style: PropTypes.oneOf(COUNT_STYLES),
    /** `medium` (20) on its own; `small` (16) is for use inside a label. A dot is always 8. */
    size: PropTypes.oneOf(COUNT_SIZES),
    /** A 2px surface ring, for a count pinned to the corner of an icon or avatar. */
    ring: PropTypes.bool,
    /** The accessible name. Required for `dot`; on a number it replaces the bare digits for screen readers. */
    label: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Count;
