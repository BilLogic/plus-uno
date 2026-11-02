import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
// Field and useFieldId are parts, not exported from the barrel.
import Field from '@/components/forms-and-inputs/_internal/Field';
import useFieldId from '@/components/forms-and-inputs/useFieldId';
import GenerativeBorder from '../GenerativeBorder';
import './PromptInput.scss';

/**
 * Where a person writes to the agent: a text area that grows as they type, an
 * optional control before it, and one send action.
 *
 * - **value / defaultValue** control or seed the text. Uncontrolled, the field
 *   clears itself after a send; controlled, the owner clears it in `onSubmit`.
 * - **onSubmit(value)** runs on Enter or the send button, with the text as typed.
 *   Shift+Enter starts a new line. Nothing is sent while the field is empty, a
 *   reply is being generated, or an input method is composing.
 * - **isGenerating** turns the send button into Stop and rings the field in a
 *   GenerativeBorder. **onStop** is what Stop does.
 * - **startSlot** is for one quiet control before the text, such as an attach
 *   button.
 * - **label** names the field for assistive technology.
 *
 * The send button is the one AI action in the region: it takes the AI
 * bold ground, and nothing else beside it should be.
 */
const PromptInput = ({
    id,
    label,
    value,
    defaultValue = '',
    onChange,
    onSubmit,
    isGenerating = false,
    onStop,
    placeholder,
    isDisabled = false,
    startSlot,
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
    const canSend = !isDisabled && !isGenerating && text.trim() !== '';

    // The text area is as tall as its text, up to the most the style allows.
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

    // A plain button, because Button has no AI appearance yet: the AI ground is the
    // one thing this action is for, and its styles live in PromptInput.scss.
    const action = isGenerating ? (
        <button
            type="button"
            className="plus-prompt-input__action"
            aria-label="Stop generating"
            title="Stop generating"
            // Stop is never held back by `isDisabled`: a generation must stay cancelable.
            disabled={!onStop}
            onClick={() => onStop?.()}
        >
            <i className="fa-solid fa-stop" aria-hidden="true" />
        </button>
    ) : (
        <button
            type="button"
            className="plus-prompt-input__action"
            aria-label="Send"
            title="Send"
            disabled={!canSend}
            onClick={submit}
        >
            <i className="fa-solid fa-paper-plane" aria-hidden="true" />
        </button>
    );

    return (
        <GenerativeBorder
            active={isGenerating}
            radius="rounded"
            className={['plus-prompt-input', className].filter(Boolean).join(' ')}
        >
            <Field
                multiline
                disabled={isDisabled}
                state={state === 'focus' ? 'focus' : undefined}
                className="plus-prompt-input__field"
                leading={startSlot}
                trailing={action}
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
            </Field>
        </GenerativeBorder>
    );
};

PromptInput.propTypes = {
    id: PropTypes.string,
    /** The accessible name of the field, such as "Message to PLUS AI". */
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
    isGenerating: PropTypes.bool,
    /** What the Stop button does while `isGenerating`. */
    onStop: PropTypes.func,
    placeholder: PropTypes.string,
    isDisabled: PropTypes.bool,
    /** One quiet control before the text, such as an attach button. */
    startSlot: PropTypes.node,
    /** Draws focus still, for documentation. Live focus needs nothing. */
    state: PropTypes.oneOf(['default', 'focus']),
    className: PropTypes.string,
    onKeyDown: PropTypes.func,
};

export default PromptInput;
