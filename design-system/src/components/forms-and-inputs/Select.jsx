import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Badge from '@/components/status-and-loading/Badge';
import Tag from '@/components/status-and-loading/Tag';
import TagGroup from '@/components/status-and-loading/TagGroup';
import Field, { FieldCaption, FieldLabel, FieldStack, fieldDescription } from './_internal/Field';
import Listbox from './_internal/Listbox';
import useFieldId from './useFieldId';
import './Select.scss';

/** Past this many options the list is search-first, and "Select all" hides. */
export const SEARCH_FIRST_ABOVE = 50;
/** `loadOptions` asks for this many options at a time. */
const PAGE_SIZE = 50;
/** How close to the bottom of the list, in px, the next page is asked for. */
const LOAD_MORE_WITHIN = 48;

/** The option's words as a string, for filtering and the input; a node label falls back to `text`. */
const labelOf = (option) => (typeof option.label === 'string' ? option.label : option.text ?? String(option.value));
const isEmpty = (value) => value === undefined || value === null || value === ''
    || (Array.isArray(value) && value.length === 0);

/**
 * Select — pick one value, or several, from a list, on `_Field` with the
 * internal `Listbox` under it.
 *
 * - **The field is the combobox.** Focus stays in it, and the highlighted row is
 *   its `aria-activedescendant`. A searchable field is a text input: typing in
 *   it filters the list. A plain one is a select-only combobox.
 * - **Values are ids; options are objects.** `value` is an option's `value` (an
 *   array in multi mode), controlled or not.
 * - **Multi mode** shows Tags in a TagGroup (`displayMode="tags"`), which
 *   collapse into "+n" without focus. `displayMode="badges"` keeps the Badge
 *   chips for screens that still draw them.
 * - **Trailing** holds the clear × (not a tab stop; Delete does the same) and
 *   the caret.
 */
const Select = ({
    id,
    name,
    label,
    caption,
    mode = 'single',
    options = [],
    value,
    defaultValue,
    placeholder = 'Select...',
    searchable = false,
    creatable = false,
    onCreate,
    open,
    defaultOpen = false,
    onOpenChange,
    defaultSearchTerm = '',
    displayMode = 'tags',
    lineWrap = true,
    truncate = false,
    size = 'medium',
    disabled = false,
    readonly = false,
    readOnly,
    required = false,
    invalid = false,
    commitOnClose = false,
    clearable,
    selectAll = false,
    maxSelections,
    dependsOn,
    loading = false,
    loadOptions,
    recent,
    suggested,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const multi = mode === 'multi';
    // A required single pick cannot be emptied; multi and optional fields can.
    const canClear = clearable ?? (multi || !required);
    const fieldId = useFieldId(id);
    const listId = `${fieldId}-listbox`;
    const labelId = label ? `${fieldId}-label` : undefined;
    const isReadOnly = readOnly !== undefined ? Boolean(readOnly) : Boolean(readonly);

    /* ---------- dependent field ---------- */
    const waiting = Boolean(dependsOn) && isEmpty(dependsOn.value);
    const isDisabled = disabled || waiting;
    const live = !isDisabled && !isReadOnly;

    /* ---------- value ---------- */
    const empty = multi ? [] : '';
    const [internalValue, setInternalValue] = useState(defaultValue ?? empty);
    const controlled = value !== undefined;
    const committed = controlled ? value : internalValue;
    const committedList = multi ? (Array.isArray(committed) ? committed : []) : committed;

    /** Picks made while open, for `commitOnClose`. `null` when not staging. */
    const [draft, setDraft] = useState(null);
    const current = draft ?? committedList;

    const commit = (next) => {
        if (!controlled) setInternalValue(next);
        if (onChange) onChange(next);
    };

    /* ---------- open, filter ---------- */
    // A controlled `open` is the parent's: Select asks through `onOpenChange`.
    const openControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(Boolean(defaultOpen));
    const isOpen = openControlled ? Boolean(open) : internalOpen;
    const shown = isOpen && live;
    const [query, setQuery] = useState(defaultSearchTerm || null);
    const filter = query ?? '';
    const [focused, setFocused] = useState(false);

    useEffect(() => { setQuery(defaultSearchTerm || null); }, [defaultSearchTerm]);

    /* ---------- options: given, created, loaded ---------- */
    const [created, setCreated] = useState([]);
    const [loaded, setLoaded] = useState({ query: null, options: [], total: 0, busy: false });
    const known = useRef(new Map());
    const all = useMemo(
        () => [...(loadOptions ? loaded.options : options), ...created],
        [loadOptions, loaded.options, options, created]
    );
    all.forEach((option) => known.current.set(option.value, option));
    const optionFor = (optionValue) => known.current.get(optionValue);
    const textFor = (optionValue) => {
        const option = optionFor(optionValue);
        return option ? labelOf(option) : String(optionValue);
    };

    const searchFirst = !loadOptions && all.length > SEARCH_FIRST_ABOVE;
    const typeable = searchable || creatable || searchFirst || Boolean(loadOptions);

    /* ---------- loadOptions ---------- */
    const request = useRef(0);
    // Held in a ref, so an inline `loadOptions` does not refetch on every render.
    const loadOptionsRef = useRef(loadOptions);
    loadOptionsRef.current = loadOptions;
    const hasLoader = Boolean(loadOptions);
    const load = useCallback((text, offset) => {
        const ticket = ++request.current;
        setLoaded((prev) => ({ ...prev, busy: true, ...(offset === 0 ? { query: text } : {}) }));
        Promise.resolve(loadOptionsRef.current(text, { offset, limit: PAGE_SIZE })).then((result) => {
            if (ticket !== request.current) return;
            setLoaded((prev) => ({
                query: text,
                options: offset === 0 ? result.options : [...prev.options, ...result.options],
                total: result.total ?? result.options.length,
                busy: false,
            }));
        }, () => {
            if (ticket === request.current) setLoaded((prev) => ({ ...prev, busy: false }));
        });
    }, []);

    useEffect(() => {
        if (shown && hasLoader) load(filter, 0);
    }, [shown, filter, hasLoader, load]);

    const more = loadOptions && loaded.options.length < loaded.total;
    const loadMore = () => {
        if (more && !loaded.busy) load(filter, loaded.options.length);
    };

    /* ---------- what the list shows ---------- */
    const atLimit = multi && maxSelections !== undefined && current.length >= maxSelections;
    const limited = (option) => (atLimit && !current.includes(option.value) ? { ...option, disabled: true } : option);

    let listOptions = all.map(limited);
    let listFilter = filter;
    if (searchFirst && !filter) {
        const recentIds = recent || [];
        const suggestedIds = (suggested || []).filter((v) => !recentIds.includes(v));
        const pick = (ids, group) => ids.map(optionFor).filter(Boolean).map((option) => ({ ...limited(option), group }));
        listOptions = [...pick(recentIds, 'Recent'), ...pick(suggestedIds, 'Suggested')];
        listFilter = '';
    }

    const matches = useMemo(() => {
        const q = filter.trim().toLowerCase();
        return q ? all.filter((option) => labelOf(option).toLowerCase().includes(q)) : all;
    }, [all, filter]);
    const selectable = matches.filter((option) => !option.disabled);
    const offerSelectAll = multi && selectAll && live && maxSelections === undefined
        && selectable.length > 0 && selectable.length <= SEARCH_FIRST_ABOVE
        && !(searchFirst && !filter);

    /* ---------- open and close ---------- */
    const controlRef = useRef(null);
    const fieldRef = useRef(null);
    const listRef = useRef(null);
    const [activeId, setActiveId] = useState();

    /** What opening does to the field, whoever opened it. */
    const startOpen = () => {
        if (multi && commitOnClose) setDraft(committedList);
    };

    /** What closing does: the typed text goes, and staged picks land. */
    const finishClose = () => {
        setQuery(null);
        if (draft !== null) {
            const changed = draft.length !== committedList.length || draft.some((v) => !committedList.includes(v));
            setDraft(null);
            if (changed) commit(draft);
        }
    };

    const openList = () => {
        if (!live || isOpen) return;
        if (onOpenChange) onOpenChange(true);
        if (openControlled) return;
        startOpen();
        setInternalOpen(true);
    };

    const closeList = () => {
        if (!isOpen) return;
        if (onOpenChange) onOpenChange(false);
        if (openControlled) return;
        setInternalOpen(false);
        finishClose();
    };

    // A controlled `open` that changes runs the same opening and closing work.
    const lastOpen = useRef(isOpen);
    useEffect(() => {
        const was = lastOpen.current;
        lastOpen.current = isOpen;
        if (!openControlled || was === isOpen) return;
        if (isOpen) startOpen(); else finishClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    /* ---------- choosing ---------- */
    const choose = (next) => {
        if (multi && commitOnClose && isOpen) setDraft(next);
        else commit(next);
        if (!multi) closeList();
        else if (filter) setQuery(null);
    };

    const create = (text) => {
        const option = { value: text, label: text };
        setCreated((prev) => [...prev, option]);
        known.current.set(text, option);
        if (onCreate) onCreate(text);
        choose(multi ? [...current, text] : text);
    };

    const removeValue = (optionValue) => {
        const next = current.filter((v) => v !== optionValue);
        if (draft !== null) setDraft(next);
        else commit(next);
    };

    const clear = () => {
        setQuery(null);
        // Staging for `commitOnClose`: the clear lands with the rest, on close.
        if (draft !== null) setDraft([]);
        else commit(empty);
    };

    const toggleAll = () => {
        const ids = selectable.map((option) => option.value);
        const allPicked = ids.every((v) => current.includes(v));
        const next = allPicked
            ? current.filter((v) => !ids.includes(v))
            : [...current, ...ids.filter((v) => !current.includes(v))];
        if (multi && commitOnClose) setDraft(next);
        else commit(next);
    };

    /* ---------- the parent changed: the child's value no longer applies ---------- */
    const parentValue = dependsOn ? dependsOn.value : undefined;
    const lastParent = useRef(parentValue);
    useEffect(() => {
        const prev = lastParent.current;
        lastParent.current = parentValue;
        const same = Array.isArray(prev) && Array.isArray(parentValue)
            ? prev.join('\u0000') === parentValue.join('\u0000')
            : prev === parentValue;
        if (!dependsOn || same) return;
        setDraft(null);
        if (!isEmpty(committed)) commit(empty);
        // Only a change of parent clears; the child's own value is not a cause.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentValue]);

    /* ---------- loadOptions: the next page on scroll ---------- */
    const loadMoreRef = useRef(loadMore);
    loadMoreRef.current = loadMore;
    useEffect(() => {
        if (!shown || !hasLoader) return undefined;
        const body = document.getElementById(listId)?.closest('.plus-listbox-body');
        if (!body) return undefined;
        const onScroll = () => {
            if (body.scrollHeight - body.scrollTop - body.clientHeight < LOAD_MORE_WITHIN) loadMoreRef.current();
        };
        body.addEventListener('scroll', onScroll);
        return () => body.removeEventListener('scroll', onScroll);
    }, [shown, hasLoader, listId]);

    /* ---------- events ---------- */
    const hasValue = !isEmpty(current);
    const clearName = `Clear ${typeof label === 'string' ? label : (props['aria-label'] || 'selection')}`;

    const handleKeyDown = (event) => {
        if (props.onKeyDown) props.onKeyDown(event);
        if (event.defaultPrevented || isDisabled) return;
        const typing = typeable && filter;
        if (!isOpen) {
            if (!live) return;
            if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) || (event.key === ' ' && !typeable)) {
                event.preventDefault();
                openList();
                return;
            }
            if (event.key === 'Delete' && canClear && hasValue && !typing) {
                event.preventDefault();
                clear();
            }
            return;
        }
        if (event.key === 'Tab') {
            closeList();
            return;
        }
        if (event.key === 'Backspace' && multi && !filter && current.length) {
            removeValue(current[current.length - 1]);
            return;
        }
        if (event.key === 'Delete' && canClear && hasValue && !typing) {
            event.preventDefault();
            clear();
            return;
        }
        if (listRef.current) listRef.current.handleKeyDown(event);
    };

    const handleFieldClick = (event) => {
        if (!live) return;
        const target = event.target;
        if (target.closest('.plus-select-caret')) {
            if (isOpen) closeList(); else openList();
            controlRef.current?.focus();
            return;
        }
        // A Tag's ×, the clear button and "+n" are their own buttons.
        if (target.closest('button')) return;
        if (!isOpen) openList();
        else if (!typeable) closeList();
        controlRef.current?.focus();
    };

    const insideWidget = (node) => Boolean(node) && (
        fieldRef.current?.closest('.plus-select-wrapper')?.contains(node)
        || document.getElementById(listId)?.closest('.plus-listbox')?.contains(node)
    );

    const handleFocus = (event) => {
        if (insideWidget(event.relatedTarget)) return;
        setFocused(true);
        if (onFocus) onFocus(event);
    };

    const handleBlur = (event) => {
        if (insideWidget(event.relatedTarget)) return;
        setFocused(false);
        closeList();
        if (onBlur) onBlur(event);
    };

    /* ---------- the caption ---------- */
    let message = caption;
    if (waiting) message = `Choose ${dependsOn.label || 'the field above'} first`;
    else if (atLimit && !caption) message = `You can pick up to ${maxSelections}`;
    const { messageId, describedBy } = fieldDescription({
        fieldId,
        message,
        describedBy: props['aria-describedby'],
    });

    /* ---------- the field's content ---------- */
    const singleText = !multi && hasValue ? textFor(current) : '';
    const comboName = label || props['aria-label'] || props['aria-labelledby'] ? undefined : placeholder;

    const comboProps = {
        ...props,
        id: fieldId,
        ref: controlRef,
        role: 'combobox',
        'aria-expanded': shown,
        'aria-haspopup': 'listbox',
        'aria-controls': shown ? listId : undefined,
        'aria-activedescendant': shown ? activeId : undefined,
        'aria-labelledby': props['aria-labelledby'] || labelId,
        'aria-label': props['aria-label'] || comboName,
        'aria-required': required || undefined,
        'aria-invalid': invalid || undefined,
        'aria-readonly': isReadOnly || undefined,
        'aria-describedby': describedBy,
        onKeyDown: handleKeyDown,
    };

    let control;
    if (typeable) {
        const typed = query !== null;
        control = (
            <input
                {...comboProps}
                type="text"
                className="plus-field__control plus-select-input"
                autoComplete="off"
                aria-autocomplete="list"
                disabled={isDisabled}
                aria-disabled={isDisabled || undefined}
                readOnly={isReadOnly}
                value={multi ? filter : (typed ? query : singleText)}
                placeholder={multi ? (hasValue ? '' : placeholder) : (singleText || placeholder)}
                onChange={(event) => {
                    setQuery(event.target.value);
                    openList();
                }}
                onClick={(event) => { if (!typed && !multi) event.currentTarget.select(); }}
            />
        );
    } else {
        control = (
            <div
                {...comboProps}
                className="plus-select-combobox"
                tabIndex={isDisabled ? undefined : 0}
                aria-disabled={isDisabled || undefined}
            >
                {!multi || displayMode === 'text' ? (
                    <span className={`plus-select-text${hasValue ? '' : ' plus-select-placeholder'}`}>
                        {hasValue ? (multi ? current.map(textFor).join(', ') : singleText) : placeholder}
                    </span>
                ) : (
                    !hasValue && <span className="plus-select-text plus-select-placeholder">{placeholder}</span>
                )}
            </div>
        );
    }

    let chips = null;
    if (multi && hasValue && displayMode === 'tags') {
        chips = (
            <TagGroup
                className="plus-select-tags"
                label={typeof label === 'string' ? label : props['aria-label']}
                overflow={focused || shown ? 'wrap' : 'collapse'}
                disabled={isDisabled}
                onOverflowClick={live ? () => { openList(); controlRef.current?.focus(); } : undefined}
            >
                {current.map((v) => (
                    <Tag
                        key={v}
                        color="grey"
                        behavior={live ? 'removable' : 'read-only'}
                        onRemove={live ? () => removeValue(v) : undefined}
                    >
                        {textFor(v)}
                    </Tag>
                ))}
            </TagGroup>
        );
    } else if (multi && hasValue && displayMode === 'badges') {
        chips = (
            <div className="plus-select-badges">
                {current.map((v) => (
                    <Badge
                        key={v}
                        text={textFor(v)}
                        dismissible={live}
                        onDismiss={(event) => {
                            if (event && event.stopPropagation) event.stopPropagation();
                            removeValue(v);
                        }}
                        size="b2"
                        style="secondary"
                    />
                ))}
            </div>
        );
    }

    const trailing = (
        <>
            {canClear && hasValue && live && (
                <button
                    type="button"
                    className="plus-select-clear"
                    tabIndex={-1}
                    aria-label={clearName}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => { clear(); controlRef.current?.focus(); }}
                >
                    <i className="fa-solid fa-circle-xmark" aria-hidden="true" />
                </button>
            )}
            {!isReadOnly && (
                <i className={`fa-solid ${shown ? 'fa-caret-up' : 'fa-caret-down'} plus-select-caret`} aria-hidden="true" />
            )}
        </>
    );

    /* ---------- the list's header and footer ---------- */
    let header = null;
    if (offerSelectAll) {
        const allPicked = selectable.every((option) => current.includes(option.value));
        header = (
            <button type="button" className="plus-select-all" aria-pressed={allPicked} onClick={toggleAll}>
                <span aria-hidden="true" className={`plus-select-all-mark${allPicked ? ' is-checked' : ''}`}>
                    {allPicked && <i className="fa-solid fa-check" />}
                </span>
                Select all
            </button>
        );
    } else if (searchFirst && !filter) {
        header = <span className="plus-select-hint">{`Type to search ${all.length} options`}</span>;
    }

    let footer = null;
    if (atLimit) {
        footer = <Listbox.Message kind="limit">{`You can pick up to ${maxSelections}`}</Listbox.Message>;
    } else if (loadOptions && more) {
        footer = (
            <Listbox.Message kind={loaded.busy ? 'loading' : 'count'}>
                {loaded.busy ? 'Loading more…' : `Showing ${loaded.options.length} of ${loaded.total}`}
            </Listbox.Message>
        );
    }

    const listLoading = loading || (Boolean(loadOptions) && loaded.busy && loaded.options.length === 0);

    const wrapperClasses = [
        'plus-select-wrapper',
        `plus-select-${size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md'}`,
        multi ? 'plus-select-multi' : 'plus-select-single',
        typeable ? 'plus-select-typeable' : '',
        isDisabled ? 'plus-select-disabled' : '',
        isReadOnly ? 'plus-select-readonly' : '',
        shown ? 'plus-select-open' : '',
        lineWrap ? '' : 'plus-select-nowrap',
        truncate ? 'plus-select-truncate' : '',
        className,
    ].filter(Boolean).join(' ');

    // A field waiting on its parent fades only its box: the caption saying why stays readable.
    return (
        <FieldStack disabled={disabled} className={wrapperClasses} style={style}>
            {label && (
                <FieldLabel htmlFor={typeable ? fieldId : undefined} required={required}>
                    <span id={labelId}>{label}</span>
                </FieldLabel>
            )}
            <div className="plus-select-field" onFocus={handleFocus} onBlur={handleBlur}>
                <Field
                    ref={fieldRef}
                    size={size}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    invalid={invalid}
                    trailing={trailing}
                    onClick={handleFieldClick}
                >
                    {chips}
                    {control}
                </Field>
                <Listbox
                    ref={listRef}
                    id={listId}
                    aria-label={typeof label === 'string' ? label : (props['aria-label'] || placeholder)}
                    open={shown}
                    anchorRef={fieldRef}
                    mode={multi ? 'multi' : 'single'}
                    options={listOptions}
                    value={multi ? current : (hasValue ? current : null)}
                    onChange={(next) => choose(next)}
                    filter={listFilter}
                    onFilterChange={(text) => setQuery(text || null)}
                    onCreate={creatable ? create : undefined}
                    onClose={(reason) => {
                        closeList();
                        if (reason === 'escape') controlRef.current?.focus();
                    }}
                    onActiveChange={setActiveId}
                    header={header}
                    footer={footer}
                    loading={listLoading}
                    emptyMessage={searchFirst && !filter ? 'Type to search' : 'No results'}
                />
            </div>
            {name && (multi ? committedList : (isEmpty(committedList) ? [] : [committedList])).map((v) => (
                <input key={v} type="hidden" name={name} value={v} disabled={isDisabled} />
            ))}
            <FieldCaption messageId={messageId} message={message} tone={invalid ? 'invalid' : 'help'} />
        </FieldStack>
    );
};

const valueType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

Select.propTypes = {
    id: PropTypes.string,
    /** Submitted with a form through hidden inputs, one per value. */
    name: PropTypes.string,
    /** The visible label above the field. Without one, pass `aria-label` or `aria-labelledby`. */
    label: PropTypes.node,
    /** Help under the field. With `invalid`, it is the error and is announced. */
    caption: PropTypes.node,
    mode: PropTypes.oneOf(['single', 'multi']),
    /** Objects: `value` is the id, `label` (or `text`) what is shown. `group` puts consecutive options under a heading. */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: valueType.isRequired,
        label: PropTypes.node,
        text: PropTypes.string,
        description: PropTypes.node,
        disabled: PropTypes.bool,
        group: PropTypes.string,
    })),
    /** The picked id, or ids in multi mode. Pass it to control the field. */
    value: PropTypes.oneOfType([valueType, PropTypes.arrayOf(valueType)]),
    defaultValue: PropTypes.oneOfType([valueType, PropTypes.arrayOf(valueType)]),
    placeholder: PropTypes.string,
    /** Typing in the field filters the list. */
    searchable: PropTypes.bool,
    /** Offers "Create *text*" when nothing matches exactly, ignoring case. Implies typing. */
    creatable: PropTypes.bool,
    /** Called with the text of a created option, which is then picked. */
    onCreate: PropTypes.func,
    /**
     * Holds the list open or shut. Controlled: Escape, a press outside and a
     * pick ask through `onOpenChange`, and the list stays as it is until the
     * parent changes `open`.
     */
    open: PropTypes.bool,
    defaultOpen: PropTypes.bool,
    /** `(open)`: the list asks to open or close. */
    onOpenChange: PropTypes.func,
    defaultSearchTerm: PropTypes.string,
    /** Multi mode: `tags` (Tag chips), `badges` (the older Badge chips) or `text` (comma-separated). */
    displayMode: PropTypes.oneOf(['tags', 'badges', 'text']),
    /** Badges only: wrap onto more lines. */
    lineWrap: PropTypes.bool,
    /** Badges only: clip the row with a fade. */
    truncate: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    /** Shows the value, stays focusable, and cannot be changed. */
    readOnly: PropTypes.bool,
    /** @deprecated Prefer `readOnly` */
    readonly: PropTypes.bool,
    /** Shows an asterisk on the label and sets `aria-required`. */
    required: PropTypes.bool,
    /** Draws the error border; `caption` becomes the announced error. */
    invalid: PropTypes.bool,
    /** Multi mode: `onChange` fires once when the list closes, as a filter bar wants, not on each pick. */
    commitOnClose: PropTypes.bool,
    /**
     * Shows the clear × (Figma `_Field Clear`), and lets Delete empty the field.
     * Defaults to true in multi mode and to `!required` in single mode; a sort
     * passes `false`.
     */
    clearable: PropTypes.bool,
    /** Multi mode: a "Select all" button over the list, hidden past 50 matches. */
    selectAll: PropTypes.bool,
    /** Multi mode: the most values; past it the other rows are disabled and the list says why. */
    maxSelections: PropTypes.number,
    /**
     * The field this one depends on: `{ value, label }`. Until `value` is set
     * the field is disabled with "Choose {label} first"; when it changes, this
     * field clears.
     */
    dependsOn: PropTypes.shape({
        value: PropTypes.oneOfType([valueType, PropTypes.arrayOf(valueType)]),
        label: PropTypes.string,
    }),
    /** The options are on their way: the list shows a loading row. */
    loading: PropTypes.bool,
    /**
     * `(text, { offset, limit })` → `Promise<{ options, total }>`. Options load
     * as the list opens, as you type and as you scroll, 50 at a time.
     */
    loadOptions: PropTypes.func,
    /** Ids shown under "Recent" before typing, in a list of more than 50. */
    recent: PropTypes.arrayOf(valueType),
    /** Ids shown under "Suggested" before typing, in a list of more than 50. */
    suggested: PropTypes.arrayOf(valueType),
    /** `(next)`: an id, or an array of ids in multi mode. */
    onChange: PropTypes.func,
    /** Focus entering the field from outside it. */
    onFocus: PropTypes.func,
    /** Focus leaving the field and its list. */
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Select;
