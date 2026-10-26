import { createOpenTabsStore } from '@/patterns';
import { INITIAL_OPEN_TABS } from '../data/mock';

/** Where the app keeps its open tabs in `sessionStorage`, apart from other apps. */
export const TUTOR_REVAMP_TABS_KEY = 'plus-uno:tutor-revamp:open-tabs';

/** Open the starting tabs (Math 7, Algebra I, Arlene McCoy) into a store, oldest first. */
export const seedOpenTabs = (store) => {
    INITIAL_OPEN_TABS.forEach(({ parentId, record }) => store.open(parentId, record));
    store.select(null);
    return store;
};

/**
 * The app's store. A fresh browser session starts with the starting tabs; a
 * reload keeps whatever the tutor opened or closed since.
 */
export const createAppTabsStore = ({ storage } = {}) => {
    let fresh = true;
    try {
        fresh = !(storage ?? window.sessionStorage).getItem(TUTOR_REVAMP_TABS_KEY);
    } catch {
        fresh = true;
    }
    const store = createOpenTabsStore({ key: TUTOR_REVAMP_TABS_KEY, storage });
    return fresh ? seedOpenTabs(store) : store;
};

/** An in-memory store with the starting tabs, for stories and tests. */
export const createMemoryTabsStore = () => {
    const memory = new Map();
    const storage = {
        getItem: (k) => memory.get(k) ?? null,
        setItem: (k, v) => memory.set(k, v),
        removeItem: (k) => memory.delete(k),
    };
    return seedOpenTabs(createOpenTabsStore({ key: TUTOR_REVAMP_TABS_KEY, storage }));
};
