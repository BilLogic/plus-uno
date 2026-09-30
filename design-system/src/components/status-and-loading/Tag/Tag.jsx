import React, { createContext, useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Count from '../Count';
import Tooltip from '../../overlays/Tooltip';
import { useIsTruncated } from '../../../lib/useIsTruncated';
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
 * FOUR TYPES. A plain tag leads with the swatch. A person, an agent or a team
 * leads with a 16 avatar in its place, shaped so the three never read as one
 * another: a person is round (and so is the whole tag, and its ×), an agent is
 * a hexagon, a team is a square with radius-2 corners. The tag stays 22 tall and pads
 * 4 on the avatar side, as a plain tag does on its swatch side.
 *
 * ON AN IMAGE. `isElevated` lifts a read-only or link tag onto a photo or a
 * video: a solid surface fill, no border, the Elevation 2 shadow, neutral text,
 * and the hue still on the swatch, so it reads on any picture. A person, agent
 * or team tag takes the same ground and keeps its avatar's fill. In a disabled
 * field the ground and shadow stay and only the content turns Secondary
 * (Text). Focus, on the tag or on a link's ×, has a surface gap inside the
 * ring. Editing happens off the image, so a removable or selectable tag
 * ignores it.
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

/*
 * A literal array, because the docs generator and check:doc-identifiers read
 * the values from source. `TAG_BEHAVIOR` names the same values for code that
 * compares against them, so a renamed behavior fails loudly instead of
 * falling through.
 */
export const TAG_BEHAVIORS = ['read-only', 'removable', 'selectable', 'link'];

export const TAG_BEHAVIOR = Object.freeze({
    READ_ONLY: 'read-only',
    REMOVABLE: 'removable',
    SELECTABLE: 'selectable',
    LINK: 'link',
    // What the deprecated `operational` variant resolves to; not a public behavior.
    ACTION: 'action',
});

/** The types that lead with a 16 avatar: a person, an agent or a team. */
export const AVATAR_TAG_TYPES = ['person', 'agent', 'team'];

/** What the tag names: a plain category, or one of the avatar types. */
export const TAG_TYPES = ['plain', ...AVATAR_TAG_TYPES];

/** The old `variant` values, still accepted as a deprecated alias for `behavior`. */
export const TAG_VARIANTS = ['read-only', 'dismissible', 'selectable', 'operational'];

/** Deprecated names, still accepted, and what each one now means. */
const DEPRECATED_COLORS = { orange: 'yellow' };

/** Every name `color` accepts: the seven, then the deprecated aliases. */
const ACCEPTED_COLORS = ['grey', 'blue', 'green', 'purple', 'magenta', 'yellow', 'teal', 'orange'];

/*
 * `operational` has no place in the new set: a tag that performs an action
 * once is a button that looks like a tag. It keeps working as a plain button
 * with no pressed state, and warns. A button with a tag's look that opens
 * something is a selectable tag given `aria-expanded`, as TagGroup's `+n` is.
 */
const DEPRECATED_VARIANTS = {
    'read-only': TAG_BEHAVIOR.READ_ONLY,
    dismissible: TAG_BEHAVIOR.REMOVABLE,
    selectable: TAG_BEHAVIOR.SELECTABLE,
    operational: TAG_BEHAVIOR.ACTION,
};

/**
 * What a tag does, from its props: `behavior` wins; `variant` is the old name
 * for it; with neither, an `href` still makes a link, as it did before
 * `behavior` existed. Exported so TagGroup's `+n` menu gives a hidden tag the
 * same action the tag itself has. It never warns; Tag does that.
 */
export const resolveTagBehavior = ({ behavior, variant, href } = {}) => {
    if (behavior) return behavior;
    if (variant) return DEPRECATED_VARIANTS[variant];
    return href ? TAG_BEHAVIOR.LINK : TAG_BEHAVIOR.READ_ONLY;
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

/**
 * What stands in for a missing avatar. A person gets the first letters of the
 * first and last words ("Rosa Chen" is RC); an agent or a team gets one letter,
 * since a team name's second word is usually "team".
 */
const initialsOf = (label, type) => {
    if (typeof label !== 'string') return '';
    const words = label.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    // Whole characters, not UTF-16 halves, so an emoji is never split.
    const firstChar = (word) => Array.from(word)[0];
    const first = firstChar(words[0]);
    const last = type === 'person' && words.length > 1 ? firstChar(words[words.length - 1]) : '';
    // Capped after upper-casing, since one letter can become two (ß is SS).
    return Array.from(`${first}${last}`.toUpperCase()).slice(0, 2).join('');
};

/*
 * The spinner in an avatar's box, drawn as Figma draws it: a 12 ring, 1.8
 * thick, three quarters of the way round. It is an SVG stroke rather than a
 * border because a browser rounds a 1.8 border down to whole device pixels.
 * The radius is the stroke's centerline (6 less half the 1.8), and the arc is
 * three quarters of its circumference.
 */
const SPINNER_RADIUS = 5.1;
const SPINNER_CIRCUMFERENCE = 2 * Math.PI * SPINNER_RADIUS;
const SPINNER_DASHARRAY = `${(SPINNER_CIRCUMFERENCE * 3) / 4} ${SPINNER_CIRCUMFERENCE}`;

const AvatarSpinner = () => (
    <svg className="plus-tag__avatar-spinner" viewBox="0 0 12 12" focusable="false">
        <circle cx="6" cy="6" r={SPINNER_RADIUS} fill="none" strokeWidth="1.8" strokeDasharray={SPINNER_DASHARRAY} />
    </svg>
);

/**
 * The 16 avatar of a person, agent or team tag. An image source renders as an
 * image, any other node as itself, and a missing or broken source as initials.
 * While saving, the box holds the spinner instead. The box is the same size in
 * every case, so a photo that fails to load never moves the tag. Decorative:
 * the tag's words already name who it is.
 *
 * The avatar stays mounted through a save, so a source that failed before the
 * save is still known to have failed after it: the tag goes back to initials
 * rather than retrying the image.
 */
const TagAvatar = ({ type, avatar, label, isLoading }) => {
    // The source that failed, not a flag: a new source is a fresh chance to
    // load without an effect to reset anything.
    const [failedSrc, setFailedSrc] = useState(null);
    const failed = failedSrc === avatar;

    let content;
    if (isLoading) {
        content = <AvatarSpinner />;
    } else if (typeof avatar === 'string' && avatar && !failed) {
        content = <img className="plus-tag__avatar-img" src={avatar} alt="" onError={() => setFailedSrc(avatar)} />;
    } else if (avatar && typeof avatar !== 'string') {
        content = avatar;
    } else {
        content = <span className="plus-tag__initials">{initialsOf(label, type)}</span>;
    }

    // Saving drops the shape modifier: the box is clear and holds only the
    // spinner, so there is no shape to draw.
    return (
        <span
            className={`plus-tag__avatar ${isLoading ? 'plus-tag__avatar--saving' : `plus-tag__avatar--${type}`}`}
            aria-hidden="true"
        >
            {content}
        </span>
    );
};

export const Tag = ({
    text,
    children,
    behavior,
    variant,
    color = 'grey',
    type = 'plain',
    avatar,
    count,
    elemBefore,
    swatchBefore,
    maxWidth = 180,
    href,
    linkComponent,
    isSelected = false,
    isLoading = false,
    isElevated = false,
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
    // Only a clipped label gets a tooltip: with a 180 cap on every tag, a
    // tooltip on every tag would repeat what most of them already show.
    const truncated = useIsTruncated(labelRef, [label, maxWidth]);

    let resolvedColor = color;
    if (DEPRECATED_COLORS[resolvedColor]) {
        warn(`[Tag] color="${resolvedColor}" is deprecated; use "${DEPRECATED_COLORS[resolvedColor]}".`);
        resolvedColor = DEPRECATED_COLORS[resolvedColor];
    }

    if (!behavior && variant) {
        if (variant === 'operational') {
            warn('[Tag] variant="operational" is deprecated; use behavior="selectable" with `aria-expanded`.');
        } else {
            warn(`[Tag] variant="${variant}" is deprecated; use behavior="${DEPRECATED_VARIANTS[variant]}".`);
        }
    }
    const resolved = resolveTagBehavior({ behavior, variant, href });

    const hasAvatar = AVATAR_TAG_TYPES.includes(type);
    if (!hasAvatar && avatar) {
        warn('[Tag] `avatar` is only shown on type="person", "agent" or "team"; a plain tag leads with its swatch.');
    }
    if (hasAvatar && elemBefore) {
        warn(`[Tag] \`elemBefore\` is ignored on type="${type}"; an avatar type leads with its avatar.`);
    }
    if (hasAvatar && swatchBefore) {
        warn(`[Tag] \`swatchBefore\` is ignored on type="${type}"; an avatar type leads with its avatar.`);
    }
    // Initials come from the words, so a label that is not text leaves the
    // avatar blank.
    if (hasAvatar && !avatar && typeof label !== 'string') {
        warn(`[Tag] the label is not text, so a type="${type}" tag has no initials to fall back on. Pass \`avatar\`.`);
    }

    const isSelectable = resolved === TAG_BEHAVIOR.SELECTABLE;
    const isAction = resolved === TAG_BEHAVIOR.ACTION;
    const isLink = resolved === TAG_BEHAVIOR.LINK;

    // A count is a filter's result count, so it belongs to selectable only. On
    // a removable tag it would crowd the ×; elsewhere it would read as a Count
    // sitting beside a tag rather than part of it.
    if (count !== undefined && count !== null && !isSelectable) {
        warn(`[Tag] \`count\` is only shown on behavior="selectable"; it is ignored on "${resolved}".`);
    }
    const showCount = isSelectable && count !== undefined && count !== null;

    // Elevated is for a tag sitting on a picture, which is only ever read or
    // followed: a value is edited off the image, where the outline reads.
    const canElevate = resolved === 'read-only' || isLink;
    if (isElevated && !canElevate) {
        warn(`[Tag] \`isElevated\` is only for behavior="read-only" or "link"; it is ignored on "${resolved}".`);
    }

    // The × renders for removable, and for a link with `onRemove`. Never in a
    // disabled field: a value you cannot change has nothing to remove.
    const hasRemove = (resolved === TAG_BEHAVIOR.REMOVABLE || isLink)
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
        hasAvatar ? `plus-tag--${type}` : '',
        isDisabled ? 'plus-tag--disabled' : `plus-tag--${resolved}`,
        isSelectable && isSelected ? 'plus-tag--selected' : '',
        isLoading ? 'plus-tag--loading' : '',
        isElevated && canElevate ? 'plus-tag--elevated' : '',
        className,
    ].filter(Boolean).join(' ');

    // The cap is a custom property so the stylesheet can still clamp it to a
    // narrow container: `min(cap, 100%)`.
    const style = maxWidth
        ? { '--plus-tag-max': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth, ...styleProp }
        : styleProp;

    // Saving swaps the swatch or avatar for a spinner in the same box, so the
    // tag keeps its width. The overflow `+n` is a count of hidden tags, not a
    // category, so it carries no swatch.
    let lead = null;
    if (hasAvatar) {
        lead = <TagAvatar type={type} avatar={avatar} label={label} isLoading={isLoading} />;
    } else if (isLoading) {
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

    /*
     * A selectable tag is a toggle, so it publishes `aria-pressed`, unless the
     * caller passes `aria-expanded`: then it is a button that opens something
     * (TagGroup's `+n`), and "not pressed" would be the wrong thing to say.
     */
    const pressed = isSelectable && rest['aria-expanded'] === undefined ? isSelected : undefined;

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
                        aria-pressed={pressed}
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
                {/*
                  * A span has no disabled state a screen reader announces
                  * (ARIA 1.2 does not support aria-disabled on a generic element), so a
                  * disabled tag that is not a button says it in words: its
                  * text is read as "Science, disabled".
                  */}
                {isDisabled && <span className="visually-hidden">, disabled</span>}
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
    /** Deprecated: use `behavior`. `dismissible` is `removable`. `operational` still renders a plain button but warns: use `behavior="selectable"` with `aria-expanded`. */
    variant: PropTypes.oneOf(TAG_VARIANTS),
    /** A category color, on the border and swatch. Never a status. `orange` is a deprecated alias for `yellow`. On an avatar type the border is neutral and the color fills the avatar; grey agents fill AI purple and grey teams a Technology Tools 08 wash. */
    color: PropTypes.oneOf(ACCEPTED_COLORS),
    /** What the tag names. `plain` leads with the swatch; `person` (round), `agent` (hexagon) and `team` (square) lead with a 16 avatar. */
    type: PropTypes.oneOf(TAG_TYPES),
    /** The avatar of a person, agent or team tag: an image source, or a node. Missing or broken, it falls back to initials. Decorative. */
    avatar: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** `selectable` only: a small neutral Count, such as a filter's result count. Ignored with a warning elsewhere. */
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Leading content in place of the swatch, such as an icon. Plain tags only: an avatar type leads with its avatar. */
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
    /** Saving: a spinner replaces the swatch or avatar and the tag ignores presses until it is done. */
    isLoading: PropTypes.bool,
    /** For a tag on an image or video: a solid surface fill, no border and the Elevation 2 shadow, with the hue kept on the swatch or the avatar's own fill. Disabled keeps the ground and shadow and turns the content Secondary (Text). Focus on the tag or a link's × has a surface gap inside the ring. `read-only` and `link` only, on every type; ignored with a warning on `removable` and `selectable`. */
    isElevated: PropTypes.bool,
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
