import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Count from '../Count';
import Tooltip from '../../overlays/Tooltip';
import './Tag.scss';

/**
 * `Tag` — a category: a subject, a focus area, a person, anything that is not a
 * number or a changing condition.
 *
 * WHICH LABEL, IN THREE QUESTIONS. Is it a number? Count. Is it the condition
 * something is in, and can that condition change? Status. Otherwise, Tag.
 *
 * OUTLINED, SO IT NEVER READS AS A STATUS. A Status is filled because its color
 * is a meaning; a Tag is outlined because its color is only a category. The text
 * stays neutral, and the hue sits on the border and on a 10px swatch. One size,
 * 22 tall, for every behavior.
 *
 * NO `disabled` PROP. A tag is disabled because the field holding it is: the
 * field wraps its tags in `TagContext.Provider`, so one tag can never disagree
 * with the tags beside it.
 */

/**
 * The color names are categories, never statuses, so there is no `success` or
 * `danger` here. Each name borrows the curriculum hue it names (teal is
 * Tertiary, never Info); the name-to-token map is in `Tag.scss`.
 */
export const TAG_COLORS = ['grey', 'blue', 'green', 'purple', 'magenta', 'yellow', 'teal'];

export const TAG_BEHAVIORS = ['read-only', 'removable', 'selectable', 'link'];

/** The old `variant` values, still accepted as a deprecated alias for `behavior`. */
export const TAG_VARIANTS = ['read-only', 'dismissible', 'selectable', 'operational'];

/** Deprecated names, still accepted, and what each one now means. */
const DEPRECATED_COLORS = { orange: 'yellow' };

/** Every name `color` accepts: the seven, then the deprecated aliases. */
const ACCEPTED_COLORS = ['grey', 'blue', 'green', 'purple', 'magenta', 'yellow', 'teal', 'orange'];

/*
 * `operational` has no place in the new set: a tag that performs an action
 * once is a button that looks like a tag, which is what TagGroup's `+n` still
 * is. It keeps working as a plain button with no pressed state until TagGroup
 * moves off it.
 */
const DEPRECATED_VARIANTS = {
    'read-only': 'read-only',
    dismissible: 'removable',
    selectable: 'selectable',
    operational: 'action',
};

/**
 * Disabled state for every tag inside a field. A field wraps its tags in
 * `<TagContext.Provider value={{ isDisabled: true }}>`.
 */
export const TagContext = createContext({ isDisabled: false });

/** What the containing field says about its tags. */
export const useTagContext = () => useContext(TagContext);

const warn = (message) => {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(message);
};

/*
 * Only a label that is really clipped gets a tooltip. With a 180 cap on every
 * tag, a tooltip on every tag would repeat what most of them already show.
 */
const useTruncated = (ref, deps) => {
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

export const Tag = ({
    text,
    children,
    behavior,
    variant,
    color = 'grey',
    count,
    elemBefore,
    swatchBefore,
    maxWidth = 180,
    href,
    linkComponent,
    isSelected = false,
    isLoading = false,
    onClick,
    onRemove,
    removeLabel,
    className = '',
    id,
    style: styleProp,
    ...rest
}) => {
    const { isDisabled = false } = useTagContext() || {};
    const label = children ?? text;
    const labelRef = useRef(null);
    const truncated = useTruncated(labelRef, [label, maxWidth]);

    let resolvedColor = color;
    if (DEPRECATED_COLORS[resolvedColor]) {
        warn(`[Tag] color="${resolvedColor}" is deprecated; use "${DEPRECATED_COLORS[resolvedColor]}".`);
        resolvedColor = DEPRECATED_COLORS[resolvedColor];
    }

    // `behavior` wins; `variant` is the old name for it. With neither, an
    // `href` still makes a link, as it did before `behavior` existed.
    let resolved = behavior;
    if (!resolved && variant) {
        // `operational` has no replacement to point at yet, so it stays quiet
        // until TagGroup's `+n`, its one caller, moves to its own path.
        if (variant !== 'operational') {
            warn(`[Tag] variant="${variant}" is deprecated; use behavior="${DEPRECATED_VARIANTS[variant]}".`);
        }
        resolved = DEPRECATED_VARIANTS[variant];
    }
    if (!resolved) resolved = href ? 'link' : 'read-only';

    const isSelectable = resolved === 'selectable';
    const isAction = resolved === 'action';
    const isLink = resolved === 'link';

    // A count is a filter's result count, so it belongs to selectable only. On
    // a removable tag it would crowd the ×; elsewhere it would read as a Count
    // sitting beside a tag rather than part of it.
    if (count !== undefined && count !== null && !isSelectable) {
        warn(`[Tag] \`count\` is only shown on behavior="selectable"; it is ignored on "${resolved}".`);
    }
    const showCount = isSelectable && count !== undefined && count !== null;

    // The × renders for removable, and for a link with `onRemove`. Never in a
    // disabled field: a value you cannot change has nothing to remove.
    const hasRemove = (resolved === 'removable' || isLink)
        && typeof onRemove === 'function'
        && !isDisabled;

    // A × named only "Remove" is one of a row of identical controls.
    if (hasRemove && !removeLabel && typeof label !== 'string') {
        warn('[Tag] the label is not text, so the × is named only "Remove". Pass `removeLabel` to say what it removes.');
    }

    // A disabled tag drops its behavior class, so no hover, press or underline
    // rule written for the behavior can reach it.
    const classes = [
        'plus-tag',
        `plus-tag--${resolvedColor}`,
        isDisabled ? 'plus-tag--disabled' : `plus-tag--${resolved}`,
        isSelectable && isSelected ? 'plus-tag--selected' : '',
        isLoading ? 'plus-tag--loading' : '',
        className,
    ].filter(Boolean).join(' ');

    // The cap is a custom property so the stylesheet can still clamp it to a
    // narrow container: `min(cap, 100%)`.
    const style = maxWidth
        ? { '--plus-tag-max': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth, ...styleProp }
        : styleProp;

    // Saving swaps the swatch for a spinner of the same size, so the tag keeps
    // its width. The overflow `+n` is a count of hidden tags, not a category,
    // so it carries no swatch.
    let lead = null;
    if (isLoading) {
        lead = <span className="plus-tag__spinner" aria-hidden="true" />;
    } else if (elemBefore) {
        lead = <span className="plus-tag__elem-before">{elemBefore}</span>;
    } else if (!isAction) {
        lead = (
            <span
                className={['plus-tag__swatch', swatchBefore ? 'plus-tag__swatch--custom' : ''].filter(Boolean).join(' ')}
                style={swatchBefore ? { backgroundColor: swatchBefore } : undefined}
                // Decorative: the swatch repeats what the words already say.
                aria-hidden="true"
            />
        );
    }

    /*
     * The tooltip goes on whatever takes focus. A tag that is already a control
     * carries it on the control, so a clipped label adds no second tab stop. On
     * a span tag the label itself becomes focusable, and only while clipped.
     * The Tooltip is always mounted and switched on by truncation, so nothing a
     * person is focused on remounts when the page resizes.
     */
    const tooltipText = typeof label === 'string' ? label : '';
    const withTooltip = (element) => (
        <Tooltip text={tooltipText || ' '} trigger={truncated && tooltipText ? ['hover', 'focus'] : []}>
            {element}
        </Tooltip>
    );

    const isControl = isSelectable || isAction || (isLink && !isDisabled);
    const labelSpan = (
        <span
            ref={labelRef}
            className="plus-tag__label body3-txt"
            tabIndex={!isControl && !isDisabled && truncated ? 0 : undefined}
        >
            {label}
        </span>
    );
    const labelNode = isControl ? labelSpan : withTooltip(labelSpan);

    /*
     * One live region per tag, always mounted and outside the control, so
     * "Saving" is announced once when it appears and never becomes part of
     * the control's name.
     */
    const status = (
        <span className="plus-tag__status" role="status">{isLoading ? 'Saving' : ''}</span>
    );

    const removeButton = hasRemove ? (
        <button
            type="button"
            className="plus-tag__remove"
            aria-label={removeLabel || (typeof label === 'string' ? `Remove ${label}` : 'Remove')}
            // While the value saves, the × stays where it is (the tag keeps its
            // shape) but does nothing, so a second action cannot queue behind
            // the first. `aria-disabled` keeps it focusable, where `disabled`
            // would throw focus to the page.
            aria-disabled={isLoading ? 'true' : undefined}
            onClick={(e) => {
                e.stopPropagation();
                if (isLoading) return;
                onRemove(e);
            }}
        >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
    ) : null;

    const shared = { id, className: classes, style, ...rest };

    if (isSelectable || isAction) {
        return (
            <>
                {withTooltip(
                    <button
                        type="button"
                        {...shared}
                        disabled={isDisabled || undefined}
                        aria-disabled={isLoading ? 'true' : undefined}
                        // `aria-pressed` makes a selectable tag a toggle rather
                        // than a button that looks different afterwards.
                        aria-pressed={isSelectable ? isSelected : undefined}
                        onClick={(e) => {
                            if (isLoading) return;
                            onClick?.(e);
                        }}
                    >
                        {lead}
                        {labelNode}
                        {showCount && <Count value={count} size="small" />}
                    </button>,
                )}
                {status}
            </>
        );
    }

    if (isLink && !isDisabled) {
        const Link = linkComponent || 'a';
        const linkProps = {
            href,
            'aria-disabled': isLoading ? 'true' : undefined,
            onClick: (e) => {
                if (isLoading) {
                    e.preventDefault();
                    return;
                }
                onClick?.(e);
            },
        };
        if (hasRemove) {
            // Two targets, never one inside the other: the text is the link and
            // the × is its sibling, so removing a tag can never follow it. Tab
            // order is the DOM order, link then ×.
            return (
                <>
                    <span {...shared} className={`${classes} plus-tag--split`}>
                        {withTooltip(
                            <Link className="plus-tag__link" {...linkProps}>
                                {lead}
                                {labelNode}
                            </Link>,
                        )}
                        {removeButton}
                    </span>
                    {status}
                </>
            );
        }
        return (
            <>
                {withTooltip(
                    <Link {...shared} {...linkProps}>
                        {lead}
                        {labelNode}
                    </Link>,
                )}
                {status}
            </>
        );
    }

    return (
        <>
            <span {...shared}>
                {lead}
                {labelNode}
                {removeButton}
            </span>
            {status}
        </>
    );
};

Tag.propTypes = {
    /** The label (alternative to children). */
    text: PropTypes.string,
    /** The label (takes precedence over `text`). */
    children: PropTypes.node,
    /** What a person can do with the tag. `read-only` by default; `link` needs `href`. */
    behavior: PropTypes.oneOf(TAG_BEHAVIORS),
    /** Deprecated: use `behavior`. `dismissible` is `removable`; `operational` renders a plain button. */
    variant: PropTypes.oneOf(TAG_VARIANTS),
    /** A category color, on the border and swatch. Never a status. `orange` is a deprecated alias for `yellow`. */
    color: PropTypes.oneOf(ACCEPTED_COLORS),
    /** `selectable` only: a small neutral Count, such as a filter's result count. Ignored with a warning elsewhere. */
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Leading content in place of the swatch, such as an icon. */
    elemBefore: PropTypes.node,
    /** Overrides the swatch color, for a tag acting as a chart legend entry. Any CSS color. */
    swatchBefore: PropTypes.string,
    /** Caps the whole tag (default 180). A clipped label ellipsizes and shows its full text as a tooltip. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Where a `link` tag goes. */
    href: PropTypes.string,
    /** Router link to render instead of `<a>` for a `link` tag. */
    linkComponent: PropTypes.elementType,
    /** `selectable` only: the toggle's state, published as `aria-pressed`. */
    isSelected: PropTypes.bool,
    /** Saving: a spinner replaces the swatch and the tag ignores presses until it is done. */
    isLoading: PropTypes.bool,
    /** Fires on `selectable`, and on a `link`. */
    onClick: PropTypes.func,
    /** `removable`, or a `link` with a separate ×: called when the × is pressed. */
    onRemove: PropTypes.func,
    /** Overrides the ×'s accessible name. Defaults to `Remove <label>`. */
    removeLabel: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
    style: PropTypes.object,
};

export default Tag;
