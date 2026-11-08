import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import useFieldId from '../useFieldId';
import FieldBox from '../_internal/FieldBox';
import { FieldFrame } from '../_internal/FieldFrame';
import GenerativeBorder from '@/components/loading/GenerativeBorder';
import './PromptInput.scss';

/**
 * Where a person writes to the AI: a text area that grows from one line up to
 * five, then scrolls, with an optional control before the text and one send
 * action after it.
 *
 * - **value / defaultValue / onChange** control or seed the text. Uncontrolled,
 *   the field clears itself after a send; controlled, the owner clears it in
 *   `onSubmit`.
 * - **onSubmit(value)** runs on Enter or the send button, with the text as
 *   typed. Shift+Enter starts a new line. Nothing sends while the field is
 *   empty, disabled, loading, or an input method is mid-composition.
 * - **isLoading** turns the send button into Stop (`onStop`) and rings the
 *   field in a `GenerativeBorder`.
 * - **startSlot** is one quiet control before the text, such as an attach
 *   button. **attachments** renders a row of staged files above the text.
 *   **actions** is a slot for extra controls beside the send button.
 *
 * A PLUS composition of `FieldBox`, `Button` and `GenerativeBorder`.
 */
const PromptInput = ({
    id,
    label,
    value,
    defaultValue = '',
    onChange,
    onSubmit,
    isLoading = false,
    onStop,
    placeholder,
    isDisabled = false,
    startSlot,
    attachments,
    actions,
    state,
    className = '',
    onKeyDown,
    ...props
}) => {
    const fieldId = useFieldId(id);
    const controlRef = useRef(null);
    const [typed, setTyped] = useState(defaultValue);
    const isControlled = value !== undefined;
    const text = isControlled ? value : typed;
    const canSend = !isDisabled && !isLoading && text.trim() !== '';

    // The text area is as tall as its text, up to the max-height the stylesheet sets.
    useLayoutEffect(() => {
        const control = controlRef.current;
        if (!control) return;
        control.style.height = 'auto';
        control.style.height = `${control.scrollHeight}px`;
    }, [text]);

    const submit = () => {
        if (!canSend) return;
        onSubmit?.(text);
        if (!isControlled) setTyped('');
    };

    const handleChange = (event) => {
        if (!isControlled) setTyped(event.target.value);
        onChange?.(event);
    };

    const handleKeyDown = (event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        // 229 is the key code browsers report while an input method composes.
        const composing = event.nativeEvent.isComposing || event.keyCode === 229;
        if (event.key === 'Enter' && !event.shiftKey && !composing) {
            event.preventDefault();
            submit();
        }
    };

    const sendAction = isLoading ? (
        <Button
            spacing="compact"
            iconBefore="stop"
            title="Stop generating"
            aria-label="Stop generating"
            className="plus-prompt-input__send plus-prompt-input__send--stop"
            // Stop is never held back by `isDisabled`: a generation must stay cancelable.
            isDisabled={!onStop}
            onClick={() => onStop?.()}
        />
    ) : (
        <Button
            spacing="compact"
            appearance="primary"
            iconBefore="paper-plane"
            title="Send"
            aria-label="Send"
            className="plus-prompt-input__send"
            isDisabled={!canSend}
            onClick={submit}
        />
    );

    const trailing = (
        <span className="plus-prompt-input__trailing-group">
            {actions}
            {sendAction}
        </span>
    );

    return (
        <GenerativeBorder
            isActive={isLoading}
            radius="radius-075"
            className={['plus-prompt-input', className].filter(Boolean).join(' ')}
        >
            <FieldFrame disabled={isDisabled} className="plus-prompt-input__frame">
                {attachments && <div className="plus-prompt-input__attachments">{attachments}</div>}
                <FieldBox
                    multiline
                    disabled={isDisabled}
                    state={state === 'focus' ? 'focus' : undefined}
                    className="plus-prompt-input__field"
                    leading={startSlot}
                    trailing={trailing}
                >
                    <textarea
                        id={fieldId}
                        rows={1}
                        placeholder={placeholder}
                        {...props}
                        ref={controlRef}
                        value={text}
                        disabled={isDisabled}
                        aria-label={label}
                        className="plus-field__control plus-prompt-input__control"
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                    />
                </FieldBox>
            </FieldFrame>
        </GenerativeBorder>
    );
};

PromptInput.propTypes = {
    id: PropTypes.string,
    /** The field's accessible name, such as "Message to AI chat". */
    label: PropTypes.string.isRequired,
    /** The text, for a controlled field. */
    value: PropTypes.string,
    /** The starting text of an uncontrolled field. */
    defaultValue: PropTypes.string,
    /** Called with the change event as the text changes. */
    onChange: PropTypes.func,
    /** Called with the text on Enter or the send button. */
    onSubmit: PropTypes.func,
    /** A reply is being generated: the send button becomes Stop and the field gets a GenerativeBorder. */
    isLoading: PropTypes.bool,
    /** What the Stop button does while `isLoading`. */
    onStop: PropTypes.func,
    placeholder: PropTypes.string,
    isDisabled: PropTypes.bool,
    /** One quiet control before the text, such as an attach button. */
    startSlot: PropTypes.node,
    /** A row of staged attachments, shown above the text. */
    attachments: PropTypes.node,
    /** Extra controls beside the send button. */
    actions: PropTypes.node,
    /** Draws focus still, for documentation. Live focus needs nothing. */
    state: PropTypes.oneOf(['default', 'focus']),
    className: PropTypes.string,
    onKeyDown: PropTypes.func,
};

export default PromptInput;
