/**
 * The open-tab thread: only the last row under a parent ends in the elbow, and
 * that row is "Show N more" whenever it shows. The look itself is CSS on the
 * class; the stories check it in the browser.
 */
import { render, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// The pattern loads the components barrel, and with it the chart library,
// which asks `CSS.supports` on load; jsdom has no such function.
vi.hoisted(() => {
    globalThis.CSS = globalThis.CSS || {};
    if (typeof globalThis.CSS.supports !== 'function') globalThis.CSS.supports = () => false;
});

import PatternSidebar from './Sidebar';

const THREAD_END = 'plus-pattern-sidebar__thread-end';

const sessions = (count) =>
    Array.from({ length: count }, (_, i) => ({ id: `sessions:s${count - i}`, title: `Session ${count - i}` }));

const renderSidebar = (tabs, activeId = 'sessions') =>
    render(
        <PatternSidebar
            items={[{ id: 'sessions', text: 'Sessions', icon: 'calendar-alt' }]}
            openTabs={{ sessions: tabs }}
            activeId={activeId}
        />,
    );

const rowsOf = (container) => [...container.querySelector('.plus-pattern-sidebar__tabs').children];
const endsOf = (container) => rowsOf(container).filter((li) => li.classList.contains(THREAD_END));

describe('open tabs thread', () => {
    it('gives only the last tab the last-row class', () => {
        const { container } = renderSidebar(sessions(3));
        const rows = rowsOf(container);
        expect(rows).toHaveLength(3);
        expect(endsOf(container)).toEqual([rows[2]]);
    });

    it('gives a single tab the last-row class', () => {
        const { container } = renderSidebar(sessions(1));
        expect(endsOf(container)).toEqual(rowsOf(container));
    });

    it('moves the last-row class to "Show N more" when it shows', () => {
        const { container } = renderSidebar(sessions(20));
        const rows = rowsOf(container);
        const ends = endsOf(container);
        expect(ends).toHaveLength(1);
        expect(ends[0]).toBe(rows[rows.length - 1]);
        expect(ends[0]).toHaveClass('plus-pattern-sidebar__more');
        expect(within(ends[0]).getByRole('button', { name: 'Show 15 more' })).toBeInTheDocument();
    });

    it('keeps "Show fewer" last once every tab shows', () => {
        const { container } = renderSidebar(sessions(20));
        fireEvent.click(within(container).getByRole('button', { name: 'Show 15 more' }));
        const rows = rowsOf(container);
        expect(rows).toHaveLength(21);
        expect(endsOf(container)).toEqual([rows[20]]);
        expect(within(rows[20]).getByRole('button', { name: 'Show fewer' })).toBeInTheDocument();
    });

    it('puts "Show N more" last when a selected tab older than the five is shown after them', () => {
        const { container } = renderSidebar(sessions(7), 'sessions:s1');
        const rows = rowsOf(container);
        expect(rows).toHaveLength(7);
        expect(endsOf(container)).toEqual([rows[6]]);
        expect(rows[6]).toHaveClass('plus-pattern-sidebar__more');
    });
});
