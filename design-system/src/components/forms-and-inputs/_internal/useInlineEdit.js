import { useCallback, useEffect, useRef, useState } from 'react';

/** What a failed save says when the error carries no message of its own. */
export const SAVE_FAILED = 'Couldn’t save. Try again.';

/**
 * Editing in place, for a subtle field.
 *
 * Two models, chosen by `multiline`:
 *   - single-line (Input, NumberInput): saves when the field loses focus or on
 *     Enter, and Esc cancels — Notion's model, with no buttons.
 *   - multi-line (Textarea): Save and Cancel buttons, and the field stays open
 *     when it loses focus — Atlassian's InlineEdit, because a click elsewhere
 *     mid-paragraph should not publish half a thought. Esc cancels there too.
 *
 * While `onSave` runs, `saving` is true and the host shows "saving…" in
 * Trailing. If it throws or rejects, the field stays open in `invalid` with
 * the error as its caption, and what was typed is kept.
 *
 * `enabled` false makes this a pass-through, so a host can call it
 * unconditionally and only a subtle field edits in place.
 *
 * @param {object} options
 * @param {boolean} options.enabled
 * @param {boolean} [options.multiline]
 * @param {string|number} [options.value] the saved value, when the caller holds it
 * @param {string|number} [options.defaultValue] the starting value otherwise
 * @param {(value: string) => (void|Promise<void>)} [options.onSave]
 */
export default function useInlineEdit({ enabled, multiline = false, value, defaultValue, onSave }) {
    const controlled = value !== undefined;
    const [savedInternal, setSavedInternal] = useState(defaultValue ?? '');
    const saved = String((controlled ? value : savedInternal) ?? '');

    const [draft, setDraftState] = useState(saved);
    const draftRef = useRef(saved);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [focused, setFocused] = useState(false);
    const cancelling = useRef(false);
    const controlRef = useRef(null);

    const setDraft = useCallback((next) => {
        draftRef.current = next;
        setDraftState(next);
    }, []);

    // A new saved value from outside replaces the draft, unless someone is
    // mid-edit or a failed save is holding what they typed.
    const dirty = draft !== saved;
    useEffect(() => {
        if (!focused && !error && !saving) setDraft(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saved]);

    const save = useCallback(async () => {
        const next = draftRef.current;
        if (next === saved) {
            setError(null);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            if (onSave) await onSave(next);
            if (!controlled) setSavedInternal(next);
        } catch (failure) {
            setError((failure && failure.message) || SAVE_FAILED);
        } finally {
            setSaving(false);
        }
    }, [controlled, onSave, saved]);

    const cancel = useCallback(() => {
        cancelling.current = true;
        setDraft(saved);
        setError(null);
        if (controlRef.current) controlRef.current.blur();
        cancelling.current = false;
    }, [saved, setDraft]);

    if (!enabled) {
        return { enabled: false };
    }

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
            return;
        }
        if (event.key !== 'Enter') return;
        if (multiline && !(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        if (multiline) {
            save();
        } else {
            // Leaving the field is what saves it, so Enter and a click away
            // take the same path and cannot save twice.
            event.currentTarget.blur();
        }
    };

    const onFocus = () => setFocused(true);

    const onBlur = () => {
        setFocused(false);
        if (multiline || cancelling.current) return;
        save();
    };

    return {
        enabled: true,
        draft,
        setDraft,
        saving,
        error,
        /** The editor is open: being typed in, holding unsaved text, saving or failed. */
        editing: focused || dirty || saving || Boolean(error),
        save,
        cancel,
        controlRef,
        handlers: { onKeyDown, onFocus, onBlur },
    };
}
