import React from 'react';
import PropTypes from 'prop-types';
import './FieldBox.scss';

/**
 * FieldBox — the one box behind every text-like input.
 *
 * It owns the height, the border, the fill and the state. A host (Text field,
 * Text area) decides only what goes in its three slots: `elemBefore` (an icon, an affix, an addon), the content (`children`,
 * normally the control itself) and `trailing` (an icon, a caret, steppers,
 * "saving…").
 *
 * Hover and focus are live states, drawn from the pointer and from
 * `:focus-within`, so a host never tracks them. `state` exists only to draw
 * them still, for documentation; the Figma set has them as variants.
 *
 * The chrome half of the field split (A7): label, caption and error live in
 * `FieldFrame` instead. It is a part: not exported from the barrel, never
 * placed on a screen alone.
 */
const FieldBox = ({
    spacing = 'default',
    subtle = false,
    disabled = false,
    readOnly = false,
    invalid = false,
    valid = false,
    warning = false,
    busy = false,
    multiline = false,
    grow = false,
    state,
    elemBefore,
    trailing,
    children,
    className = '',
    style,
    ...props
}) => {
    const classes = [
        'plus-field',
        `plus-field--${spacing}`,
        subtle && 'plus-field--subtle',
        disabled && 'plus-field--disabled',
        readOnly && !disabled && 'plus-field--readonly',
        invalid && 'plus-field--invalid',
        warning && !invalid && 'plus-field--warning',
        valid && !invalid && !warning && 'plus-field--valid',
        busy && 'plus-field--busy',
        multiline && 'plus-field--multiline',
        grow && !multiline && 'plus-field--grow',
        state && state !== 'default' && `plus-field--${state}`,
        className,
    ].filter(Boolean).join(' ');

    /*
     * A press on the box's own padding puts the caret in the control, so the
     * whole box behaves as the field it looks like. Presses on a slot's own
     * controls (a stepper, an addon button) are theirs and are left alone.
     */
    const handleMouseDown = (event) => {
        if (event.target !== event.currentTarget) return;
        const control = event.currentTarget.querySelector('input, textarea');
        if (!control || control.disabled) return;
        event.preventDefault();
        control.focus();
    };

    return (
        <div
            className={classes}
            style={style}
            data-spacing={spacing}
            /* Marks the whole box inactive, so its affixes and icons are read
             * as part of a disabled control and not as text on their own. */
            aria-disabled={disabled || undefined}
            onMouseDown={handleMouseDown}
            {...props}
        >
            {elemBefore && <span className="plus-field__leading">{elemBefore}</span>}
            <span className="plus-field__content">{children}</span>
            {trailing && <span className="plus-field__trailing">{trailing}</span>}
        </div>
    );
};

FieldBox.propTypes = {
    /** `default` draws 40 and `compact` draws 32. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Borderless at rest, for editing in place. Editing looks the same as the standard field. */
    subtle: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    invalid: PropTypes.bool,
    valid: PropTypes.bool,
    warning: PropTypes.bool,
    /** Something is happening in Trailing ("saving…"), so a subtle field keeps it on show. */
    busy: PropTypes.bool,
    /** The content is several lines (Textarea): slots align to the top, and the box starts at 80 and grows. */
    multiline: PropTypes.bool,
    /** The content wraps (tags in a Tag field): the box starts at its height and grows with each row. */
    grow: PropTypes.bool,
    /** Draws a live state still, for documentation. Live hover and focus need nothing. */
    state: PropTypes.oneOf(['default', 'hover', 'focus']),
    elemBefore: PropTypes.node,
    trailing: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default FieldBox;
