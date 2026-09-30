import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Tag, { TagContext, resolveTagBehavior, useTagContext } from '../Tag';
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
 * line, then a `+n` tag that opens a menu of the rest. It measures when the
 * children change and whenever the row or a tag is resized, so the count
 * follows the container rather than a number picked against today's labels.
 *
 * SUGGESTIONS ARE NEVER HIDDEN. A Suggestion is an offer, not a value, so it
 * is not counted into `+n` and never goes into its menu: it always sits at the
 * end of the row, after the tags and `+n`, and the fit reserves its width
 * before counting tags. In the menu, a hidden tag keeps its action: a
 * selectable tag toggles there, a link tag is a link there, and a read-only
 * tag is a plain item. Removing stays on the row.
 *
 * DISABLED IS THE FIELD'S. `disabled` reaches every Tag and Suggestion in the
 * group through `TagContext`, the same context a field uses, so no member can
 * disagree with the one beside it.
 */

export const TAG_GROUP_OVERFLOWS = ['wrap', 'collapse'];
export const TAG_GROUP_ALIGNMENTS = ['left', 'right'];

/*
 * The row's measured members, marked so measuring and observing read the same
 * sets: the tags, the Suggestions, and the widest `+n` copy.
 */
const TAG_ITEMS = ':scope > [data-tag-index]';
const SUGGESTION_ITEMS = ':scope > [data-tag-suggestion]';
const WIDEST_OVERFLOW = ':scope > [data-tag-widest]';

/** A tag's words, for its line in the `+n` menu. */
const labelOf = (child) => {
    const props = child.props || {};
    return props.children ?? props.text;
};

/**
 * A Suggestion, found by the marker Suggestion carries: on the component, or
 * on what a `memo` or `forwardRef` wraps. A wrapper of its own must copy the
 * marker (`Wrapper.isSuggestion = Suggestion.isSuggestion`).
 */
const isSuggestion = (child) => {
    const type = child?.type;
    return Boolean(type && (type.isSuggestion || type.type?.isSuggestion || type.render?.isSuggestion));
};

/**
 * A hidden tag's line in the `+n` menu, keeping the tag's action. A selectable
 * tag is a toggle item led by the Dropdown's multi-select checkbox; it shows
 * selected and keeps the menu open, so the change is seen where it was made.
 * A link tag is a link item to the same address, with a trailing arrow for
 * "goes somewhere". A tag still saving, whatever its behavior, is a disabled,
 * busy row that cannot be pressed. Anything else is a static row that only
 * says the words: nothing to press, nothing to focus, and remove is not
 * offered here, only on the row.
 */
const menuItemOf = (child) => {
    const props = child.props || {};
    const text = labelOf(child);
    const behavior = resolveTagBehavior(props);
    // Saving, whatever the behavior: the disabled row, busy, not actionable.
    if (props.isLoading) {
        return { text, disabled: true, isBusy: true };
    }
    switch (behavior) {
        case 'selectable':
            return {
                text,
                isToggle: true,
                selected: Boolean(props.isSelected),
                // The Dropdown's multi-select checkbox, as Figma draws the
                // row: decorative, since `aria-pressed` carries the state.
                multiSelectCheckbox: true,
                multiSelectChecked: Boolean(props.isSelected),
                keepOpen: true,
                onClick: props.onClick,
            };
        case 'link':
            return {
                text,
                href: props.href,
                linkComponent: props.linkComponent,
                trailingIcon: 'arrow-right',
                onClick: props.onClick,
            };
        case 'action':
            return { text, onClick: props.onClick };
        default:
            return { text, isStatic: true };
    }
};

/**
 * How many of `widths` fit in `available`, with `gap` between them and room
 * for the overflow tag when any are left out, and whether the first has to
 * shrink to fit at all. When the width alone stops the first tag, it still
 * shows, squeezed: a row of only `+n` hides every value behind a press, while
 * one tag that truncates still says what the set is about. The cap never
 * squeezes: a tag the cap leaves out is simply behind `+n`, so `maxVisible={0}`
 * shows `+n` alone.
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
    // Squeezed only when the width stopped the first tag, not the cap.
    if (count === 0 && limit > 0) return { count: 1, squeeze: true };
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
    const parent = useTagContext();
    const isDisabled = Boolean(disabled || parent.isDisabled);
    const context = useMemo(() => ({ ...parent, isDisabled }), [parent, isDisabled]);

    // `null`/`false` children are ordinary in JSX (`{cond && <Tag/>}`), and
    // counting them would make `+n` claim tags that do not exist.
    const members = React.Children.toArray(children).filter(Boolean);
    // Suggestions are split off: they are never counted, hidden or listed in
    // the menu, and they always come last.
    const items = members.filter((child) => !isSuggestion(child));
    const suggestions = members.filter(isSuggestion);

    const collapses = overflow === 'collapse';
    const cap = typeof maxVisible === 'number' && maxVisible >= 0 ? maxVisible : Infinity;

    const listRef = useRef(null);
    const [fit, setFit] = useState({ count: items.length, squeeze: false });
    const [menuOpen, setMenuOpen] = useState(false);

    const shown = collapses ? Math.min(fit.count, items.length) : items.length;
    const squeezed = collapses && fit.squeeze;
    const hidden = items.length - shown;

    const formatOverflowLabel = (n) => (overflowLabel ? overflowLabel(n) : `+${n}`);

    /*
     * Room for `+n` is measured once per digit count, on a hidden copy whose
     * label is the widest one that count can have: every digit an 8 (the
     * body face's figures are all one width, and in faces where they are not,
     * 8 is among the widest). Reserving that constant width, rather
     * than the width of whatever `+n` shows right now, makes the count a
     * function of the container and the tags alone, so one measurement
     * settles it: the count can never flip between two values as `+9`
     * becomes `+10` and back.
     */
    const digits = String(Math.max(items.length - 1, 1)).length;
    const widestLabel = formatOverflowLabel(Number('8'.repeat(digits)));

    // The children's keys, as one string: what the set is, without the
    // identity of a `children` array that every parent render makes anew.
    const itemKeys = members.map((child) => child.key).join('|');

    const measure = useCallback(() => {
        const list = listRef.current;
        if (!list || !collapses) return;
        const itemEls = Array.from(list.querySelectorAll(TAG_ITEMS));
        const ghost = list.querySelector(WIDEST_OVERFLOW);
        const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
        // The suggestions' room, each with the gap before it, comes off the
        // row before any tag is counted.
        const reserved = Array.from(list.querySelectorAll(SUGGESTION_ITEMS))
            .reduce((sum, el) => sum + gap + el.getBoundingClientRect().width, 0);

        /*
         * Every width is the tag's own, never a squeezed one: a squeezed first
         * tag measures narrower than it is, and counting with that width would
         * let more tags in beside it, squeezing it further. Its shrink is
         * switched off for the reading and back on straight after, inside one
         * task and before any paint, so nothing flashes, including when the
         * first tag is replaced while squeezed.
         */
        const first = itemEls[0];
        const shrink = first ? first.style.flexShrink : '';
        if (first) first.style.flexShrink = '0';
        const widths = itemEls.map((el) => el.getBoundingClientRect().width);
        if (first) first.style.flexShrink = shrink;

        const overflowWidth = ghost ? ghost.getBoundingClientRect().width : 0;
        const next = countThatFit(widths, list.clientWidth - reserved, gap, overflowWidth, cap);
        setFit((prev) => (prev.count === next.count && prev.squeeze === next.squeeze ? prev : next));
    }, [collapses, cap]);

    /*
     * Measured when something that sets a width changes: which tags there are,
     * the overflow mode or the cap here, and a resize of the row, a tag or the
     * `+n` copy below (a label that changes, a font that loads). A parent that
     * re-renders the same tags, opening the menu, or any other render of this
     * group measures nothing and keeps the same observer.
     */
    useLayoutEffect(() => {
        measure();
    }, [measure, itemKeys, widestLabel]);

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
        list.querySelectorAll(`${TAG_ITEMS}, ${SUGGESTION_ITEMS}, ${WIDEST_OVERFLOW}`)
            .forEach((el) => observer.observe(el));
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [collapses, measure, itemKeys, widestLabel]);

    const menuIsOpen = menuOpen && !isDisabled;

    /*
     * The `+n` is the Figma set's: a grey selectable tag with no swatch (the
     * swatch is hidden in TagGroup.scss). It opens something rather than
     * toggling, so it reports `aria-expanded`, which is also what keeps Tag
     * from announcing it as a toggle.
     */
    const overflowTag = (label, extra) => (
        <Tag
            behavior="selectable"
            color="grey"
            className="plus-tag-group__overflow"
            {...extra}
        >
            {label}
        </Tag>
    );

    let overflowItem = null;
    if (collapses && hidden > 0) {
        const visible = formatOverflowLabel(hidden);
        const count = `${hidden} more ${hidden === 1 ? 'tag' : 'tags'}`;
        const tag = overflowTag(visible, {
            // The name starts with the visible label (WCAG 2.5.3), so saying
            // what is on screen presses it: "+3 more tags". A custom label
            // leads, then the count in words: "3 more, 3 more tags".
            'aria-label': overflowLabel ? `${visible}, ${count}` : `+${count}`,
            // With `onOverflowClick` the caller opens its own picker, which
            // holds its own state, so `+n` stays collapsed.
            'aria-expanded': onOverflowClick ? false : menuIsOpen,
            onClick: onOverflowClick,
        });
        overflowItem = onOverflowClick ? tag : (
            // The menu is the library's Dropdown: the hidden tags are its items,
            // so they are reached with Tab and chosen with Enter, and Escape
            // closes it with focus back on `+n`.
            <Dropdown
                className="plus-tag-group__menu"
                isOpen={menuIsOpen}
                onToggle={(next) => setMenuOpen(next && !isDisabled)}
                items={items.slice(shown).map(menuItemOf)}
                toggle={tag}
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
                        // `Children.toArray` gives every child a key.
                        key={child.key}
                    >
                        {child}
                    </div>
                ))}
                {overflowItem && (
                    <div role="listitem" className="plus-tag-group__item">
                        {overflowItem}
                    </div>
                )}
                {suggestions.map((child) => (
                    // After `+n`, always shown, and never squeezed.
                    <div role="listitem" className="plus-tag-group__item" data-tag-suggestion="" key={child.key}>
                        {child}
                    </div>
                ))}
                {collapses && items.length > 1 && (
                    // The widest `+n` this set can show, measured so its width
                    // can be reserved (see above). It is not a list item, and
                    // it is hidden from sight and from assistive technology.
                    <div className="plus-tag-group__item plus-tag-group__item--hidden" data-tag-widest="" aria-hidden="true">
                        {overflowTag(widestLabel, { tabIndex: -1, 'aria-expanded': false })}
                    </div>
                )}
            </div>
        </TagContext.Provider>
    );
};

TagGroup.propTypes = {
    /** The tags, and any Suggestions offered beside them. Suggestions always sit at the end, after `+n`, and are never counted or hidden; they must be direct children, or components that carry Suggestion's `isSuggestion` marker. `null` and `false` are skipped rather than counted. */
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
    /** Formats the overflow tag's visible label. Defaults to `+n`; its accessible name starts with that label: "+3 more tags" ("+1 more tag"), or "<label>, 3 more tags" for a custom one. */
    overflowLabel: PropTypes.func,
    /** Replaces the `+n` menu — for opening a picker or a panel instead. */
    onOverflowClick: PropTypes.func,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default TagGroup;
