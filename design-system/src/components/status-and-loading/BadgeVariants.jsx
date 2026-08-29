import React from 'react';
import PropTypes from 'prop-types';
import './BadgeVariants.scss';

/**
 * The system-generated half of the label system (#276).
 *
 * The rule that decides between this and `Tag`, verbatim from Fluent 2:
 *
 *   "A tag is a representation of a value that someone has picked… To show
 *    system-generated data that people can't change, use a badge instead."
 *
 * WHY THIS IS A SEPARATE FILE RATHER THAN A REWRITE OF `Badge.jsx`. 78 files
 * render `<Badge`, and 84 of those uses pass `size` — a prop this API removes
 * outright, because #276's rule is that a badge never introduces a type size
 * nothing else on the page shares. Rewriting in place would have to either keep
 * `size` (and lose the decision) or break 84 call sites in one commit (and lose
 * the deprecation period the spec asks for). `Badge` is re-exported from here
 * unchanged and keeps working; this is what new code reaches for, and what those
 * call sites migrate to one at a time.
 */

export const BADGE_VARIANTS = ['status', 'counter', 'date', 'custom'];

/**
 * A closed set of five, so the same state looks the same on every screen.
 *
 * The whole point of the restriction: with `style="primary"` as the old default,
 * a badge's colour carried no consistent signal, and a reader could not tell
 * whether blue meant "information", "the brand colour" or nothing at all. Each
 * maps to a token pair that already exists — no new tokens — and `discovery`
 * borrows the curriculum palette's purple, which is the one non-semantic set in
 * the system.
 */
export const BADGE_APPEARANCES = ['positive', 'negative', 'neutral', 'information', 'discovery'];

/**
 * `1204` with `max={99}` -> `99+`.
 *
 * Without it a four-digit count pushes a table column open, which is the
 * failure this exists to stop rather than a cosmetic preference.
 */
export function formatCount(value, max) {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return String(value ?? '');
  if (typeof max === 'number' && n > max) return `${max}+`;
  return String(n);
}

/**
 * A foreground that can actually be read on a given background.
 *
 * WHY THIS EXISTS AT ALL. `custom` is the escape hatch — the one place a
 * non-semantic colour gets in — and as first written it set a background and
 * left the text to inherit. A purple ground with the inherited near-black text
 * failed `color-contrast` in the a11y suite on the first run. That is precisely
 * the defect #276 is about, reintroduced through the one door the spec leaves
 * open: a badge whose colour signals nothing because nobody can read it.
 *
 * WCAG relative luminance, then the standard black-or-white decision at 0.179 —
 * the crossover where the contrast ratio against white and against black are
 * equal. It is not a full contrast optimiser and does not need to be: the only
 * question is which of the two extremes to use, and that one has an exact answer.
 *
 * An unparsable colour returns null, and the caller then sets no foreground at
 * all rather than guessing — inheriting is wrong, but inventing is worse.
 */
export function readableOn(background) {
  if (typeof background !== 'string') return null;
  let r;
  let g;
  let b;
  const hex = background.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    [r, g, b] = [...hex].map((c) => parseInt(c + c, 16));
  } else if (/^[0-9a-f]{6}$/i.test(hex)) {
    [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  } else {
    const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(background.trim());
    if (!m) return null;
    [r, g, b] = m.slice(1, 4).map(Number);
  }
  if ([r, g, b].some((c) => !Number.isFinite(c))) return null;
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.179 ? 'var(--color-on-surface, #191c1e)' : '#ffffff';
}

/**
 * A counter with nothing to say is a dot.
 *
 * Material treats the dot as its own component. Folding it in means one
 * anchoring rule and one decision instead of two — and the case it covers, "there
 * is something here but the number does not matter", is the same case.
 */
function isDot(children, text) {
  const content = children ?? text;
  if (content === null || content === undefined || content === '') return true;
  const n = typeof content === 'number' ? content : Number.parseInt(String(content), 10);
  return n === 0;
}

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
    className = '',
    id,
    ...rest
}) => {
    const content = children ?? text;

    // Density is padding, never type. Measured on Atlassian's live lozenge:
    // `default` is 20px tall with 4px inline padding, `spacious` is 32px with
    // 12px — and font-size and line-height are identical at 14px/20px in both.
    // A badge that changed type size with its density could disagree with the
    // text beside it, which is the same defect the removed `size` prop caused.
    const density = variant === 'status' || variant === 'date' ? spacing : 'default';

    const dot = variant === 'counter' && isDot(children, text);

    const classes = [
        'plus-badge-v',
        'body2-txt',
        `plus-badge-v--${variant}`,
        variant === 'custom' ? '' : `plus-badge-v--${appearance}`,
        `plus-badge-v--${density}`,
        dot ? 'plus-badge-v--dot' : '',
        isBold ? 'plus-badge-v--bold' : '',
        maxWidth ? 'plus-badge-v--truncated' : '',
        className,
    ].filter(Boolean).join(' ');

    const style = {
        ...(maxWidth ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : null),
        // `custom` is the escape hatch, and the only place a non-semantic colour
        // is allowed in. Everything else reads from the closed set above. The
        // foreground is derived rather than inherited — see `readableOn`, and the
        // a11y failure that put it there.
        ...(variant === 'custom' && color
            ? { backgroundColor: color, ...(textColor || readableOn(color) ? { color: textColor || readableOn(color) } : null) }
            : null),
    };

    const body = dot ? null : (
        <>
            {iconBefore && (
                // Where colour alone is not enough. `positive` and `information`
                // sit at 74° of hue apart but nearly identical lightness and
                // saturation, so hue carries all the differentiation — and that is
                // the axis that collapses under deuteranopia and protanopia.
                <span className="plus-badge-v__icon" aria-hidden="true">{iconBefore}</span>
            )}
            <span className="plus-badge-v__text">
                {variant === 'counter' ? formatCount(content, max) : content}
            </span>
            {trailingMetric !== undefined && trailingMetric !== null && variant === 'status' && (
                // The badge composes ITSELF. Atlassian's lozenge imports the badge
                // package to do this; both grounds are ours, so the inner
                // appearance is derived rather than mapped across a boundary. Bold,
                // so the count reads against the subtler ground it sits on.
                <BadgeVariants
                    variant="counter"
                    appearance={appearance}
                    max={max}
                    isBold
                    className="plus-badge-v__metric"
                >
                    {trailingMetric}
                </BadgeVariants>
            )}
        </>
    );

    return (
        <span
            id={id}
            className={classes}
            style={Object.keys(style).length ? style : undefined}
            // A dot has no text, so without a name it is a coloured circle that
            // assistive technology cannot describe. A badge WITH text needs no
            // label — its text is its meaning, and adding one would override it.
            {...(dot ? { role: 'status', 'aria-label': label || 'New' } : null)}
            {...(!dot && label ? { 'aria-label': label } : null)}
            title={maxWidth && typeof content === 'string' ? content : undefined}
            {...rest}
        >
            {body}
        </span>
    );
};

BadgeVariants.propTypes = {
    /** What kind of system-generated value this is. */
    variant: PropTypes.oneOf(BADGE_VARIANTS),
    /** `status` only: one of the closed set of five. Ignored on `custom`. */
    appearance: PropTypes.oneOf(BADGE_APPEARANCES),
    /** `status` and `date` only. Padding, never type. */
    spacing: PropTypes.oneOf(['default', 'spacious']),
    children: PropTypes.node,
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** `custom` only: the escape hatch, a non-semantic colour. */
    color: PropTypes.string,
    /** `custom` only: overrides the foreground derived from `color`. */
    textColor: PropTypes.string,
    /** A glyph, for where colour alone cannot carry the state. */
    iconBefore: PropTypes.node,
    /** `status` only: a count attached to the state — "In progress · 12". */
    trailingMetric: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** `counter` only: the cap. 1204 with max 99 reads `99+`. */
    max: PropTypes.number,
    /** Caps the badge and truncates, keeping the full text in `title`. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isBold: PropTypes.bool,
    /** An accessible name. Required in practice for a dot, which has no text. */
    label: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
    /* NO `size`. #276: a badge must not introduce a type size nothing else on
       the page shares. `spacing` changes padding instead. */
};

export default BadgeVariants;
