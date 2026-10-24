import { createContext, createElement, useContext, useSyncExternalStore } from 'react';

/**
 * Open tabs: the records a person has opened (a session, a student), kept as
 * temporary tabs under the sidebar item they belong to. Source: the Toolkit
 * Information Architecture Revision PRD.
 *
 * - **Keyed per parent.** A tab's id is `<parentId>:<recordId>`, so the same
 *   record id under two items is two tabs.
 * - **Most recent first.** Opening a record that is already open moves it to the
 *   front and refreshes its title and status; it never duplicates.
 * - **Selection.** Opening selects the tab. Closing the selected tab, or closing
 *   all of a parent's tabs while one of them is selected, selects the parent.
 * - **Session-scoped.** The state lives in `sessionStorage`: it survives a reload
 *   and is gone when the browser session ends. Sign-out calls `clearOpenTabs()`.
 * - **No routing.** Nothing here reads or writes the URL or the history. Each
 *   record keeps its own route in `href`, and the tab only links to it.
 *
 * The store is plain JavaScript; `useOpenTabs()` reads it in React. Tests and
 * stories give a component its own store through `OpenTabsProvider`.
 */

/** Where the default store keeps its state in `sessionStorage`. */
export const OPEN_TABS_STORAGE_KEY = 'plus-uno:open-tabs';

/** How many tabs a parent shows before "Show N more". */
export const SIDEBAR_RECENT_TABS = 5;

const EMPTY = Object.freeze({ tabs: [], selectedId: null, seq: 0 });

const tabIdOf = (parentId, recordId) => `${parentId}:${recordId}`;

const sanitize = (value) => {
    if (!value || !Array.isArray(value.tabs)) return EMPTY;
    const tabs = value.tabs.filter((t) => t && typeof t.id === 'string' && typeof t.parentId === 'string');
    return {
        tabs,
        selectedId: typeof value.selectedId === 'string' ? value.selectedId : null,
        seq: Number.isFinite(value.seq) ? value.seq : tabs.reduce((max, t) => Math.max(max, t.openedAt || 0), 0),
    };
};

/** The snapshot components read: the stored state plus the tabs grouped by parent. */
const withGroups = (state) => {
    const tabs = [...state.tabs].sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0));
    const byParent = {};
    for (const tab of tabs) (byParent[tab.parentId] ||= []).push(tab);
    return { tabs, byParent, selectedId: state.selectedId };
};

/**
 * Create an open-tabs store over `sessionStorage[key]`.
 *
 * It reads the stored copy once, when it is created (a page load), and writes
 * through on every change. If storage is unavailable it keeps working in memory.
 *
 * @param {{ key?: string, storage?: Storage }} [options]
 */
export function createOpenTabsStore({ key = OPEN_TABS_STORAGE_KEY, storage } = {}) {
    const backing = () => {
        try {
            return storage ?? window.sessionStorage;
        } catch {
            return null;
        }
    };

    const load = () => {
        try {
            const raw = backing()?.getItem(key);
            return raw ? sanitize(JSON.parse(raw)) : EMPTY;
        } catch {
            return EMPTY;
        }
    };

    let state = load();
    let snapshot = withGroups(state);
    const listeners = new Set();

    const commit = (next) => {
        state = next;
        snapshot = withGroups(state);
        try {
            if (state.tabs.length === 0 && state.selectedId === null) backing()?.removeItem(key);
            else backing()?.setItem(key, JSON.stringify(state));
        } catch {
            // Storage full or blocked: the tabs still work for this page.
        }
        listeners.forEach((listener) => listener());
    };

    const parentOf = (id) => state.tabs.find((t) => t.id === id)?.parentId;

    return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        /**
         * Open a record as a tab under `parentId`, or bring it to the front, and select it.
         * @param {string} parentId the sidebar item it belongs to, e.g. `sessions`
         * @param {{ id: string, title: string, href?: string, status?: 'live' }} record
         * @returns {string} the tab's id
         */
        open(parentId, record) {
            const id = tabIdOf(parentId, record.id);
            const seq = state.seq + 1;
            const tab = {
                id,
                parentId,
                recordId: record.id,
                title: record.title,
                href: record.href,
                status: record.status,
                openedAt: seq,
            };
            commit({ tabs: [...state.tabs.filter((t) => t.id !== id), tab], selectedId: id, seq });
            return id;
        },

        /** Close one tab. If it was selected, its parent is selected. */
        close(id) {
            const parentId = parentOf(id);
            if (!parentId) return;
            commit({
                ...state,
                tabs: state.tabs.filter((t) => t.id !== id),
                selectedId: state.selectedId === id ? parentId : state.selectedId,
            });
        },

        /** Close every tab under `parentId`. If one of them was selected, the parent is selected. */
        closeAll(parentId) {
            const selectedHere = parentOf(state.selectedId) === parentId;
            commit({
                ...state,
                tabs: state.tabs.filter((t) => t.parentId !== parentId),
                selectedId: selectedHere ? parentId : state.selectedId,
            });
        },

        /** Select a tab, or any sidebar item, by id. */
        select(id) {
            if (state.selectedId === id) return;
            commit({ ...state, selectedId: id ?? null });
        },

        /** Close everything and forget it: call at sign-out. */
        clear() {
            commit(EMPTY);
        },
    };
}

let defaultStore;
/** The store the app shares, over `sessionStorage['plus-uno:open-tabs']`. */
export const getOpenTabsStore = () => {
    defaultStore ||= createOpenTabsStore();
    return defaultStore;
};

/** Close every open tab and clear the stored copy. Call it when a person signs out. */
export const clearOpenTabs = () => getOpenTabsStore().clear();

const OpenTabsContext = createContext(null);

/** Give the components below their own store (tests, stories, a second app). */
export const OpenTabsProvider = ({ store, children }) => createElement(OpenTabsContext.Provider, { value: store }, children);

/**
 * The open tabs, in React.
 *
 * @returns {{
 *   tabs: Array<{ id: string, parentId: string, recordId: string, title: string, href?: string, status?: 'live', openedAt: number }>,
 *   byParent: Record<string, Array<object>>,
 *   selectedId: string | null,
 *   open: (parentId: string, record: { id: string, title: string, href?: string, status?: 'live' }) => string,
 *   close: (id: string) => void,
 *   closeAll: (parentId: string) => void,
 *   select: (id: string) => void,
 *   clear: () => void,
 * }}
 */
export function useOpenTabs() {
    const store = useContext(OpenTabsContext) ?? getOpenTabsStore();
    const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return {
        ...snapshot,
        open: store.open,
        close: store.close,
        closeAll: store.closeAll,
        select: store.select,
        clear: store.clear,
    };
}
