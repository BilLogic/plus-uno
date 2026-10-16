import { useState } from 'react';

/**
 * A picker's value, controlled through `value` or not, with optional
 * staging: picks made while a list is open land together when it closes.
 *
 * - `commit(next)` sets the value and calls `onChange` now.
 * - `stage(next)` holds `next` as the draft, which `current` then shows.
 * - `change(next)` stages while a draft is open and commits otherwise.
 * - `beginStaging()` opens a draft from the committed value, when `staged`.
 * - `endStaging()` closes the draft and commits it if it differs.
 * - `dropStaging()` throws the draft away.
 *
 * `current` is what the field shows: the draft while there is one, else the
 * committed value (always an array in multi mode).
 *
 * @param {object} options
 * @param {boolean} options.multi
 * @param {*} [options.value] the parent's value, to control it
 * @param {*} [options.defaultValue]
 * @param {(next: *) => void} [options.onChange]
 * @param {boolean} options.staged true: `beginStaging` opens a draft
 */
export default function useStagedValue({ multi, value, defaultValue, onChange, staged }) {
    const empty = multi ? [] : '';
    const [internalValue, setInternalValue] = useState(defaultValue ?? empty);
    const controlled = value !== undefined;
    const committed = controlled ? value : internalValue;
    const committedList = multi ? (Array.isArray(committed) ? committed : []) : committed;

    /** Picks made while open. `null` when not staging. */
    const [draft, setDraft] = useState(null);
    const current = draft ?? committedList;

    const commit = (next) => {
        if (!controlled) setInternalValue(next);
        if (onChange) onChange(next);
    };

    const change = (next) => {
        if (draft !== null) setDraft(next);
        else commit(next);
    };

    const beginStaging = () => {
        if (staged) setDraft(committedList);
    };

    const endStaging = () => {
        if (draft === null) return;
        const changed = draft.length !== committedList.length || draft.some((v) => !committedList.includes(v));
        setDraft(null);
        if (changed) commit(draft);
    };

    return {
        empty,
        committed,
        committedList,
        current,
        commit,
        stage: setDraft,
        change,
        beginStaging,
        endStaging,
        dropStaging: () => setDraft(null),
    };
}
