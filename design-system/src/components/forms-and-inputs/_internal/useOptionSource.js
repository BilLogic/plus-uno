import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** `loadOptions` asks for this many options at a time. */
const PAGE_SIZE = 50;
/** How close to the bottom of the list, in px, the next page is asked for. */
const LOAD_MORE_WITHIN = 48;

/** The option's words as a string, for filtering and the input; a node label falls back to `text`. */
export const labelOf = (option) => (typeof option.label === 'string' ? option.label : option.text ?? String(option.value));

/**
 * Where a picker's options come from: the `options` it was given, or pages
 * from `loadOptions`, plus any the user created.
 *
 * With a loader, the first page loads as the list opens and again whenever
 * `filter` changes; the next page loads when the list body scrolls near its
 * end. An older request that answers late never overwrites a newer one, and
 * an inline `loadOptions` does not refetch on every render.
 *
 * Every option seen stays known by value, so a picked value keeps its label
 * after it leaves the list (a new search, a new page).
 *
 * @param {object} options
 * @param {Array} options.options the given options, when there is no loader
 * @param {Function} [options.loadOptions] `(text, { offset, limit })` → `Promise<{ options, total }>`
 * @param {string} options.filter the typed text
 * @param {boolean} options.shown the list is open
 * @param {string} options.listId the Listbox's id; its body is what scrolls
 */
export default function useOptionSource({ options, loadOptions, filter, shown, listId }) {
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

    const addCreated = (option) => {
        setCreated((prev) => [...prev, option]);
        known.current.set(option.value, option);
    };

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

    const more = hasLoader && loaded.options.length < loaded.total;
    const loadMore = () => {
        if (more && !loaded.busy) load(filter, loaded.options.length);
    };

    /* ---------- the next page on scroll ---------- */
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

    return {
        all,
        optionFor,
        textFor,
        addCreated,
        /** Loader paging: how many are in, of how many, and whether a page is on its way. */
        paging: {
            count: loaded.options.length,
            total: loaded.total,
            busy: loaded.busy,
            more,
            /** The first page is on its way and the list has nothing to show yet. */
            firstPage: hasLoader && loaded.busy && loaded.options.length === 0,
        },
    };
}
