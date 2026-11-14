import React from 'react';
import PropTypes from 'prop-types';
import { Field } from '@base-ui/react/field';
import { PresenceSlot } from '@/lib/listMotion';
import { SwapInPlace } from '@/lib/swapMotion';
import Tooltip from '../../overlays-and-layering/Tooltip/Tooltip';
import Icon from '../../images-and-icons/Icon';
import './FieldFrame.scss';

/**
 * What a caption tone means for the box and the control. One place, so every
 * host maps it the same way: an error marks both, a warning or a confirmation
 * marks only the box, and help leaves the field plain.
 *
 * @param {'help'|'invalid'|'warning'|'success'} [tone]
 * @returns {{ field: { invalid: boolean, warning: boolean, valid: boolean }, control: { 'aria-invalid'?: true } }}
 */
export function toneProps(tone) {
    return {
        field: { invalid: tone === 'invalid', warning: tone === 'warning', valid: tone === 'success' },
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
    id,
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
        <label id={id} htmlFor={htmlFor} className={`plus-field-label${hidden ? ' plus-field-label--hidden' : ''} ${className}`.trim()}>
            {children}
            {required && <span className="plus-field-required" aria-hidden="true">*</span>}
        </label>
    );
    if (!info || hidden) return label;
    return (
        <div className="plus-field-label-row">
            {label}
            <Tooltip text={info} placement="top">
                <button
                    type="button"
                    className="plus-field-info"
                    aria-label={`About ${name ?? (typeof children === 'string' ? children : 'this field')}`}
                >
                    <Icon name="circle-info" />
                </button>
            </Tooltip>
        </div>
    );
};

FieldLabel.propTypes = {
    /** The label's own id, for a control that is named by it with `aria-labelledby`. */
    id: PropTypes.string,
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
    invalid: 'circle-exclamation',
    warning: 'triangle-exclamation',
    success: 'circle-check',
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
    const counted = Boolean(countId && maxLength !== undefined);
    const hasContent = Boolean(message) || counted;
    const over = counted && count > maxLength;
    const swapKey = `${tone}:${typeof message === 'string' || typeof message === 'number' ? message : Boolean(message)}`;
    return (
        <PresenceSlot
            show={hasContent}
            data-field-caption-slot=""
            className="plus-field-caption-slot"
        >
            <div className="plus-field-caption">
                {message ? (
                    <SwapInPlace swapKey={swapKey} className="plus-field-caption__swap">
                        <div
                            id={messageId}
                            className={`plus-field-caption__message plus-field-caption__message--${tone}`}
                            role={tone === 'invalid' ? 'alert' : undefined}
                        >
                            {CAPTION_ICON[tone] && <Icon name={CAPTION_ICON[tone]} />}
                            <span>{message}</span>
                        </div>
                    </SwapInPlace>
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
        </PresenceSlot>
    );
};

FieldCaption.propTypes = {
    messageId: PropTypes.string,
    message: PropTypes.node,
    /** `invalid` is announced; `warning`, `success` and `help` are described. */
    tone: PropTypes.oneOf(['help', 'invalid', 'warning', 'success']),
    countId: PropTypes.string,
    count: PropTypes.number,
    maxLength: PropTypes.number,
};

/**
 * FieldFrame — label, field and caption stacked, with one disabled fade: the
 * box fades itself, and the stack fades only the label and caption around it.
 *
 * The non-chrome half of the field split (A7): it wraps Base UI's `Field.Root`
 * for `data-invalid`/`data-dirty`/`data-touched`/`data-disabled`, controlled
 * by the host's own tone and state (a host's control is plain markup, not
 * `Field.Control`, so these three stay host-reported rather than
 * auto-tracked). Choice controls (Checkbox, Radio) use this and never
 * `FieldBox`, which is chrome a choice control has none of.
 */
export const FieldFrame = ({
    disabled = false,
    invalid,
    dirty,
    touched,
    onClick,
    className = '',
    style,
    children,
}) => (
    <Field.Root
        disabled={disabled}
        invalid={invalid}
        dirty={dirty}
        touched={touched}
        render={<div className={`plus-field-stack${disabled ? ' plus-field-stack--disabled' : ''} ${className}`.trim()} style={style} onClick={onClick} />}
    >
        {children}
    </Field.Root>
);

FieldFrame.propTypes = {
    disabled: PropTypes.bool,
    /** Reported by the host from its own tone; drawn as `data-invalid`. */
    invalid: PropTypes.bool,
    /** Reported by the host, when it tracks it; drawn as `data-dirty`. */
    dirty: PropTypes.bool,
    /** Reported by the host, when it tracks it; drawn as `data-touched`. */
    touched: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

export default FieldFrame;
