import React from 'react';

import { Button, IconButton, SearchField } from '@/components';

/**
 * The parts a template example hands to Section's header slots: the
 * title row's actions, the compact Search of row 3, and the "Field: value"
 * trigger props for a category. Each part is the real PLUS component; the
 * Section draws the rows, so no example builds header markup of its own.
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
 * values. A press steps through the options and back to "All", so the trigger
 * reads "Grade: Grade 7" and takes the selected state once a value is on.
 *
 * @param {Array<{id: string, label: string, options: string[]}>} categories
 * @param {Record<string, string[]>} value  the picked values by category id
 * @param {(id: string, next: string[]) => void} onPick
 */
export const categoryFilters = (categories, value, onPick) => categories.map((category) => {
    const picked = (value[category.id] ?? [])[0];
    const step = () => {
        const next = category.options[(picked ? category.options.indexOf(picked) : -1) + 1];
        onPick(category.id, next ? [next] : []);
    };
    return { key: category.id, label: category.label, text: picked ?? 'All', isSelected: Boolean(picked), onClick: step };
});
