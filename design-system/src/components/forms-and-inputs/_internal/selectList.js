import { labelOf } from './useOptionSource';

/** Past this many options the list is search-first, and "Select all" hides. */
export const SEARCH_FIRST_ABOVE = 50;

/**
 * What a Select's list shows, from its options and what has been typed and picked.
 *
 * - **Search-first.** Past `SEARCH_FIRST_ABOVE` given options (not loaded
 *   ones), the list shows only "Recent" and "Suggested" groups until
 *   something is typed.
 * - **The limit.** At `maxSelections`, every unpicked row is disabled.
 * - **Select all** is offered in multi mode, without a limit, over 1 to
 *   `SEARCH_FIRST_ABOVE` enabled matches, and not while search-first waits
 *   for typing.
 *
 * @returns {{
 *   searchFirst: boolean, waitingForSearch: boolean, atLimit: boolean,
 *   listOptions: Array, listFilter: string, selectable: Array, offerSelectAll: boolean
 * }}
 * `selectable` is the enabled options matching `filter`: what "Select all" picks.
 */
export function selectList({
    all,
    filter,
    current,
    multi,
    maxSelections,
    hasLoader,
    recent,
    suggested,
    optionFor,
    selectAll,
    live,
}) {
    const searchFirst = !hasLoader && all.length > SEARCH_FIRST_ABOVE;
    const waitingForSearch = searchFirst && !filter;

    const atLimit = multi && maxSelections !== undefined && current.length >= maxSelections;
    const limited = (option) => (atLimit && !current.includes(option.value) ? { ...option, disabled: true } : option);

    let listOptions = all.map(limited);
    let listFilter = filter;
    if (waitingForSearch) {
        const recentIds = recent || [];
        const suggestedIds = (suggested || []).filter((v) => !recentIds.includes(v));
        const pick = (ids, group) => ids.map(optionFor).filter(Boolean).map((option) => ({ ...limited(option), group }));
        listOptions = [...pick(recentIds, 'Recent'), ...pick(suggestedIds, 'Suggested')];
        listFilter = '';
    }

    const q = filter.trim().toLowerCase();
    const matches = q ? all.filter((option) => labelOf(option).toLowerCase().includes(q)) : all;
    const selectable = matches.filter((option) => !option.disabled);
    const offerSelectAll = multi && selectAll && live && maxSelections === undefined
        && selectable.length > 0 && selectable.length <= SEARCH_FIRST_ABOVE
        && !waitingForSearch;

    return { searchFirst, waitingForSearch, atLimit, listOptions, listFilter, selectable, offerSelectAll };
}
