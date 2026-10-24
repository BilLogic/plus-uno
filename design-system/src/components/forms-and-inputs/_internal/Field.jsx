import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../../overlays-and-layering/Tooltip/Tooltip';
import './Field.scss';

/**
 * _Field — the one box behind every text-like input.
 *
 * It owns the size, the border, the fill and the state. A host (Input,
 * Textarea, NumberInput, InputGroup) decides only what goes in its three
 * slots: `leading` (an icon, an affix, an addon), the content (`children`,
 * normally the control itself) and `trailing` (an icon, a caret, steppers,
 * "saving…").
 *
 * Hover and focus are live states, drawn from the pointer and from
 * `:focus-within`, so a host never tracks them. `state` exists only to draw
 * them still, for documentation; the Figma set has them as variants.
 *
 * It is a part: not exported from the barrel, never placed on a screen alone.
 * The Figma counterpart is `_Field` on the Input page.
 */
const Field = ({
    size = 'medium',
    subtle = false,
    disabled = false,
    readOnly = false,
    invalid = false,
    valid = false,
    busy = false,
    multiline = false,
    grow = false,
    state,
    leading,
    trailing,
    children,
    className = '',
    style,
    ...props
}) => {
    const classes = [
        'plus-field',
        `plus-field--${size}`,
        subtle && 'plus-field--subtle',
        disabled && 'plus-field--disabled',
        readOnly && !disabled && 'plus-field--readonly',
        invalid && 'plus-field--invalid',
        valid && !invalid && 'plus-field--valid',
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
            data-size={size}
            /* Marks the whole box inactive, so its affixes and icons are read
             * as part of a disabled control and not as text on their own. */
            aria-disabled={disabled || undefined}
            onMouseDown={handleMouseDown}
            {...props}
        >
            {leading && <span className="plus-field__leading">{leading}</span>}
            <span className="plus-field__content">{children}</span>
            {trailing && <span className="plus-field__trailing">{trailing}</span>}
        </div>
    );
};

Field.propTypes = {
    /**
     * `medium` draws 32 and is the default. `small` and `large` are
     * deprecated: they draw like `medium`, and the host warns in development.
     */
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    /** Borderless at rest, for editing in place. Editing looks the same as the standard field. */
    subtle: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    invalid: PropTypes.bool,
    valid: PropTypes.bool,
    /** Something is happening in Trailing ("saving…"), so a subtle field keeps it on show. */
    busy: PropTypes.bool,
    /** The content is several lines (Textarea): slots align to the top, and the box starts at 80 and grows. */
    multiline: PropTypes.bool,
    /** The content wraps (tags in a Tag field): the box starts at 32 and grows with each row. */
    grow: PropTypes.bool,
    /** Draws a live state still, for documentation. Live hover and focus need nothing. */
    state: PropTypes.oneOf(['default', 'hover', 'focus']),
    leading: PropTypes.node,
    trailing: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
};

/**
 * What a caption tone means for the box and the control. One place, so every
 * host maps it the same way: an error marks both, a confirmation marks only
 * the box, and help leaves the field plain.
 *
 * @param {'help'|'invalid'|'success'} [tone]
 * @returns {{ field: { invalid: boolean, valid: boolean }, control: { 'aria-invalid'?: true } }}
 */
export function toneProps(tone) {
    return {
        field: { invalid: tone === 'invalid', valid: tone === 'success' },
        control: { 'aria-invalid': tone === 'invalid' || undefined },
    };
}

/**
 * The ids a field's control points at, and the `aria-describedby` that names
 * them. One place, so every host describes itself the same way.
 *
 * A caller's own `aria-describedby` is kept and ours appended, so pointing at
 * your own help text does not silently lose the error, and the error does not
 * silently lose your help text.
 *
 * @param {object} options
 * @param {string} options.fieldId the control's id
 * @param {string} [options.message] the caption text (an error, a confirmation or help)
 * @param {boolean} [options.counted] whether a character count is shown
 * @param {string} [options.describedBy] the caller's own `aria-describedby`
 * @returns {{ messageId?: string, countId?: string, describedBy?: string }}
 */
export function fieldDescription({ fieldId, message, counted = false, describedBy }) {
    const messageId = message ? `${fieldId}-message` : undefined;
    const countId = counted ? `${fieldId}-count` : undefined;
    const joined = [describedBy, messageId, countId].filter(Boolean).join(' ') || undefined;
    return { messageId, countId, describedBy: joined };
}

/**
 * The label row above a field: the label, the required asterisk and an
 * optional info tooltip.
 *
 * The asterisk is decoration; the control carries `aria-required`, and the
 * form explains the asterisk once in a legend. The info button sits outside
 * the `<label>` so its name never becomes part of the field's name.
 */
export const FieldLabel = ({
    htmlFor,
    children,
    required = false,
    info,
    hidden = false,
    name,
    className = '',
}) => {
    if (!children) return null;
    const label = (
        <label htmlFor={htmlFor} className={`plus-field-label${hidden ? ' plus-field-label--hidden' : ''} ${className}`.trim()}>
            {children}
            {required && <span className="plus-field-required" aria-hidden="true">*</span>}
        </label>
    );
    if (!info || hidden) return label;
    return (
        <div className="plus-field-label-row">
            {label}
            <Tooltip text={info} placement="top" size="small">
                <button
                    type="button"
                    className="plus-field-info"
                    aria-label={`About ${name ?? (typeof children === 'string' ? children : 'this field')}`}
                >
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                </button>
            </Tooltip>
        </div>
    );
};

FieldLabel.propTypes = {
    htmlFor: PropTypes.string,
    children: PropTypes.node,
    required: PropTypes.bool,
    /** Text for the info tooltip beside the label. */
    info: PropTypes.node,
    /** Clips the label out of sight. It is still rendered and still names the field. */
    hidden: PropTypes.bool,
    /** The field's name for the info button, when `children` is not plain text. */
    name: PropTypes.string,
    className: PropTypes.string,
};

const CAPTION_ICON = {
    invalid: 'fa-solid fa-triangle-exclamation',
    success: 'fa-solid fa-circle-check',
};

/**
 * The caption under a field: a message on the left and a character count on
 * the right, together, so neither replaces the other.
 *
 * An error renders with `role="alert"`, so it is announced when it appears.
 * A confirmation and standing help are only described.
 */
export const FieldCaption = ({
    messageId,
    message,
    tone = 'help',
    countId,
    count,
    maxLength,
}) => {
    const counted = countId && maxLength !== undefined;
    if (!message && !counted) return null;
    const over = counted && count > maxLength;
    return (
        <div className="plus-field-caption">
            {message ? (
                <div
                    id={messageId}
                    className={`plus-field-caption__message plus-field-caption__message--${tone}`}
                    role={tone === 'invalid' ? 'alert' : undefined}
                >
                    {CAPTION_ICON[tone] && <i className={CAPTION_ICON[tone]} aria-hidden="true" />}
                    <span>{message}</span>
                </div>
            ) : <span />}
            {counted && (
                <div
                    id={countId}
                    className={`plus-field-caption__count${over ? ' plus-field-caption__count--over' : ''}`}
                >
                    {count} / {maxLength}
                </div>
            )}
        </div>
    );
};

FieldCaption.propTypes = {
    messageId: PropTypes.string,
    message: PropTypes.node,
    /** `invalid` is announced; `success` and `help` are described. */
    tone: PropTypes.oneOf(['help', 'invalid', 'success']),
    countId: PropTypes.string,
    count: PropTypes.number,
    maxLength: PropTypes.number,
};

/**
 * Label, field and caption stacked, with one disabled fade: the box fades
 * itself, and the stack fades only the label and caption around it.
 */
export const FieldStack = ({ disabled = false, className = '', style, children }) => (
    <div className={`plus-field-stack${disabled ? ' plus-field-stack--disabled' : ''} ${className}`.trim()} style={style}>
        {children}
    </div>
);

FieldStack.propTypes = {
    disabled: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

export default Field;
