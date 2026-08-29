import React from 'react';
import PropTypes from 'prop-types';
import './Tag.scss';

/**
 * A value someone picked (#276).
 *
 * The rule that decides between this and `Badge`, taken verbatim from Fluent 2:
 *
 *   "A tag is a representation of a value that someone has picked… To show
 *    system-generated data that people can't change, use a badge instead."
 *
 * WHO AUTHORED THE VALUE is the test, not whether the control is clickable.
 * That is what survives the edge case which breaks "static vs interactive": a
 * `read-only` tag is still a tag, because it continues the visual pattern that
 * the selection is changeable once the surface becomes editable.
 */

/**
 * Plain colour names, deliberately.
 *
 * A tag's colour is a category, not a status — so the API must not offer
 * `success` or `danger`, or a reader will take a green tag to mean something
 * went well. The repo has no plain-name colour tokens, so each name maps onto a
 * container pair that already exists; the curriculum palette is the only
 * non-semantic set in the system, which is the same reason #276 gives for
 * letting `discovery` borrow its purple.
 *
 * The mapping is in `Tag.scss`. Adding a colour means adding it in both places,
 * and `Tag.stories.jsx` renders every one, so a name with no rule shows up as an
 * unstyled tag rather than as nothing.
 */
export const TAG_COLORS = ['grey', 'blue', 'green', 'purple', 'magenta', 'orange', 'teal'];

export const TAG_VARIANTS = ['read-only', 'dismissible', 'selectable', 'operational'];

export const Tag = ({
    text,
    children,
    variant = 'read-only',
    color = 'grey',
    elemBefore,
    swatchBefore,
    maxWidth,
    href,
    linkComponent,
    isSelected = false,
    isLoading = false,
    onClick,
    onRemove,
    removeLabel,
    className = '',
    id,
    ...rest
}) => {
    const label = children ?? text;

    // `onRemove` is gated to `dismissible`, and the gate is here rather than in
    // propTypes because propTypes validates a value's type, not whether the
    // combination means anything. Passing it to a read-only tag has to render no
    // remove button at all — a tag that can be removed IS a dismissible tag, and
    // silently growing an X would make the variant a lie.
    const isDismissible = variant === 'dismissible';
    const canRemove = isDismissible && typeof onRemove === 'function' && !isLoading;

    // Selectable and operational tags are the tag itself being the control.
    // Dismissible tags are NOT: their control is the X inside them, and putting a
    // button inside a button is invalid per ARIA — the same rule `Badge` already
    // records for its own dismiss button.
    const isControl = (variant === 'selectable' || variant === 'operational') && !isLoading;
    const isLink = Boolean(href) && !isControl;

    const classes = [
        'plus-tag',
        'body2-txt',
        `plus-tag--${color}`,
        `plus-tag--${variant}`,
        isSelected && variant === 'selectable' ? 'plus-tag--selected' : '',
        isLoading ? 'plus-tag--loading' : '',
        maxWidth ? 'plus-tag--truncated' : '',
        className,
    ].filter(Boolean).join(' ');

    // A truncated label is unreadable without its full text somewhere, and
    // `title` is the only place a mouse and a screen reader both reach.
    const truncationTitle = maxWidth && typeof label === 'string' ? label : undefined;

    const body = (
        <>
            {swatchBefore && (
                <span
                    className="plus-tag__swatch"
                    style={{ backgroundColor: swatchBefore }}
                    // Decorative: the swatch repeats what the tag's text says, and
                    // a legend entry announcing "square" helps nobody.
                    aria-hidden="true"
                />
            )}
            {elemBefore && <span className="plus-tag__elem-before">{elemBefore}</span>}
            <span className="plus-tag__text" title={truncationTitle}>{label}</span>
            {isLoading && (
                <span className="plus-tag__spinner" role="status" aria-label="Loading" />
            )}
        </>
    );

    const style = maxWidth ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : undefined;
    const shared = { id, className: classes, style, ...rest };

    if (isControl) {
        return (
            <button
                type="button"
                {...shared}
                onClick={onClick}
                // `aria-pressed` is what makes a selectable tag a toggle rather
                // than a button that happens to look different afterwards. An
                // operational tag performs an action and has no pressed state.
                aria-pressed={variant === 'selectable' ? isSelected : undefined}
            >
                {body}
            </button>
        );
    }

    if (isLink) {
        const Link = linkComponent || 'a';
        return (
            <Link {...shared} href={href} onClick={onClick}>
                {body}
            </Link>
        );
    }

    return (
        <span {...shared}>
            {body}
            {canRemove && (
                <button
                    type="button"
                    className="plus-tag__remove"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(e);
                    }}
                    // Named for what it removes. A row of tags all labelled
                    // "Dismiss" gives a screen-reader user a list of identical
                    // buttons and no way to tell which one drops which value.
                    aria-label={removeLabel || (typeof label === 'string' ? `Remove ${label}` : 'Remove')}
                >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
            )}
        </span>
    );
};

Tag.propTypes = {
    /** The label (alternative to children). */
    text: PropTypes.string,
    /** The label (takes precedence over `text`). */
    children: PropTypes.node,
    /** What kind of tag this is. `read-only` is still a tag — see the note above. */
    variant: PropTypes.oneOf(TAG_VARIANTS),
    /** A category colour. Plain names only: a tag's colour is never a status. */
    color: PropTypes.oneOf(TAG_COLORS),
    /** Leading content — an avatar for a person, a logo for an app. */
    elemBefore: PropTypes.node,
    /** A colour square, for a tag acting as a chart legend entry. Any CSS colour. */
    swatchBefore: PropTypes.string,
    /** Caps the tag and truncates the label, which then carries its full text in `title`. */
    maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Navigates. Ignored on `selectable` and `operational`, which are already controls. */
    href: PropTypes.string,
    /** Router link to render instead of `<a>` when `href` is set. */
    linkComponent: PropTypes.elementType,
    /** `selectable` only: the toggle's state, published as `aria-pressed`. */
    isSelected: PropTypes.bool,
    /** Shows a spinner and stands the tag down as a control. */
    isLoading: PropTypes.bool,
    /** Fires on `selectable`, `operational`, and a link. */
    onClick: PropTypes.func,
    /** `dismissible` only. On any other variant no remove button renders. */
    onRemove: PropTypes.func,
    /** Overrides the remove button's accessible name. Defaults to `Remove <label>`. */
    removeLabel: PropTypes.string,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Tag;
