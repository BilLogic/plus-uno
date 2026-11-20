import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import Popup from '@/components/overlays-and-layering/Popup/Popup';
import { FieldBox } from '@/lib/field';
import Calendar from '../_internal/Calendar';
import AnchoredListboxSurface from '../_internal/AnchoredListboxSurface';
import clearLabel from '../_internal/clearLabel';
import { formatDisplay, formatIso, outOfBounds, parseDate, parseTyped, sameDay } from '../_internal/dates';
import { Button } from '../Button/Button';
import { FilterButton } from '../FilterButton/FilterButton';
import { IconButton } from '../IconButton/IconButton';
import Icon from '../../images-and-icons/Icon';
import '../_internal/Listbox.scss';
import '../_internal/OptionRow.scss';
import './DatePicker.scss';

/** Joins a range's two ends in the field: "10/19/2026 – 10/23/2026". */
const RANGE_JOIN = ' – ';

/** Local midnight of a date. */
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Shifts a local date by `days`. */
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Built-in range presets for the preset popup. */
const DEFAULT_PRESETS = [
    { id: 'all-time', label: 'All time', value: [null, null] },
    { id: 'today', label: 'Today', range: (ref) => [ref, ref] },
    { id: 'last-7-days', label: 'Last 7 days', range: (ref) => [addDays(ref, -6), ref] },
    { id: 'last-30-days', label: 'Last 30 days', range: (ref) => [addDays(ref, -29), ref] },
];

const presetKey = (preset) => preset.id ?? preset.label;

const isRangeOutOfBounds = (rangeToCheck, minDate, maxDate) => {
    const [start, end] = Array.isArray(rangeToCheck) ? rangeToCheck : [null, null];
    if (!start && !end) return false;
    if (!start || !end || start > end) return true;
    return outOfBounds(start, minDate, maxDate) || outOfBounds(end, minDate, maxDate);
};

const resolvePresetRange = (preset, refDate) => {
    if (typeof preset.range === 'function') {
        const [start, end] = preset.range(refDate) ?? [null, null];
        return [parseDate(start), parseDate(end)];
    }
    const [start, end] = Array.isArray(preset.value) ? preset.value : [null, null];
    return [parseDate(start), parseDate(end)];
};

const matchesPresetRange = (preset, current, refDate) => {
    const [pStart, pEnd] = resolvePresetRange(preset, refDate);
    const [cStart, cEnd] = current;
    if (!pStart && !pEnd) return !cStart && !cEnd;
    return sameDay(pStart, cStart) && sameDay(pEnd, cEnd);
};

/**
 * The text a value shows in the field.
 *
 * @param {Date|null|Array<Date|null>} picked
 * @returns {string}
 */
const display = (picked) => {
    if (!Array.isArray(picked)) return formatDisplay(picked);
    const [start, end] = picked;
    if (!start && !end) return '';
    return `${formatDisplay(start)}${RANGE_JOIN}${formatDisplay(end)}`.trim();
};

/**
 * The value a `value` prop stands for: a Date, or a range's two ends.
 *
 * @param {string|string[]|undefined} value
 * @param {boolean} range
 * @returns {Date|null|Array<Date|null>}
 */
const fromValue = (value, range) => {
    if (!range) return parseDate(Array.isArray(value) ? value[0] : value);
    const [start, end] = Array.isArray(value) ? value : [value, null];
    return [parseDate(start), parseDate(end)];
};

/**
 * DatePicker — a date field that opens a month calendar (Figma `DatePicker`).
 *
 * Built from the shared parts: the field is `FieldBox` with the calendar icon in
 * Trailing, and the calendar is the shared `Calendar` on the `_Listbox`
 * surface, which DateTimePicker opens too.
 *
 * - **Typing:** the field takes MM/DD/YYYY (and, with `range`, two dates
 *   joined by a dash). It is checked when you press Enter or leave the field:
 *   a real day inside `minDate`…`maxDate` is picked, anything else is kept as
 *   typed and marked invalid, and `onChange` is not called.
 * - **Range:** the first click sets the first day, the second the last; a click
 *   before the first day starts again. `onChange` receives `[start, end]`.
 * - **Clearing:** when a value or typed text is in a live field, a subtle
 *   `xmark` icon button (`tabIndex={-1}`) sits before the calendar icon and a
 *   subtle "Clear" button (in the tab order) sits in the calendar footer. Both
 *   empty the field, call `onChange` with `''` (or `[null, null]` with `range`)
 *   when a pick was set, and keep focus in the input.
 * - **Popup:** opens 4px (`--stack-sm`) below the field, left-aligned
 *   (or as `calendarAlign` asks), and flips above with the same gap when there
 *   is no room below.
 *
 * Props it does not name (`aria-label`, `aria-labelledby`, `aria-describedby`,
 * `data-*`) go to the input, which is the control a screen reader lands on.
 * `label` does not name the plain field: it is the filter trigger's text and
 * turns DatePicker into the filter popup. Name a plain field with `aria-label`,
 * or a visible label tied to it with `htmlFor` and the field's `id`.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const DatePicker = ({
    id,
    name,
    placeholder,
    value,
    defaultValue,
    range = false,
    presets = false,
    label,
    trigger,
    placement = 'bottom-start',
    today,
    lookBack,
    spacing = 'default',
    isDisabled = false,
    isReadOnly = false,
    isInvalid = false,
    isValid = false,
    minDate,
    maxDate,
    calendarAlign = 'left',
    container,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const autoId = useId();
    const fieldId = id || name || `plus-date-picker-${autoId.replace(/:/g, '')}`;
    const popupId = `${fieldId}-calendar`;

    const hasPresets = Boolean(presets);
    const isFilterMode = Boolean(label || trigger);
    const effectiveRange = range || hasPresets || isFilterMode;
    const todayDate = useMemo(() => startOfDay(parseDate(today) || new Date()), [today]);
    const shouldLookBack = lookBack !== undefined ? lookBack : (hasPresets || isFilterMode);
    const effectiveMaxDate = maxDate !== undefined ? maxDate : (shouldLookBack ? todayDate : undefined);

    const resolvedPresets = useMemo(() => {
        if (Array.isArray(presets)) return presets;
        if (hasPresets || isFilterMode) return DEFAULT_PRESETS;
        return [];
    }, [presets, hasPresets, isFilterMode]);

    const interactive = !isDisabled && !isReadOnly;

    const isPresetDisabled = useCallback((preset) => (
        isRangeOutOfBounds(resolvePresetRange(preset, todayDate), minDate, effectiveMaxDate)
    ), [todayDate, minDate, effectiveMaxDate]);

    const initialValue = value !== undefined ? value : defaultValue;
    const [picked, setPicked] = useState(() => fromValue(initialValue, effectiveRange));
    const [text, setText] = useState(() => display(fromValue(initialValue, effectiveRange)));
    const [typedInvalid, setTypedInvalid] = useState(false);
    const [open, setOpen] = useState(false);
    const firstDay = (current) => (Array.isArray(current) ? current[0] || current[1] : current);
    const [viewDate, setViewDate] = useState(() => firstDay(fromValue(initialValue, effectiveRange)) || todayDate);

    // Draft range & preset state used when the popup has presets and Clear/Apply actions.
    const [draft, setDraft] = useState(() => (Array.isArray(picked) ? picked : [null, null]));
    const [draftPreset, setDraftPreset] = useState(() => {
        if (!resolvedPresets.length) return null;
        const initialRange = Array.isArray(picked) ? picked : [null, null];
        const match = resolvedPresets.find((preset) => (
            !isRangeOutOfBounds(resolvePresetRange(preset, todayDate), minDate, effectiveMaxDate)
            && matchesPresetRange(preset, initialRange, todayDate)
        ));
        return match ? presetKey(match) : null;
    });

    const fieldRef = useRef(null);
    const inputRef = useRef(null);

    const valueKey = Array.isArray(value) ? value.join('|') : value;
    useEffect(() => {
        if (value === undefined) return;
        const next = fromValue(value, effectiveRange);
        setPicked(next);
        setText(display(next));
        setTypedInvalid(false);
        if (firstDay(next)) setViewDate(firstDay(next));
    }, [valueKey, effectiveRange]); // eslint-disable-line react-hooks/exhaustive-deps

    const syncDraftFromApplied = useCallback((source) => {
        const appliedRange = Array.isArray(source) ? source : [null, null];
        setDraft(appliedRange);
        const match = resolvedPresets.find((preset) => (
            !isPresetDisabled(preset) && matchesPresetRange(preset, appliedRange, todayDate)
        ));
        setDraftPreset(match ? presetKey(match) : null);
        setViewDate(firstDay(appliedRange) || todayDate);
    }, [isPresetDisabled, resolvedPresets, todayDate]);

    const handlePopupToggle = useCallback((nextOpen) => {
        if (nextOpen) {
            if (!interactive) return;
            syncDraftFromApplied(picked);
        }
        setOpen(Boolean(nextOpen));
    }, [interactive, picked, syncDraftFromApplied]);

    const close = useCallback(() => setOpen(false), []);

    const openCalendar = () => {
        if (!interactive || open) return;
        if (resolvedPresets.length) syncDraftFromApplied(picked);
        else setViewDate(firstDay(picked) || todayDate);
        setOpen(true);
    };

    /** Records a pick and tells the caller. */
    const commit = (next) => {
        if (!interactive) return;
        setPicked(next);
        setText(display(next));
        setTypedInvalid(false);
        if (Array.isArray(next)) onChange?.(next.map((date) => (date ? formatIso(date) : null)));
        else onChange?.(formatIso(next));
    };

    /** Reads the typed text: picks a valid date, marks anything else invalid. */
    const commitText = () => {
        if (!interactive || text === display(picked)) return;
        if (!text.trim()) {
            commit(effectiveRange ? [null, null] : null);
            return;
        }
        const allowed = (date) => date && !outOfBounds(date, minDate, effectiveMaxDate);
        if (effectiveRange) {
            const [first, second = ''] = text.split(/\s*[–—-]\s*/);
            const start = parseTyped(first);
            const end = second.trim() ? parseTyped(second) : null;
            const ok = allowed(start) && (!second.trim() || (allowed(end) && end >= start));
            if (!ok) { setTypedInvalid(true); return; }
            commit([start, end]);
            setViewDate(start);
            return;
        }
        const date = parseTyped(text);
        if (!allowed(date)) { setTypedInvalid(true); return; }
        commit(date);
        setViewDate(date);
    };

    const pick = (date) => {
        if (!interactive || !date || outOfBounds(date, minDate, effectiveMaxDate)) return;
        if (resolvedPresets.length) {
            const [start, end] = draft;
            if (!start || end || date < start) {
                setDraft([date, null]);
                setDraftPreset(null);
                return;
            }
            const nextDraft = [start, date];
            setDraft(nextDraft);
            const match = resolvedPresets.find((preset) => (
                !isPresetDisabled(preset) && matchesPresetRange(preset, nextDraft, todayDate)
            ));
            setDraftPreset(match ? presetKey(match) : null);
            return;
        }
        if (!effectiveRange) {
            commit(date);
            setOpen(false);
            inputRef.current?.focus();
            return;
        }
        const [start, end] = Array.isArray(picked) ? picked : [null, null];
        if (!start || end || date < start) {
            commit([date, null]);
            return;
        }
        commit([start, date]);
        setOpen(false);
        inputRef.current?.focus();
    };

    const selectPreset = (preset) => {
        if (!interactive || !preset || isPresetDisabled(preset)) return;
        const nextRange = resolvePresetRange(preset, todayDate);
        setDraft(nextRange);
        setDraftPreset(presetKey(preset));
        setViewDate(nextRange[1] || nextRange[0] || todayDate);
    };

    const handleDraftClear = () => {
        if (!interactive) return;
        setDraft([null, null]);
        setDraftPreset(null);
        commit([null, null]);
    };

    const [rangeStart, rangeEnd] = Array.isArray(picked) ? picked : [null, null];
    const [draftStart, draftEnd] = draft;
    const hasDraftEnds = Boolean(draftStart && draftEnd);
    const isEmptyPresetSelected = Boolean(draftPreset && resolvedPresets.some((preset) => {
        if (presetKey(preset) !== draftPreset || isPresetDisabled(preset)) return false;
        const [start, end] = resolvePresetRange(preset, todayDate);
        return !start && !end;
    }));
    const canApply = interactive && (
        (hasDraftEnds && !isRangeOutOfBounds(draft, minDate, effectiveMaxDate))
        || (isEmptyPresetSelected && Boolean(rangeStart || rangeEnd))
    );

    const handleDraftApply = () => {
        if (!interactive || !canApply || isRangeOutOfBounds(draft, minDate, effectiveMaxDate)) return;
        commit(draft);
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (interactive) commitText();
            setOpen(false);
        } else if (event.key === 'Escape') {
            if (open) event.preventDefault();
            setOpen(false);
        } else if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            openCalendar();
        }
    };

    // Leaving the field reads what was typed, including a Tab into the
    // calendar, which then shows the typed day.
    const handleBlur = (event) => {
        commitText();
        onBlur?.(event);
    };

    const invalid = isInvalid || typedInvalid;
    const hasPicked = Array.isArray(picked) ? Boolean(rangeStart || rangeEnd) : Boolean(picked);
    const hasValue = hasPicked || Boolean(text);
    const clearName = clearLabel(props['aria-label'], effectiveRange ? 'dates' : 'date');

    const clear = () => {
        if (!interactive) return;
        if (!hasPicked) {
            setText('');
            setTypedInvalid(false);
            return;
        }
        commit(effectiveRange ? [null, null] : null);
    };

    const presetRangePopupContent = (
        <div className="plus-date-range-popup__layout">
            <BaseRadioGroup
                className="plus-date-range-popup__presets"
                aria-label="Date range presets"
                value={draftPreset ?? null}
                disabled={isDisabled}
                readOnly={isReadOnly}
                onValueChange={(nextValue) => {
                    const match = resolvedPresets.find((preset) => presetKey(preset) === nextValue);
                    if (match) selectPreset(match);
                }}
            >
                {resolvedPresets.map((preset) => {
                    const key = presetKey(preset);
                    const isSelected = draftPreset === key;
                    const presetDisabled = isPresetDisabled(preset);
                    return (
                        <BaseRadio.Root
                            key={key}
                            value={key}
                            disabled={isDisabled || presetDisabled}
                            className={[
                                'plus-option-row',
                                'plus-date-range-popup__preset',
                                isSelected && 'is-selected',
                                presetDisabled && 'is-disabled',
                            ].filter(Boolean).join(' ')}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !presetDisabled && interactive) {
                                    event.preventDefault();
                                    selectPreset(preset);
                                }
                            }}
                        >
                            {preset.label}
                        </BaseRadio.Root>
                    );
                })}
            </BaseRadioGroup>
            <div className="plus-date-range-popup__calendar">
                <Calendar
                    size={24}
                    viewDate={viewDate}
                    onViewDateChange={setViewDate}
                    rangeStart={draftStart}
                    rangeEnd={draftEnd}
                    minDate={minDate}
                    maxDate={effectiveMaxDate}
                    onPick={pick}
                />
                <div className="plus-date-range-popup__footer">
                    <Button
                        appearance="subtle"
                        spacing="compact"
                        onClick={handleDraftClear}
                    >
                        Clear
                    </Button>
                    <Button
                        appearance="default"
                        spacing="compact"
                        isDisabled={!canApply}
                        onClick={handleDraftApply}
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );

    const isOpen = interactive && open;

    if (isFilterMode) {
        const appliedPreset = resolvedPresets.find((preset) => matchesPresetRange(preset, [rangeStart, rangeEnd], todayDate));
        const summaryText = rangeStart && rangeEnd
            ? (appliedPreset ? appliedPreset.label : `${formatDisplay(rangeStart)}${RANGE_JOIN}${formatDisplay(rangeEnd)}`)
            : (appliedPreset?.label ?? 'All time');

        let triggerNode;
        if (typeof trigger === 'function') {
            triggerNode = trigger({ isOpen, value: [rangeStart, rangeEnd], summary: summaryText });
        } else if (trigger) {
            triggerNode = trigger;
        } else {
            triggerNode = (
                <FilterButton
                    text={label ? `${label}: ${summaryText}` : summaryText}
                    appearance="subtle"
                    spacing={spacing}
                    isDisabled={isDisabled}
                    className="plus-date-picker__filter-trigger"
                />
            );
        }

        return (
            <Popup
                trigger={triggerNode}
                label={label || 'Choose dates'}
                placement={placement}
                show={isOpen}
                onToggle={handlePopupToggle}
                container={container}
                id={popupId}
                className={['plus-date-range-popup', className].filter(Boolean).join(' ')}
            >
                {presetRangePopupContent}
            </Popup>
        );
    }

    return (
        <>
            <FieldBox
                ref={fieldRef}
                spacing={spacing}
                disabled={isDisabled}
                readOnly={isReadOnly}
                invalid={invalid}
                valid={isValid}
                className={['plus-date-picker', isOpen && 'plus-date-picker--open', className].filter(Boolean).join(' ')}
                style={style}
                // A read-only value cannot be changed, so the trailing controls are not drawn.
                elemAfter={isReadOnly ? null : (
                    <>
                        {hasValue && !isDisabled && (
                            <IconButton
                                icon="xmark"
                                label={clearName}
                                appearance="subtle"
                                spacing={spacing}
                                tabIndex={-1}
                                className="plus-field-clear"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    clear();
                                    inputRef.current?.focus();
                                }}
                            />
                        )}
                        <span
                            className="plus-date-picker__icon"
                            aria-hidden="true"
                            onMouseDown={(event) => {
                                if (!interactive) return;
                                event.preventDefault();
                                inputRef.current?.focus();
                                if (isOpen) setOpen(false); else openCalendar();
                            }}
                        >
                            <Icon name="calendar-day" />
                        </span>
                    </>
                )}
            >
                <input
                    {...props}
                    ref={inputRef}
                    type="text"
                    id={fieldId}
                    name={name}
                    className="plus-field__control plus-date-picker__input"
                    role="combobox"
                    autoComplete="off"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? popupId : undefined}
                    aria-invalid={invalid || undefined}
                    placeholder={placeholder ?? (effectiveRange ? `MM/DD/YYYY${RANGE_JOIN}MM/DD/YYYY` : 'MM/DD/YYYY')}
                    value={text}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    aria-readonly={isReadOnly || undefined}
                    onClick={openCalendar}
                    onChange={(event) => {
                        if (!interactive) return;
                        setText(event.target.value);
                        setTypedInvalid(false);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={onFocus}
                    onBlur={handleBlur}
                />
            </FieldBox>
            <AnchoredListboxSurface
                open={isOpen}
                anchorRef={fieldRef}
                align={calendarAlign}
                onClose={close}
                preserveFieldFocus
                id={popupId}
                role="dialog"
                aria-label={effectiveRange ? 'Choose dates' : 'Choose a date'}
                className={resolvedPresets.length ? 'plus-date-popup plus-date-range-popup' : 'plus-date-popup'}
            >
                {resolvedPresets.length ? presetRangePopupContent : (
                    <>
                        <Calendar
                            size={24}
                            viewDate={viewDate}
                            onViewDateChange={setViewDate}
                            selected={effectiveRange ? undefined : picked}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                            minDate={minDate}
                            maxDate={effectiveMaxDate}
                            onPick={pick}
                        />
                        {hasValue && interactive && (
                            <div className="plus-listbox-footer">
                                <div className="plus-listbox-footer-actions">
                                    <Button
                                        appearance="subtle"
                                        spacing="compact"
                                        onClick={() => {
                                            clear();
                                            setOpen(false);
                                            inputRef.current?.focus();
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </AnchoredListboxSurface>
        </>
    );
};

DatePicker.propTypes = {
    /** Id of the input. Falls back to `name`, then to a generated id. */
    id: PropTypes.string,
    /** Form key of the input. */
    name: PropTypes.string,
    /** Defaults to MM/DD/YYYY, or two of them for a range. */
    placeholder: PropTypes.string,
    /** ISO `YYYY-MM-DD`; with `range`, `[start, end]`, either end may be null. */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    /** Initial value when uncontrolled. */
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    /** Pick a first and a last day. */
    range: PropTypes.bool,
    /** Show preset ranges (`All time`, `Today`, `Last 7 days`, `Last 30 days`) beside the range calendar with Clear and Apply actions. */
    presets: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            label: PropTypes.string.isRequired,
            value: PropTypes.arrayOf(PropTypes.string),
            range: PropTypes.func,
        })),
    ]),
    /** Filter trigger label (such as `"Created"`). When set, opens the preset range popup from a `FilterButton`. It does not name a plain field: use `aria-label`, or a visible label with `htmlFor`. */
    label: PropTypes.string,
    /** Custom trigger element or `({ isOpen, value, summary }) => node` for the filter popup. */
    trigger: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** Popup placement relative to a filter trigger. */
    placement: PropTypes.oneOf(['bottom-start', 'bottom-end']),
    /** Reference date used for relative presets and `lookBack`; defaults to today. */
    today: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    /** Disable days after `today`. Defaults to true when `presets` or a filter `label` is set. */
    lookBack: PropTypes.bool,
    /** `default` is 40 (32 on a filter trigger); `compact` is 32 (24 on a filter trigger). */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Disables the input and the calendar. */
    isDisabled: PropTypes.bool,
    /** Shows the date without letting the user change it or open the calendar. */
    isReadOnly: PropTypes.bool,
    /** Draws the field invalid; a typed date outside the allowed span does too. */
    isInvalid: PropTypes.bool,
    /** Draws the field valid, as a form does once a date is accepted. */
    isValid: PropTypes.bool,
    /** The earliest day that can be picked or typed. */
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    /** The latest day that can be picked or typed. */
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    /** Which edge of the field the calendar lines up with. */
    calendarAlign: PropTypes.oneOf(['left', 'center', 'right']),
    /** Where a filter popup portals to; defaults to the page overlay layer. */
    container: PropTypes.object,
    /** `(iso)`, or `([start, end])` with `range`; '' or nulls when cleared. */
    onChange: PropTypes.func,
    /** Called with the focus event when the input gains focus. */
    onFocus: PropTypes.func,
    /** Called with the blur event when the input loses focus, after any typed text has been checked. */
    onBlur: PropTypes.func,
    /** Extra class on the field frame, beside `plus-date-picker`. */
    className: PropTypes.string,
    /** Inline style on the field frame. */
    style: PropTypes.object,
};

export default DatePicker;
