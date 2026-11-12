import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Popup from '@/components/overlays-and-layering/Popup/Popup';
import Icon from '../../images-and-icons/Icon';
import { FilterButton } from '../FilterButton/FilterButton';
import TextField from '../TextField/TextField';
import Listbox from '../_internal/Listbox';
import './PopupSelect.scss';

/** Where the menu opens: under its trigger, lined up with the edge on the trigger's side of the bar. */
export const POPUP_SELECT_PLACEMENTS = ['bottom-start', 'bottom-end'];

export const POPUP_SELECT_SPACINGS = ['default', 'compact'];

/** An option's value and the text the trigger shows for it. */
const optionInfo = (option) => {
    if (typeof option === 'string' || typeof option === 'number') return { value: option, text: String(option) };
    const label = option.label ?? option.text ?? String(option.value);
    return { value: option.value ?? label, text: typeof label === 'string' ? label : String(option.value ?? '') };
};

/**
 * Popup select: one list in a Popup, applied the moment a row is picked.
 *
 * - **One list, applied on pick.** Picking a row sets the value, the menu
 *   fades out, and focus goes back to the trigger. There is no Apply.
 * - **Two triggers.** With `label` and no `trigger`, the labeled trigger
 *   reads "Status: Upcoming" with a chevron, as the view switch under page
 *   tabs. Pass `trigger` for anything else, such as a filter button in a
 *   section's view bar; a function gets `{ isOpen, option }`.
 * - **Placement follows the trigger's side.** A trigger at the start of a bar
 *   opens `bottom-start`; one at the end opens `bottom-end` (the default).
 * - **Width** is Popup's `auto`: at least the trigger, 160 to 320.
 * - **Search** sits above the list and filters it. Short lists turn it off
 *   with `isSearchable={false}`.
 *
 * The list is Select's own: the same rows, keys and messages.
 */
const PopupSelect = ({
    options = [],
    value,
    defaultValue,
    onChange,
    label,
    trigger,
    placement = 'bottom-end',
    isSearchable = true,
    searchPlaceholder = 'Search',
    open,
    defaultOpen = false,
    onOpenChange,
    spacing = 'default',
    emptyMessage = 'No results',
    className = '',
    id,
    ...props
}) => {
    const autoId = useId().replace(/:/g, '');
    const listId = `${id || `plus-popup-select-${autoId}`}-listbox`;

    const [internalValue, setInternalValue] = useState(defaultValue ?? null);
    const current = value !== undefined ? value : internalValue;

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open !== undefined ? Boolean(open) : internalOpen;

    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState(undefined);
    const listRef = useRef(null);

    const setOpen = (next) => {
        if (open === undefined) setInternalOpen(next);
        if (!next) setQuery('');
        if (onOpenChange) onOpenChange(next);
    };

    const pickedIndex = options.findIndex((option) => optionInfo(option).value === current);
    const picked = pickedIndex >= 0 ? options[pickedIndex] : undefined;
    const pickedText = picked !== undefined ? optionInfo(picked).text : undefined;

    let triggerNode;
    if (typeof trigger === 'function') triggerNode = trigger({ isOpen, option: picked });
    else if (trigger) triggerNode = trigger;
    else {
        triggerNode = (
            <FilterButton
                text={pickedText !== undefined ? `${label}: ${pickedText}` : label}
                appearance="subtle"
                spacing={spacing}
                className="plus-popup-select__trigger"
            />
        );
    }

    const handleChange = (next, option) => {
        if (value === undefined) setInternalValue(next);
        if (onChange) onChange(next, option);
    };

    const search = isSearchable ? (
        <TextField
            label={label ? `Search ${label.toLowerCase()}` : 'Search'}
            isLabelHidden
            type="search"
            spacing="compact"
            placeholder={searchPlaceholder}
            elemBeforeInput={<Icon name="magnifying-glass" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (listRef.current) listRef.current.handleKeyDown(event); }}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
        />
    ) : null;

    return (
        <Popup
            trigger={triggerNode}
            label={label}
            placement={placement}
            show={isOpen}
            onToggle={setOpen}
            width="auto"
            className={['plus-popup-select', className].filter(Boolean).join(' ')}
            id={id}
        >
            <Listbox
                ref={listRef}
                id={listId}
                embedded
                options={options}
                value={current}
                onChange={handleChange}
                filter={query}
                onFilterChange={setQuery}
                open={isOpen}
                onClose={() => setOpen(false)}
                header={search}
                spacing={spacing}
                emptyMessage={emptyMessage}
                onActiveChange={setActiveId}
                aria-label={label}
                {...props}
            />
        </Popup>
    );
};

PopupSelect.propTypes = {
    /** Strings, or objects with `value`, `label`, `description`, `disabled` and `group`, as Select takes. */
    options: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            label: PropTypes.node,
            text: PropTypes.string,
            description: PropTypes.node,
            disabled: PropTypes.bool,
            group: PropTypes.string,
        }),
    ])),
    /** The picked option's `value`. Leave it out to let the menu keep its own. */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** The value it starts with, when `value` is left out. */
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** `(value, option)`, called the moment a row is picked. */
    onChange: PropTypes.func,
    /** What is being picked, such as "Status". Names the menu, and with no `trigger` it heads the labeled trigger: "Status: Upcoming". */
    label: PropTypes.string,
    /** A trigger of your own, or `({ isOpen, option }) => node`. Without it the labeled trigger is drawn. */
    trigger: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** `bottom-start` for a trigger at the start of a bar, `bottom-end` (default) for one at its end. */
    placement: PropTypes.oneOf(POPUP_SELECT_PLACEMENTS),
    /** A search field above the list. Turn it off for a short list. */
    isSearchable: PropTypes.bool,
    /** The search field's placeholder. */
    searchPlaceholder: PropTypes.string,
    /** Whether the menu is open. Leave it out to let the trigger open and close it. */
    open: PropTypes.bool,
    /** Opens the menu on first render, when `open` is left out. */
    defaultOpen: PropTypes.bool,
    /** `(open)`. */
    onOpenChange: PropTypes.func,
    /** `default` draws 40 rows and a 32 trigger; `compact` draws 32 rows and a 24 trigger. */
    spacing: PropTypes.oneOf(POPUP_SELECT_SPACINGS),
    /** Shown when the search matches nothing. */
    emptyMessage: PropTypes.node,
    /** Extra classes on the popup. */
    className: PropTypes.string,
    /** The popup's id; the list's id is this plus `-listbox`. */
    id: PropTypes.string,
};

export default PopupSelect;
