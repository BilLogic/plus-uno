import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import FieldBox from '../_internal/FieldBox';
import { FieldCaption, FieldLabel, FieldFrame, fieldDescription, toneProps } from '../_internal/FieldFrame';
import Listbox from '../_internal/Listbox';
import SelectChips from '../_internal/SelectChips';
import { SEARCH_FIRST_ABOVE, selectList } from '../_internal/selectList';
import useOpenState from '../_internal/useOpenState';
import useOptionSource from '../_internal/useOptionSource';
import useStagedValue from '../_internal/useStagedValue';
import useFieldId from '../useFieldId';
import Icon from '../../images-and-icons/Icon';
import './Select.scss';

export { SEARCH_FIRST_ABOVE };

export const SELECT_SPACINGS = ['default', 'compact'];

const LOAD_FAILED = "Couldn't load options";

const isEmpty = (value) => value === undefined || value === null || value === ''
    || (Array.isArray(value) && value.length === 0);

/**
 * Select — pick one value, or several, from a list, on `_Field` with the
 * internal `Listbox` under it.
 *
 * - **The field is the combobox.** Focus stays in it, and the highlighted row is
 *   its `aria-activedescendant`. The field is a text input: typing in it
 *   filters the list. With `isSearchable={false}` it is a select-only combobox.
 * - **Values are ids; options are objects.** `value` is an option's `value` (an
 *   array with `isMulti`), controlled or not.
 * - **`isMulti`** shows Tags in a TagGroup (`displayMode="tags"`), which
 *   collapse into "+n" without focus.
 * - **Trailing** holds the clear × (not a tab stop; Delete does the same) and
 *   the caret.
 */
const Select = ({
    id,
    name,
    label,
    caption,
    isMulti = false,
    options = [],
    value,
    defaultValue,
    placeholder = 'Select...',
    isSearchable = true,
    isCreatable = false,
    onCreate,
    createOption,
    open,
    defaultOpen = false,
    onOpenChange,
    defaultSearchTerm = '',
    displayMode = 'tags',
    lineWrap = true,
    truncate = false,
    marker = 'check',
    spacing = 'default',
    isDisabled = false,
    isReadOnly = false,
    isRequired = false,
    info,
    isInvalid = false,
    errorMessage,
    isValid = false,
    successMessage,
    commitOnClose = false,
    clearable,
    selectAll = false,
    maxSelections,
    dependsOn,
    isLoading = false,
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
    const multi = isMulti;
    // A required single pick cannot be emptied; multi and optional fields can.
    const canClear = clearable ?? (multi || !isRequired);
    const fieldId = useFieldId(id);
    const listId = `${fieldId}-listbox`;
    const labelId = label ? `${fieldId}-label` : undefined;

    /* ---------- dependent field ---------- */
    const waiting = Boolean(dependsOn) && isEmpty(dependsOn.value);
    const disabled = isDisabled || waiting;
    const live = !disabled && !isReadOnly;

    /* ---------- value, staged for `commitOnClose` ---------- */
    const picked = useStagedValue({ multi, value, defaultValue, onChange, staged: multi && commitOnClose });
    const { empty, committed, committedList, current, commit } = picked;

    /* ---------- open, filter ---------- */
    const [query, setQuery] = useState(defaultSearchTerm || null);
    const filter = query ?? '';
    const [focused, setFocused] = useState(false);

    useEffect(() => { setQuery(defaultSearchTerm || null); }, [defaultSearchTerm]);

    // Closing, whoever closed it: the typed text goes, and staged picks land.
    const { isOpen, openList, closeList } = useOpenState({
        open,
        defaultOpen,
        onOpenChange,
        enabled: live,
        onOpen: picked.beginStaging,
        onClose: () => {
            setQuery(null);
            picked.endStaging();
        },
    });
    const shown = isOpen && live;

    /* ---------- options: given, created, loaded ---------- */
    const source = useOptionSource({ options, loadOptions, filter, shown, listId });
    const { all, optionFor, textFor, paging } = source;

    /* ---------- what the list shows ---------- */
    const {
        searchFirst, waitingForSearch, atLimit, listOptions, listFilter, selectable, offerSelectAll,
    } = selectList({
        all,
        filter,
        current,
        multi,
        maxSelections,
        hasLoader: Boolean(loadOptions),
        recent,
        suggested,
        optionFor,
        selectAll,
        live,
    });
    // A read-only value is text to read, not an input to type in: it wraps and is never clipped.
    const typeable = !isReadOnly && (isSearchable || isCreatable || searchFirst || Boolean(loadOptions));

    const controlRef = useRef(null);
    const fieldRef = useRef(null);
    const listRef = useRef(null);
    const [activeId, setActiveId] = useState();

    /* ---------- choosing ---------- */
    const choose = (next) => {
        if (multi && commitOnClose && isOpen) picked.stage(next);
        else commit(next);
        if (!multi) closeList();
        else if (filter) setQuery(null);
    };

    const create = (text) => {
        if (onCreate) onCreate(text);
        // A host can turn the typed text into its own option (a time picker
        // reads "1430" as 2:30 PM), or refuse it with null.
        const option = createOption ? createOption(text) : { value: text, label: text };
        if (!option) return;
        if (!source.optionFor(option.value)) source.addCreated(option);
        choose(multi ? [...current, option.value] : option.value);
    };

    const removeValue = (optionValue) => {
        picked.change(current.filter((v) => v !== optionValue));
    };

    const clear = () => {
        setQuery(null);
        // Staging for `commitOnClose`: the clear lands with the rest, on close.
        picked.change(empty);
    };

    const toggleAll = () => {
        const ids = selectable.map((option) => option.value);
        const allPicked = ids.every((v) => current.includes(v));
        const next = allPicked
            ? current.filter((v) => !ids.includes(v))
            : [...current, ...ids.filter((v) => !current.includes(v))];
        if (multi && commitOnClose) picked.stage(next);
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
        picked.dropStaging();
        if (!isEmpty(committed)) commit(empty);
        // Only a change of parent clears; the child's own value is not a cause.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentValue]);

    /* ---------- events ---------- */
    const hasValue = !isEmpty(current);
    const clearName = `Clear ${typeof label === 'string' ? label : (props['aria-label'] || 'selection')}`;

    const handleKeyDown = (event) => {
        if (props.onKeyDown) props.onKeyDown(event);
        if (event.defaultPrevented || disabled) return;
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
        if (event.key === 'Enter' && paging.firstFailed) {
            event.preventDefault();
            paging.retry();
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
    const tone = isInvalid ? 'invalid' : (isValid ? 'success' : 'help');
    const tones = toneProps(tone);
    let message = (isInvalid && errorMessage) || (isValid && successMessage) || caption;
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
        'aria-required': isRequired || undefined,
        ...tones.control,
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
                disabled={disabled}
                aria-disabled={disabled || undefined}
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
                tabIndex={disabled ? undefined : 0}
                aria-disabled={disabled || undefined}
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

    const chips = multi && hasValue ? (
        <SelectChips
            displayMode={displayMode}
            values={current}
            textFor={textFor}
            onRemove={removeValue}
            live={live}
            disabled={disabled}
            label={typeof label === 'string' ? label : props['aria-label']}
            collapsed={!(focused || shown || isReadOnly)}
            onOverflowClick={() => { openList(); controlRef.current?.focus(); }}
        />
    ) : null;

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
                    <Icon name="circle-xmark" />
                </button>
            )}
            {!isReadOnly && (
                <Icon name={shown ? 'caret-up' : 'caret-down'} className="plus-select-caret" />
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
                    {allPicked && <Icon name="check" />}
                </span>
                Select all
            </button>
        );
    } else if (waitingForSearch) {
        header = <span className="plus-select-hint">{`Type to search ${all.length} options`}</span>;
    }

    let footer = null;
    if (atLimit) {
        footer = <Listbox.Message kind="limit">{`You can pick up to ${maxSelections}`}</Listbox.Message>;
    } else if (paging.failed && !paging.firstFailed) {
        footer = <Listbox.Message kind="error" onRetry={paging.retry}>{LOAD_FAILED}</Listbox.Message>;
    } else if (paging.more) {
        footer = (
            <Listbox.Message kind={paging.busy ? 'loading' : 'count'}>
                {paging.busy ? 'Loading more…' : `Showing ${paging.count} of ${paging.total}`}
            </Listbox.Message>
        );
    }

    const listLoading = isLoading || paging.firstPage;
    // The first page failing leaves the list with nothing to show but the way to try again.
    const listError = paging.firstFailed ? LOAD_FAILED : undefined;

    const wrapperClasses = [
        'plus-select-wrapper',
        multi ? 'plus-select-multi' : 'plus-select-single',
        typeable ? 'plus-select-typeable' : '',
        disabled ? 'plus-select-disabled' : '',
        isReadOnly ? 'plus-select-readonly' : '',
        shown ? 'plus-select-open' : '',
        // A read-only value is shown whole: it wraps and is never clipped.
        lineWrap || isReadOnly ? '' : 'plus-select-nowrap',
        truncate && !isReadOnly ? 'plus-select-truncate' : '',
        className,
    ].filter(Boolean).join(' ');

    // A field waiting on its parent fades only its box: the caption saying why stays readable.
    return (
        <FieldFrame disabled={isDisabled} invalid={tone === 'invalid'} className={wrapperClasses} style={style}>
            {label && (
                <FieldLabel htmlFor={typeable ? fieldId : undefined} required={isRequired} info={info} name={typeof label === 'string' ? label : undefined}>
                    <span id={labelId}>{label}</span>
                </FieldLabel>
            )}
            <div className="plus-select-field" onFocus={handleFocus} onBlur={handleBlur}>
                <FieldBox
                    ref={fieldRef}
                    spacing={spacing}
                    grow={(multi && lineWrap) || isReadOnly}
                    disabled={disabled}
                    readOnly={isReadOnly}
                    {...tones.field}
                    elemAfter={trailing}
                    onClick={handleFieldClick}
                >
                    {chips}
                    {control}
                </FieldBox>
                <Listbox
                    ref={listRef}
                    id={listId}
                    aria-label={typeof label === 'string' ? label : (props['aria-label'] || placeholder)}
                    open={shown}
                    anchorRef={fieldRef}
                    mode={multi ? 'multi' : 'single'}
                    marker={marker}
                    spacing={spacing}
                    options={listOptions}
                    value={multi ? current : (hasValue ? current : null)}
                    onChange={(next) => choose(next)}
                    filter={listFilter}
                    onFilterChange={(text) => setQuery(text || null)}
                    onCreate={isCreatable ? create : undefined}
                    onClose={(reason) => {
                        closeList();
                        if (reason === 'escape') controlRef.current?.focus();
                    }}
                    onActiveChange={setActiveId}
                    header={header}
                    footer={footer}
                    loading={listLoading}
                    error={listError}
                    onRetry={paging.retry}
                    reveal={Boolean(loadOptions)}
                    emptyMessage={waitingForSearch ? 'Type to search' : 'No results'}
                />
            </div>
            {name && (multi ? committedList : (isEmpty(committedList) ? [] : [committedList])).map((v) => (
                <input key={v} type="hidden" name={name} value={v} disabled={disabled} />
            ))}
            <FieldCaption messageId={messageId} message={message} tone={tone} />
        </FieldFrame>
    );
};


const valueType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

Select.propTypes = {
    /** The `id` of the combobox control; the label and the list ids are built from it. Generated when omitted. */
    id: PropTypes.string,
    /** Submitted with a form through hidden inputs, one per value. */
    name: PropTypes.string,
    /** The visible label above the field. Without one, pass `aria-label` or `aria-labelledby`. */
    label: PropTypes.node,
    /** Help under the field. With `isInvalid`, `errorMessage` takes its place and is announced. */
    caption: PropTypes.node,
    /** Several values, shown as Tags in the field and checkboxes in the list. */
    isMulti: PropTypes.bool,
    /** Objects: `value` is the id, `label` (or `text`) what is shown. `group` puts consecutive options under a heading. */
    options: PropTypes.arrayOf(PropTypes.shape({
        value: valueType.isRequired,
        label: PropTypes.node,
        text: PropTypes.string,
        description: PropTypes.node,
        disabled: PropTypes.bool,
        group: PropTypes.string,
    })),
    /** The picked id, or ids with `isMulti`. Pass it to control the field. */
    value: PropTypes.oneOfType([valueType, PropTypes.arrayOf(valueType)]),
    /** The picked id, or ids with `isMulti`, to start with when the field is uncontrolled. */
    defaultValue: PropTypes.oneOfType([valueType, PropTypes.arrayOf(valueType)]),
    /** The text shown when nothing is picked. It names the field when there is no label. */
    placeholder: PropTypes.string,
    /** Typing in the field filters the list. On by default; pass `false` for a short list, such as a filter menu's. */
    isSearchable: PropTypes.bool,
    /** Offers "Create *text*" when nothing matches exactly, ignoring case. Implies typing. */
    isCreatable: PropTypes.bool,
    /** Called with the text of a created option, which is then picked. */
    onCreate: PropTypes.func,
    /** `(text)` → the option a typed text creates, `{ value, label }`, or null to create nothing. Defaults to the text itself. */
    createOption: PropTypes.func,
    /**
     * Holds the list open or shut. Controlled: Escape, a press outside and a
     * pick ask through `onOpenChange`, and the list stays as it is until the
     * parent changes `open`.
     */
    open: PropTypes.bool,
    /** Whether the list starts open, when `open` is not controlling it. */
    defaultOpen: PropTypes.bool,
    /** `(open)`: the list asks to open or close. */
    onOpenChange: PropTypes.func,
    /** The text the search input starts with, so the list opens already filtered. Used by a searchable field. */
    defaultSearchTerm: PropTypes.string,
    /** With `isMulti`: `tags` (Tag chips) or `text` (comma-separated). */
    displayMode: PropTypes.oneOf(['tags', 'text']),
    /** `text` display mode only: wrap onto more lines. */
    lineWrap: PropTypes.bool,
    /** `text` display mode only: clip the row with a fade. */
    truncate: PropTypes.bool,
    /** `default` draws 40 and `compact` draws 32. */
    spacing: PropTypes.oneOf(SELECT_SPACINGS),
    /** Dims the field and blocks opening and changing it. */
    isDisabled: PropTypes.bool,
    /** Shows the value, stays focusable, and cannot be changed. */
    isReadOnly: PropTypes.bool,
    /** Shows an asterisk on the label and sets `aria-required`. */
    isRequired: PropTypes.bool,
    /** Text for the info tooltip beside the label. */
    info: PropTypes.node,
    /** Draws the error border, sets `aria-invalid`, and `errorMessage` becomes the announced caption. */
    isInvalid: PropTypes.bool,
    /** The caption shown under the field while `isInvalid` is set. It is announced. */
    errorMessage: PropTypes.node,
    /** Draws the confirmation border; `successMessage` takes the caption's place. */
    isValid: PropTypes.bool,
    /** The caption shown under the field while `isValid` is set. */
    successMessage: PropTypes.node,
    /** With `isMulti`: `onChange` fires once when the list closes, as a filter bar wants, not on each pick. */
    commitOnClose: PropTypes.bool,
    /**
     * Shows the clear × (Figma `_Field Clear`), and lets Delete empty the field.
     * Defaults to true with `isMulti` and to `!isRequired` otherwise; a sort
     * passes `false`.
     */
    clearable: PropTypes.bool,
    /** With `isMulti`: a "Select all" button over the list, hidden past 50 matches. */
    selectAll: PropTypes.bool,
    /** With `isMulti`: the most values; past it the other rows are disabled and the list says why. */
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
    isLoading: PropTypes.bool,
    /**
     * `(text, { offset, limit })` → `Promise<{ options, total }>`. Options load
     * as the list opens, as you type and as you scroll, 50 at a time.
     */
    loadOptions: PropTypes.func,
    /** Ids shown under "Recent" before typing, in a list of more than 50. */
    recent: PropTypes.arrayOf(valueType),
    /** Ids shown under "Suggested" before typing, in a list of more than 50. */
    suggested: PropTypes.arrayOf(valueType),
    /** How a single pick is marked: `check` (default) or `radio`. `isMulti` always draws checkboxes. */
    marker: PropTypes.oneOf(['check', 'radio']),
    /** `(next)`: an id, or an array of ids with `isMulti`. */
    onChange: PropTypes.func,
    /** Focus entering the field from outside it. */
    onFocus: PropTypes.func,
    /** Focus leaving the field and its list. */
    onBlur: PropTypes.func,
    /** Extra class names added to the field wrapper beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the field wrapper. */
    style: PropTypes.object,
};

export default Select;
