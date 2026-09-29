import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Tag, { TagContext, useTagContext } from '../Tag';
import Dropdown from '../../forms-and-inputs/Dropdown';
import './TagGroup.scss';

/**
 * The container for a set of tags.
 *
 * IT EXISTS TO OWN WHAT A SINGLE TAG CANNOT DECIDE: the 8px gap between tags,
 * whether a long set wraps or collapses, which edge the set lines up on, and
 * whether the set is disabled. All four are properties of the set, not of any
 * member of it.
 *
 * THE GAP LIVES HERE, NOT ON THE TAG. Atlassian's tag carries its own margin,
 * which then has to be switched off with a `hasMargin` escape hatch whenever a
 * parent uses `gap` — an API that exists only to undo a decision made in the
 * wrong place. `Tag` sets `margin: 0` and this sets `gap`, so there is nothing
 * to undo and nothing to double up.
 *
 * COLLAPSE FITS BY WIDTH. A collapsed group shows as many tags as fit on one
 * line, then a `+n` tag that opens a menu of the rest. It measures on every
 * render and whenever it is resized, so the count follows the container rather
 * than a number picked against today's labels.
 *
 * DISABLED IS THE FIELD'S. `disabled` reaches every Tag and Suggestion in the
 * group through `TagContext`, the same context a field uses, so no member can
 * disagree with the one beside it.
 */

export const TAG_GROUP_OVERFLOWS = ['wrap', 'collapse'];
export const TAG_GROUP_ALIGNMENTS = ['left', 'right'];

/** A tag's words, for its line in the `+n` menu. */
const labelOf = (child) => {
    const props = child.props || {};
    return props.children ?? props.text ?? props.label;
};

/**
 * How many of `widths` fit in `available`, with `gap` between them and room
 * for the overflow tag when any are left out, and whether the first has to
 * shrink to fit at all. At least one always shows: a row of only `+n` hides
 * every value behind a press, while one tag that truncates still says what
 * the set is about.
 */
const countThatFit = (widths, available, gap, overflowWidth, cap) => {
    const limit = Math.min(widths.length, cap);
    // Sub-pixel widths round differently in layout and in measurement.
    const room = available + 0.5;
    const all = widths.slice(0, limit).reduce((sum, w, i) => sum + w + (i ? gap : 0), 0);
    if (limit === widths.length && all <= room) return { count: limit, squeeze: false };

    let used = 0;
    let count = 0;
    for (let i = 0; i < limit; i += 1) {
        const next = used + (i ? gap : 0) + widths[i];
        if (next + gap + overflowWidth > room) break;
        used = next;
        count = i + 1;
    }
    if (count === 0 && widths.length) return { count: 1, squeeze: true };
    return { count, squeeze: false };
};

export const TagGroup = ({
    children,
    label,
    overflow = 'wrap',
    alignment = 'left',
    disabled = false,
    maxVisible,
    overflowLabel,
    onOverflowClick,
    className = '',
    id,
    ...rest
}) => {
    const parent = useTagContext() || {};
    const isDisabled = Boolean(disabled || parent.isDisabled);
    const context = useMemo(() => ({ ...parent, isDisabled }), [parent, isDisabled]);

    // `null`/`false` children are ordinary in JSX (`{cond && <Tag/>}`), and
    // counting them would make `+n` claim tags that do not exist.
    const items = React.Children.toArray(children).filter(Boolean);

    const collapses = overflow === 'collapse';
    const cap = typeof maxVisible === 'number' && maxVisible >= 0 ? maxVisible : Infinity;

    const listRef = useRef(null);
    const [fit, setFit] = useState({ count: items.length, squeeze: false });
    // The first tag's width before it was squeezed. A squeezed tag measures
    // narrower than it is, and counting with that width would let more tags
    // in beside it, squeezing it further.
    const firstWidth = useRef(0);
    const [menuOpen, setMenuOpen] = useState(false);

    const shown = collapses ? Math.min(fit.count, items.length) : items.length;
    const squeezed = collapses && fit.squeeze;
    const hidden = items.length - shown;

    const measure = useCallback(() => {
        const list = listRef.current;
        if (!list || !collapses) return;
        const itemEls = Array.from(list.querySelectorAll(':scope > [data-tag-index]'));
        const moreEl = list.querySelector(':scope > [data-tag-more]');
        const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
        const widths = itemEls.map((el) => el.getBoundingClientRect().width);
        if (widths.length) {
            if (squeezed) widths[0] = Math.max(widths[0], firstWidth.current);
            else firstWidth.current = widths[0];
        }
        // Before `+n` exists its width is unknown and taken as 0; the render
        // that adds it measures again with the real width, and that pass can
        // only show fewer tags, so the two settle rather than flicker.
        const overflowWidth = moreEl ? moreEl.getBoundingClientRect().width : 0;
        const next = countThatFit(widths, list.clientWidth, gap, overflowWidth, cap);
        setFit((prev) => (prev.count === next.count && prev.squeeze === next.squeeze ? prev : next));
    }, [collapses, cap, squeezed]);

    // Every render: a new child, a new label or a new `+n` digit changes a width.
    useLayoutEffect(() => {
        measure();
    });

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list || !collapses || typeof ResizeObserver === 'undefined') return undefined;
        let frame = 0;
        // Measured on the next frame, so resizing never writes layout from
        // inside the observer's own callback.
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        });
        observer.observe(list);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [collapses, measure]);

    const overflowName = `${hidden} more tags`;
    const overflowText = overflowLabel ? overflowLabel(hidden) : `+${hidden}`;

    let more = null;
    if (collapses && hidden > 0) {
        more = onOverflowClick ? (
            <Tag
                variant="operational"
                color="grey"
                aria-label={overflowName}
                onClick={onOverflowClick}
                className="plus-tag-group__overflow"
            >
                {overflowText}
            </Tag>
        ) : (
            // The menu is the library's Dropdown: the hidden tags are its items,
            // so they are reached with Tab and chosen with Enter, and Escape
            // closes it with focus back on `+n`.
            <Dropdown
                className="plus-tag-group__menu"
                isOpen={menuOpen && !isDisabled}
                onToggle={(next) => setMenuOpen(next && !isDisabled)}
                items={items.slice(shown).map((child) => {
                    const props = child.props || {};
                    const isToggle = props.behavior === 'selectable' || props.variant === 'selectable';
                    return {
                        text: labelOf(child),
                        selected: isToggle ? Boolean(props.isSelected) : undefined,
                        onClick: isToggle ? props.onClick : undefined,
                    };
                })}
                toggle={(
                    <Tag
                        variant="operational"
                        color="grey"
                        aria-label={overflowName}
                        aria-expanded={menuOpen && !isDisabled}
                        className="plus-tag-group__overflow"
                    >
                        {overflowText}
                    </Tag>
                )}
            />
        );
    }

    return (
        <TagContext.Provider value={context}>
            <div
                ref={listRef}
                id={id}
                // A set of tags is a list, and saying so is what lets a screen
                // reader announce "5 items" instead of reading five unrelated
                // words. The items are wrapped rather than rendered as `<li>` so
                // that `Tag` stays usable on its own, outside any group.
                role="list"
                aria-label={label}
                // Read-only tags have no control to carry a disabled state, so
                // the group says it once for all of them.
                aria-disabled={isDisabled ? 'true' : undefined}
                className={[
                    'plus-tag-group',
                    `plus-tag-group--${collapses ? 'collapse' : 'wrap'}`,
                    alignment === 'right' ? 'plus-tag-group--right' : '',
                    className,
                ].filter(Boolean).join(' ')}
                {...rest}
            >
                {items.map((child, i) => (
                    <div
                        // A tag past the edge stays mounted, out of sight and out
                        // of the tab order, so it can still be measured.
                        role="listitem"
                        className={[
                            'plus-tag-group__item',
                            i >= shown ? 'plus-tag-group__item--hidden' : '',
                            i === 0 && squeezed ? 'plus-tag-group__item--squeezed' : '',
                        ]
                            .filter(Boolean).join(' ')}
                        data-tag-index={i}
                        // eslint-disable-next-line react/no-array-index-key
                        key={child.key ?? i}
                    >
                        {child}
                    </div>
                ))}
                {more && (
                    <div role="listitem" className="plus-tag-group__item" data-tag-more="">
                        {more}
                    </div>
                )}
            </div>
        </TagContext.Provider>
    );
};

TagGroup.propTypes = {
    /** The tags, and any Suggestions offered beside them. `null` and `false` are skipped rather than counted. */
    children: PropTypes.node,
    /** The group's accessible name — what this set of tags is. */
    label: PropTypes.string,
    /** `wrap` flows onto more lines; `collapse` keeps one line, shows as many tags as fit, and puts the rest behind `+n`. */
    overflow: PropTypes.oneOf(TAG_GROUP_OVERFLOWS),
    /** `right` lines the tags and the `+n` up on the right edge, for a right-aligned table column. */
    alignment: PropTypes.oneOf(TAG_GROUP_ALIGNMENTS),
    /** Disables every Tag and Suggestion in the group, as a disabled field does. */
    disabled: PropTypes.bool,
    /** `collapse` only: the most tags to show before `+n`, even when more would fit. By default, as many as fit. */
    maxVisible: PropTypes.number,
    /** Formats the overflow tag's visible label. Defaults to `+n`; its accessible name is always "n more tags". */
    overflowLabel: PropTypes.func,
    /** Replaces the `+n` menu — for opening a picker or a panel instead. */
    onOverflowClick: PropTypes.func,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default TagGroup;
