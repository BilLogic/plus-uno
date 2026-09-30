import React from 'react';
import PropTypes from 'prop-types';

import Count from './Count';
import Status from './Status';
import Tag from './Tag';

/**
 * `BadgeVariants` — deprecated. A thin wrapper over the labels that replaced it.
 *
 * WHICH LABEL, IN THREE QUESTIONS. Is it a number? Count. Is it the condition
 * something is in, and can that condition change? Status. Otherwise, Tag.
 * Who set the value no longer decides the component, which is the test this API
 * was built around.
 *
 * WHAT EACH VARIANT RENDERS. `status` is a Status, `date` a Status with
 * `type="date"`, `counter` a Count, and `custom` a read-only Tag, because a
 * color that means nothing is a category. `trailingMetric` is Status `count`,
 * `spacing` is Status `size`, `iconBefore` is `leadingVisual`, and `isBold` on
 * a counter is Count's bold appearance. Every render warns in development and
 * names the exact replacement, so a call moves by copying what the console
 * says. Nothing is styled here: each variant looks exactly like the component
 * it renders.
 */

export const BADGE_VARIANTS = ['status', 'counter', 'date', 'custom'];

/**
 * The six library words, then the three names this API used before them.
 * `positive`, `negative` and `information` are aliases for `success`, `danger`
 * and `info`, so an old call keeps its color.
 */
export const BADGE_APPEARANCES = ['neutral', 'success', 'warning', 'danger', 'info', 'discovery', 'positive', 'negative', 'information'];

const STYLE_OF = { positive: 'success', negative: 'danger', information: 'info' };

/**
 * `1204` with `max={99}` -> `99+`. The old signature, kept for anything that
 * imported it; Count formats its own value.
 */
export function formatCount(value, max) {
    const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(n)) return String(value ?? '');
    if (typeof max === 'number' && n > max) return `${max}+`;
    return String(n);
}

const warn = (message) => {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(`[BadgeVariants] ${message}`);
};

/** A counter with nothing to say is a dot: no content, or zero. */
const isEmptyCount = (content) => {
    if (content === null || content === undefined || content === '') return true;
    const n = typeof content === 'number' ? content : Number.parseInt(String(content), 10);
    return n === 0;
};

export const BadgeVariants = ({
    variant = 'status',
    appearance = 'neutral',
    spacing = 'default',
    children,
    text,
    color,
    iconBefore,
    textColor,
    trailingMetric,
    max,
    maxWidth,
    isBold = false,
    label,
    className,
    id,
    ...rest
}) => {
    const content = children ?? text;
    const kind = BADGE_VARIANTS.includes(variant) ? variant : 'status';
    const style = STYLE_OF[appearance] || appearance;
    const size = spacing === 'spacious' ? 'large' : 'medium';
    const shared = { id, className, ...rest };

    if (kind === 'custom') {
        warn('is deprecated; use <Tag>. A color that means nothing is a category; the color moves to the swatch.');
        return (
            <Tag
                swatchBefore={color}
                elemBefore={iconBefore}
                maxWidth={maxWidth}
                {...shared}
            >
                {content}
            </Tag>
        );
    }

    if (kind === 'counter') {
        const countAppearance = isBold ? 'bold' : 'subtle';
        if (isEmptyCount(content)) {
            warn(`is deprecated; use <Count appearance="dot" style="${style}" label="…">.`);
            return <Count appearance="dot" style={style} label={label || 'New'} {...shared} />;
        }
        warn(`is deprecated; use <Count style="${style}"${isBold ? ' appearance="bold"' : ''}>.`);
        if (!Number.isFinite(Number(content))) {
            warn(`variant="counter" takes a number; "${content}" renders nothing. A word is a Status or a Tag.`);
            return null;
        }
        return (
            <Count
                value={content}
                max={max}
                appearance={countAppearance}
                style={style}
                label={label}
                {...shared}
            />
        );
    }

    const isDate = kind === 'date';
    warn(`is deprecated; use <Status ${isDate ? 'type="date" ' : ''}style="${style}"${spacing === 'spacious' ? ' size="large"' : ''}>.`);
    return (
        <Status
            type={isDate ? 'date' : 'state'}
            style={style}
            size={size}
            leadingVisual={isDate ? undefined : iconBefore}
            count={isDate ? undefined : trailingMetric}
            maxWidth={maxWidth}
            {...(label ? { 'aria-label': label } : null)}
            {...shared}
        >
            {content}
        </Status>
    );
};

BadgeVariants.propTypes = {
    /** Which label this renders: `status` and `date` are a Status, `counter` a Count, `custom` a read-only Tag. */
    variant: PropTypes.oneOf(BADGE_VARIANTS),
    /** The Status or Count style. `positive`, `negative` and `information` are aliases for `success`, `danger` and `info`. A date takes neutral, warning and danger. Ignored on `custom`. */
    appearance: PropTypes.oneOf(BADGE_APPEARANCES),
    /** `status` and `date` only: `default` is Status size medium (20), `spacious` is large (32). */
    spacing: PropTypes.oneOf(['default', 'spacious']),
    children: PropTypes.node,
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** `custom` only: shown on the Tag's swatch. */
    color: PropTypes.string,
    /** `custom` only: ignored. A Tag's text is always neutral. */
    textColor: PropTypes.string,
    /** A glyph before the label: Status `leadingVisual`, or on `custom` the Tag's leading content in place of the swatch. A date has its own. */
    iconBefore: PropTypes.node,
    /** `status` only: Status `count`, nested inside the label and capped at 99. */
    trailingMetric: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** `counter` only: the cap (99 by default). 1204 with max 99 reads `99+`. */
    max: PropTypes.number,
    /** Caps the label, which ends in an ellipsis and shows its full text as a tooltip. 200 by default on a Status, 180 on a Tag. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** `counter` only: Count's bold appearance, for a count that asks for action now. */
    isBold: PropTypes.bool,
    /** An accessible name. A dot is named by it ("New" by default); on a number it replaces the bare digits for a screen reader. */
    label: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default BadgeVariants;
