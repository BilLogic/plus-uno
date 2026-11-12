import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Popup from '@/components/overlays-and-layering/Popup/Popup';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import Checkbox from '../Checkbox/Checkbox';
import Fieldset from '../Fieldset';
import './FilterMenu.scss';

/** Where the menu opens: under its trigger, lined up with the edge on the trigger's side of the bar. */
export const FILTER_MENU_PLACEMENTS = ['bottom-start', 'bottom-end'];

/** `side-by-side` sets the categories in columns; `stacked` sets them one under another. */
export const FILTER_MENU_LAYOUTS = ['side-by-side', 'stacked'];

/** Popup's column steps. Side by side is always `3-col`; stacked may take `4-col`. */
export const FILTER_MENU_WIDTHS = ['3-col', '4-col'];

/** Up to this many categories sit side by side; more stack. */
const MAX_SIDE_BY_SIDE = 3;

/** An option's value and its label. */
const optionInfo = (option) => {
    if (typeof option === 'string' || typeof option === 'number') {
        return { value: option, label: String(option), isDisabled: false };
    }
    return { value: option.value, label: option.label ?? String(option.value), isDisabled: Boolean(option.disabled) };
};

/** Every category present, each with a list of its own (empty when nothing is picked). */
const normalize = (categories, value) => Object.fromEntries(
    categories.map((category) => [category.id, [...(value?.[category.id] ?? [])]]),
);

/** How many values are applied across every category: the count the trigger shows. */
const countApplied = (value) => Object.values(value ?? {})
    .reduce((total, picked) => total + (Array.isArray(picked) ? picked.length : 0), 0);

/**
 * Filter menu: several filter categories in a Popup, held until Apply.
 *
 * - **Held until Apply.** Ticking a box changes the menu, not the content.
 *   Apply hands the values to `onApply`, closes the menu with a fade, and the
 *   content behind swaps in place once. Escape or a click away drops what was
 *   ticked; the next open starts from what is applied.
 * - **Reset** clears every box in the menu without applying. Apply then
 *   applies the empty set.
 * - **Layout follows the count.** Two or three categories sit side by side
 *   at `3-col`; four or more stack, at `3-col` or `4-col`.
 * - **The trigger** is the Filter icon button, its count the number of values
 *   applied, on the selected fill once any is. It opens `bottom-end`, the
 *   end of the bar where filters sit.
 */
const FilterMenu = ({
    categories = [],
    value,
    defaultValue,
    onApply,
    label = 'Filters',
    trigger,
    placement = 'bottom-end',
    layout,
    width = '3-col',
    open,
    defaultOpen = false,
    onOpenChange,
    spacing = 'default',
    className = '',
    id,
}) => {
    const [internalValue, setInternalValue] = useState(() => normalize(categories, defaultValue));
    const applied = value !== undefined ? normalize(categories, value) : internalValue;

    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = open !== undefined ? Boolean(open) : internalOpen;

    // The values being ticked. Each open starts again from what is applied,
    // whoever opened it, so it is reset when `isOpen` turns true.
    const [draft, setDraft] = useState(applied);
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) setDraft(applied);
    }

    const setOpen = (next) => {
        if (open === undefined) setInternalOpen(next);
        if (onOpenChange) onOpenChange(next);
    };

    const resolvedLayout = FILTER_MENU_LAYOUTS.includes(layout)
        ? layout
        : (categories.length <= MAX_SIDE_BY_SIDE ? 'side-by-side' : 'stacked');
    const resolvedWidth = resolvedLayout === 'side-by-side' ? '3-col' : width;

    const count = countApplied(applied);
    let triggerNode;
    if (typeof trigger === 'function') triggerNode = trigger({ isOpen, count });
    else if (trigger) triggerNode = trigger;
    else {
        triggerNode = (
            <IconButton
                icon="filter"
                label={label}
                trailingMetric={count}
                spacing={spacing}
                className="plus-filter-menu__trigger"
            />
        );
    }

    const toggle = (categoryId, optionValue, checked) => {
        setDraft((current) => {
            const picked = current[categoryId] ?? [];
            const next = checked
                ? [...picked.filter((item) => item !== optionValue), optionValue]
                : picked.filter((item) => item !== optionValue);
            return { ...current, [categoryId]: next };
        });
    };

    const reset = () => setDraft(normalize(categories, {}));

    const apply = () => {
        const next = normalize(categories, draft);
        if (value === undefined) setInternalValue(next);
        if (onApply) onApply(next);
        setOpen(false);
    };

    return (
        <Popup
            trigger={triggerNode}
            label={label}
            placement={placement}
            show={isOpen}
            onToggle={setOpen}
            width={resolvedWidth}
            className={['plus-filter-menu', `plus-filter-menu--${resolvedLayout}`, className].filter(Boolean).join(' ')}
            id={id}
        >
            <div
                className="plus-filter-menu__categories"
                style={resolvedLayout === 'side-by-side' ? { '--plus-filter-menu-columns': Math.max(categories.length, 1) } : undefined}
            >
                {categories.map((category) => (
                    <Fieldset key={category.id} legend={category.label} className="plus-filter-menu__category">
                        {(category.options ?? []).map((option) => {
                            const { value: optionValue, label: optionLabel, isDisabled } = optionInfo(option);
                            return (
                                <Checkbox
                                    key={optionValue}
                                    name={category.id}
                                    value={optionValue}
                                    label={optionLabel}
                                    isDisabled={isDisabled}
                                    isChecked={(draft[category.id] ?? []).includes(optionValue)}
                                    onChange={(event) => toggle(category.id, optionValue, event.target.checked)}
                                />
                            );
                        })}
                    </Fieldset>
                ))}
            </div>
            <div className="plus-filter-menu__footer">
                <Button text="Reset" appearance="default" shouldFitContainer onClick={reset} />
                <Button text="Apply" appearance="primary" shouldFitContainer onClick={apply} />
            </div>
        </Popup>
    );
};

FilterMenu.propTypes = {
    /** The filter categories, in order: `{ id, label, options }`. Options are strings, or `{ value, label, disabled }`. Each category is a list of checkboxes; pick as many as apply. */
    categories: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired,
        options: PropTypes.arrayOf(PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.shape({
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                label: PropTypes.node,
                disabled: PropTypes.bool,
            }),
        ])).isRequired,
    })).isRequired,
    /** The applied values, `{ [categoryId]: value[] }`. Leave it out to let the menu keep its own. */
    value: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))),
    /** The values applied at first, when `value` is left out. */
    defaultValue: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))),
    /** `(value)`, called on Apply with every category, an empty list for a category with nothing picked. Nothing is called while boxes are ticked. */
    onApply: PropTypes.func,
    /** Names the menu and the Filter icon button: "Filters", read "Filters, 2 applied" once two are. */
    label: PropTypes.string,
    /** A trigger of your own, or `({ isOpen, count }) => node`. Without it the Filter icon button is drawn. */
    trigger: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** `bottom-end` (default) for a trigger at the end of a bar, `bottom-start` for one at its start. */
    placement: PropTypes.oneOf(FILTER_MENU_PLACEMENTS),
    /** Leave it out to follow the count: two or three categories side by side, four or more stacked. Set `stacked` for a few categories with long lists. */
    layout: PropTypes.oneOf(FILTER_MENU_LAYOUTS),
    /** The column step of a stacked menu, `3-col` (default) or `4-col`. A side-by-side menu is always `3-col`. */
    width: PropTypes.oneOf(FILTER_MENU_WIDTHS),
    /** Whether the menu is open. Leave it out to let the trigger open and close it. */
    open: PropTypes.bool,
    /** Opens the menu on first render, when `open` is left out. */
    defaultOpen: PropTypes.bool,
    /** `(open)`. */
    onOpenChange: PropTypes.func,
    /** The Filter icon button's spacing: `default` draws 32, `compact` 24. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Extra classes on the popup. */
    className: PropTypes.string,
    /** The popup's id. */
    id: PropTypes.string,
};

export default FilterMenu;
