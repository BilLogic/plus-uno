import { describe, it, expect, beforeEach } from 'vitest';
import { createOpenTabsStore, OPEN_TABS_STORAGE_KEY, SIDEBAR_RECENT_TABS } from './openTabs';

const KEY = 'test:open-tabs';

const session = (n, extra = {}) => ({ id: `s${n}`, title: `Session ${n}`, href: `/toolkit/sessions/${n}`, ...extra });

describe('open tabs model', () => {
    let store;

    beforeEach(() => {
        sessionStorage.clear();
        store = createOpenTabsStore({ key: KEY });
    });

    it('opens a tab under its parent, most recent first, and selects it', () => {
        store.open('sessions', session(1));
        store.open('sessions', session(2));
        const { tabs, selectedId } = store.getSnapshot();
        expect(tabs.map((t) => t.id)).toEqual(['sessions:s2', 'sessions:s1']);
        expect(tabs[0]).toMatchObject({ parentId: 'sessions', recordId: 's2', title: 'Session 2', href: '/toolkit/sessions/2' });
        expect(selectedId).toBe('sessions:s2');
    });

    it('reopening an open record moves it to the front instead of duplicating it', () => {
        store.open('sessions', session(1));
        store.open('sessions', session(2));
        const before = store.getSnapshot().tabs.find((t) => t.id === 'sessions:s1').openedAt;
        store.open('sessions', session(1, { status: 'live' }));
        const { tabs } = store.getSnapshot();
        expect(tabs.map((t) => t.id)).toEqual(['sessions:s1', 'sessions:s2']);
        expect(tabs[0].status).toBe('live');
        expect(tabs[0].openedAt).toBeGreaterThan(before);
    });

    it('keys tabs per parent item', () => {
        store.open('sessions', session(1));
        store.open('toolkit-students', { id: 's1', title: 'Kiera Wintervale' });
        const { byParent } = store.getSnapshot();
        expect(byParent.sessions.map((t) => t.id)).toEqual(['sessions:s1']);
        expect(byParent['toolkit-students'].map((t) => t.id)).toEqual(['toolkit-students:s1']);
    });

    it('closes one tab', () => {
        store.open('sessions', session(1));
        store.open('sessions', session(2));
        store.select('home');
        store.close('sessions:s1');
        const { tabs, selectedId } = store.getSnapshot();
        expect(tabs.map((t) => t.id)).toEqual(['sessions:s2']);
        expect(selectedId, 'closing an unselected tab keeps the selection').toBe('home');
    });

    it('closing the selected tab selects its parent', () => {
        store.open('sessions', session(1));
        store.open('sessions', session(2));
        store.close('sessions:s2');
        expect(store.getSnapshot().selectedId).toBe('sessions');
    });

    it('closes all of one parent\'s tabs and leaves the others', () => {
        store.open('sessions', session(1));
        store.open('sessions', session(2));
        store.open('toolkit-students', { id: 'kiera', title: 'Kiera Wintervale' });
        store.select('sessions:s1');
        store.closeAll('sessions');
        const { tabs, selectedId } = store.getSnapshot();
        expect(tabs.map((t) => t.id)).toEqual(['toolkit-students:kiera']);
        expect(selectedId, 'the selected tab was among them, so its parent is selected').toBe('sessions');
    });

    it('close all keeps a selection outside the parent', () => {
        store.open('sessions', session(1));
        store.open('toolkit-students', { id: 'kiera', title: 'Kiera Wintervale' });
        store.closeAll('sessions');
        expect(store.getSnapshot().selectedId).toBe('toolkit-students:kiera');
    });

    it('persists to sessionStorage, and a new store (a reload) reads it back', () => {
        store.open('sessions', session(1, { status: 'live' }));
        store.open('sessions', session(2));
        store.select('sessions:s1');
        expect(JSON.parse(sessionStorage.getItem(KEY)).tabs).toHaveLength(2);

        const reloaded = createOpenTabsStore({ key: KEY });
        const { tabs, selectedId } = reloaded.getSnapshot();
        expect(tabs.map((t) => t.id)).toEqual(['sessions:s2', 'sessions:s1']);
        expect(tabs[1].status).toBe('live');
        expect(selectedId).toBe('sessions:s1');
    });

    it('clear() empties the tabs and the stored copy, for sign-out', () => {
        store.open('sessions', session(1));
        store.clear();
        expect(store.getSnapshot().tabs).toEqual([]);
        expect(store.getSnapshot().selectedId).toBeNull();
        expect(sessionStorage.getItem(KEY)).toBeNull();
        expect(createOpenTabsStore({ key: KEY }).getSnapshot().tabs).toEqual([]);
    });

    it('never touches the URL or the history', () => {
        const href = window.location.href;
        const length = window.history.length;
        store.open('sessions', session(1));
        store.select('sessions:s1');
        store.close('sessions:s1');
        store.open('sessions', session(2));
        store.closeAll('sessions');
        expect(window.location.href).toBe(href);
        expect(window.history.length).toBe(length);
    });

    it('notifies subscribers and returns a stable snapshot between changes', () => {
        let calls = 0;
        const unsubscribe = store.subscribe(() => { calls += 1; });
        const first = store.getSnapshot();
        expect(store.getSnapshot()).toBe(first);
        store.open('sessions', session(1));
        expect(calls).toBe(1);
        expect(store.getSnapshot()).not.toBe(first);
        unsubscribe();
        store.open('sessions', session(2));
        expect(calls).toBe(1);
    });

    it('ignores unreadable stored state', () => {
        sessionStorage.setItem(KEY, '{not json');
        expect(createOpenTabsStore({ key: KEY }).getSnapshot().tabs).toEqual([]);
    });

    it('names its defaults', () => {
        expect(OPEN_TABS_STORAGE_KEY).toBe('plus-uno:open-tabs');
        expect(SIDEBAR_RECENT_TABS).toBe(5);
    });
});
