import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import IconButton from '@/components/forms-and-inputs/IconButton/IconButton';
import { FieldLabel } from '@/components/forms-and-inputs/_internal/FieldFrame';
import { SAVE_FAILED } from '@/components/forms-and-inputs/_internal/useInlineEdit';
import './InlineEdit.scss';

/** What the edit view's control is, to put the caret in it when the view opens. */
const CONTROL = 'input, textarea, select, [contenteditable="true"]';

/**
 * InlineEdit — text that reads as text and becomes a field when it is pressed.
 *
 * The read view and the edit view are drawn at the same size, so opening the
 * editor does not move anything around it. Enter or leaving the editor
 * confirms; Escape cancels. Confirm and cancel buttons sit under the edit view
 * and can be left off. `validate` can refuse a value with a message, and the
 * editor stays open.
 *
 * The parent holds the value. `defaultValue` is what the edit view starts with
 * each time it opens, and `onConfirm` is where the new value goes.
 *
 * Not for use inside a form: it saves on its own and has no say in the form's
 * submit. Use `Input` there.
 */
const InlineEdit = ({
    id,
    label,
    defaultValue,
    readView,
    editView,
    onConfirm,
    onCancel,
    onEdit,
    validate,
    keepEditViewOpenOnBlur = false,
    startWithEditViewOpen = false,
    hideActionButtons = false,
    compact = false,
    readViewFitContainerWidth = false,
    editLabel = 'Edit',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    className = '',
}) => {
    const autoId = useId();
    const baseId = id ?? `inline-edit-${autoId.replace(/:/g, '')}`;
    const labelId = `${baseId}-label`;
    const textId = `${baseId}-text`;
    const hintId = `${baseId}-hint`;

    const [editing, setEditing] = useState(startWithEditViewOpen);
    const [draft, setDraft] = useState(defaultValue);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const rootRef = useRef(null);
    const readRef = useRef(null);
    const draftRef = useRef(draft);
    const working = useRef(false);
    const closing = useRef(false);
    const returnFocus = useRef(false);

    const updateDraft = useCallback((next) => {
        const value = next && next.target ? next.target.value : next;
        draftRef.current = value;
        setDraft(value);
        setError(null);
    }, []);

    const open = () => {
        draftRef.current = defaultValue;
        setDraft(defaultValue);
        setError(null);
        setEditing(true);
        if (onEdit) onEdit();
    };

    // Put the caret in the editor when it opens, and the focus back on the
    // read view when the editor was closed from inside it.
    useEffect(() => {
        if (editing) {
            const control = rootRef.current && rootRef.current.querySelector(CONTROL);
            if (control) control.focus();
        } else if (returnFocus.current) {
            returnFocus.current = false;
            if (readRef.current) readRef.current.focus();
        }
        closing.current = false;
    }, [editing]);

    const close = (restoreFocus) => {
        closing.current = true;
        returnFocus.current = restoreFocus;
        setError(null);
        setEditing(false);
    };

    const cancel = () => {
        if (working.current) return;
        close(true);
        if (onCancel) onCancel();
    };

    const confirm = async (restoreFocus) => {
        if (working.current || closing.current) return;
        working.current = true;
        setBusy(true);
        try {
            const value = draftRef.current;
            const message = validate ? await validate(value) : undefined;
            if (message) {
                setError(message);
                return;
            }
            if (onConfirm) await onConfirm(value);
            close(restoreFocus);
        } catch (failure) {
            setError((failure && failure.message) || SAVE_FAILED);
        } finally {
            working.current = false;
            setBusy(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.defaultPrevented || event.nativeEvent.isComposing) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
            return;
        }
        if (event.key !== 'Enter') return;
        const tag = event.target.tagName;
        if (tag === 'BUTTON' || tag === 'A') return;
        // A text area keeps Enter for a new line; the modifier confirms.
        if (tag === 'TEXTAREA' && !(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        confirm(true);
    };

    const handleBlur = (event) => {
        if (keepEditViewOpenOnBlur || closing.current) return;
        // Moving between the editor and its buttons is not leaving it.
        if (rootRef.current && rootRef.current.contains(event.relatedTarget)) return;
        confirm(false);
    };

    // A press on a button must not pull focus off the field, or the blur
    // would confirm before the click lands.
    const keepFocus = (event) => event.preventDefault();

    const classes = [
        'plus-inline-edit',
        compact && 'plus-inline-edit--compact',
        editing && 'plus-inline-edit--editing',
        className,
    ].filter(Boolean).join(' ');

    const buttonSpacing = compact ? 'compact' : 'default';

    return (
        <div
            className={classes}
            ref={rootRef}
            onKeyDown={editing ? handleKeyDown : undefined}
            onBlur={editing ? handleBlur : undefined}
        >
            {label && (
                <FieldLabel id={labelId} htmlFor={editing ? baseId : undefined}>
                    {label}
                </FieldLabel>
            )}
            {editing ? (
                <>
                    {editView({
                        id: baseId,
                        value: draft,
                        onChange: updateDraft,
                        validation: error ? 'invalid' : 'none',
                        validationMessage: error || undefined,
                        isSaving: busy,
                    })}
                    {!hideActionButtons && (
                        <div className="plus-inline-edit__anchor">
                            <div className="plus-inline-edit__actions">
                                <IconButton
                                    appearance="primary"
                                    spacing={buttonSpacing}
                                    icon="check"
                                    label={confirmLabel}
                                    isLoading={busy}
                                    onMouseDown={keepFocus}
                                    onClick={() => confirm(true)}
                                />
                                <IconButton
                                    spacing={buttonSpacing}
                                    icon="xmark"
                                    label={cancelLabel}
                                    isDisabled={busy}
                                    onMouseDown={keepFocus}
                                    onClick={cancel}
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <button
                        type="button"
                        ref={readRef}
                        className={`plus-inline-edit__read${readViewFitContainerWidth ? ' plus-inline-edit__read--fill' : ''}`}
                        aria-labelledby={label ? `${labelId} ${textId}` : textId}
                        aria-describedby={hintId}
                        onClick={open}
                    >
                        <span id={textId} className="plus-inline-edit__text">{readView()}</span>
                    </button>
                    <span id={hintId} className="plus-inline-edit__hint">{editLabel}</span>
                </>
            )}
        </div>
    );
};

InlineEdit.propTypes = {
    /** Base id for the edit view's control; the label points at it while editing. */
    id: PropTypes.string,
    /** Shown above both views. */
    label: PropTypes.node,
    /** What the edit view starts with each time it opens. The parent updates it after a confirm. */
    defaultValue: PropTypes.any,
    /** Returns the read view's content. Keep it to plain text: the whole view is one button. */
    readView: PropTypes.func.isRequired,
    /** Returns the edit view, given `{ id, value, onChange, validation, validationMessage, isSaving }`. `onChange` takes a value or a change event. */
    editView: PropTypes.func.isRequired,
    /** Called with the value on Enter, on leaving the editor and on the confirm button. Throw or reject to keep the editor open with the error. */
    onConfirm: PropTypes.func,
    /** Called when Escape or the cancel button closes the editor. */
    onCancel: PropTypes.func,
    /** Called when the editor opens. */
    onEdit: PropTypes.func,
    /** Returns a message to refuse the value, or nothing to accept it. May be async. */
    validate: PropTypes.func,
    /** Leaving the editor no longer confirms; only Enter and the confirm button do. */
    keepEditViewOpenOnBlur: PropTypes.bool,
    /** Opens in the edit view and puts the caret in it. */
    startWithEditViewOpen: PropTypes.bool,
    /** Leaves off the confirm and cancel buttons. Enter, Escape and leaving the editor still work. */
    hideActionButtons: PropTypes.bool,
    /** The 24 height, with the compact buttons. */
    compact: PropTypes.bool,
    /** The read view fills its container, so the whole row is one press target. */
    readViewFitContainerWidth: PropTypes.bool,
    /** What a screen reader hears after the read view, naming what pressing does. */
    editLabel: PropTypes.string,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    className: PropTypes.string,
};

export default InlineEdit;
