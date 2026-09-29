import React from 'react';
import PropTypes from 'prop-types';
import './Suggestion.scss';

/**
 * `Suggestion` — a value the system proposes that a person can accept, such as
 * an AI-suggested focus area.
 *
 * A BUTTON, NOT A LABEL. It has the same height, padding and radius as Tag so
 * it sits in the tag row where the value will land, and a dashed border and
 * discovery-purple words so it never reads as a value already chosen.
 *
 * TWO TYPES. `insert` (the default) proposes a value for the field: accepted,
 * the field turns it into a Tag, and `onAccept` hands back `value`. `prompt`
 * proposes words to send or to fill a text box: `onAccept` hands back `text`.
 * The component does not change itself when accepted; the field that owns the
 * value decides what appears next.
 */

export const SUGGESTION_TYPES = ['insert', 'prompt'];

/** The glyph says which kind of proposal it is; the name says what it does. */
const ICONS = {
    insert: 'fa-plus',
    prompt: 'fa-wand-magic-sparkles',
};

export const Suggestion = ({
    label,
    type = 'insert',
    value,
    text,
    onAccept,
    onClick,
    className = '',
    id,
    ...rest
}) => {
    const isPrompt = type === 'prompt';
    // Anything but `prompt` is an insert, so an unknown type still renders one.
    const kind = isPrompt ? 'prompt' : 'insert';

    // Pressing an insert adds a value, so its name says "Add". A prompt is not
    // added to anything; it sends or fills its words, so it is named by them.
    const name = kind === 'prompt' ? `${label}, suggested` : `Add ${label}, suggested`;

    const classes = [
        'plus-suggestion',
        `plus-suggestion--${kind}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            {...rest}
            type="button"
            id={id}
            className={classes}
            // The name and the press are the component's own: they come after
            // the spread, so a stray `aria-label` or `onClick` cannot replace
            // them. A caller's `onClick` still fires, before `onAccept`.
            aria-label={name}
            onClick={(e) => {
                onClick?.(e);
                onAccept?.(isPrompt ? (text ?? label) : (value ?? label), e);
            }}
        >
            <i className={`fa-solid ${ICONS[kind]} plus-suggestion__icon`} aria-hidden="true" />
            <span className="plus-suggestion__label body3-txt">{label}</span>
        </button>
    );
};

Suggestion.propTypes = {
    /** The proposed value's words. The accessible name is built from it. */
    label: PropTypes.string.isRequired,
    /** `insert` adds a value to the field; `prompt` sends or fills text. */
    type: PropTypes.oneOf(SUGGESTION_TYPES),
    /** `insert` only: what `onAccept` receives. Defaults to `label`. */
    value: PropTypes.any,
    /** `prompt` only: the text `onAccept` receives. Defaults to `label`. */
    text: PropTypes.string,
    /** Called with the value (insert) or the text (prompt), then the click event. */
    onAccept: PropTypes.func,
    /** Fires on press, before `onAccept`. It never replaces `onAccept`. */
    onClick: PropTypes.func,
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Suggestion;
