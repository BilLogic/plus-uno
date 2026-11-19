import React from 'react';

import { Button, IconButton, PopupSelect, SearchField } from '@/components';

/**
 * The parts a template example hands to Section's header slots: the
 * title row's actions, the compact Search of row 3, and the "Field: value"
 * triggers for a category, each opening its list. Each part is the real PLUS
 * component; the Section draws the rows, so no example builds header markup
 * of its own.
 *
 *   SectionActions     More and the labeled Primary, for the title row
 *   HeaderSearch       the compact SearchField that starts row 3
 *   categoryFilters    "Field: value" trigger props from filter categories
 */

/** The title row's actions: More, then the labeled Primary. Pass `primary={null}` for More alone; `narrow` keeps only the Primary's icon, below 768. */
export const SectionActions = ({ primary = 'Add students', icon = 'user-plus', more = true, moreLabel = 'More section actions', narrow = false }) => (
    <>
        {more && <IconButton icon="ellipsis" label={moreLabel} onClick={() => {}} />}
        {primary && (narrow
            ? <IconButton icon={icon} label={primary} appearance="primary" onClick={() => {}} />
            : <Button text={primary} iconBefore={icon} appearance="primary" onClick={() => {}} />)}
    </>
);

/** Search in row 3: the compact field, so every control on the row draws 32. */
export const HeaderSearch = ({ label = 'Search students', ...props }) => (
    <SearchField mode="active" spacing="compact" placeholder={label} {...props} />
);

/**
 * `filters` props for Section from filter categories and their picked
 * values: one "Field: value" trigger per category, each handing its trigger to
 * a Popup select through `menu` so the same button opens the list and takes
 * the selected state once a value is on. The list picks one value at a time;
 * picking the value on again clears it.
 *
 * @param {Array<{id: string, label: string, options: string[]}>} categories
 * @param {Record<string, string[]>} value  the picked values by category id
 * @param {(id: string, next: string[]) => void} onPick
 * @param {object} [options]
 * @param {Element | null} [options.mount]  where a menu mounts, for a held-open picture
 * @param {(id: string) => object} [options.menuProps]  controlled-open props per category id
 * @param {string} [options.placement]
 */
export const categoryFilters = (categories, value, onPick, { mount, menuProps = () => ({}), placement = 'bottom-end' } = {}) => categories.map((category) => {
    const picked = (value[category.id] ?? [])[0];
    return {
        key: category.id,
        label: category.label,
        text: picked ?? 'All',
        isSelected: Boolean(picked),
        menu: (trigger) => (
            <PopupSelect
                label={category.label}
                options={category.options}
                value={picked ?? null}
                onChange={(next) => onPick(category.id, next === picked ? [] : [next])}
                isSearchable={false}
                placement={placement}
                {...menuProps(category.id)}
                container={mount ?? undefined}
                trigger={trigger}
            />
        ),
    };
});
