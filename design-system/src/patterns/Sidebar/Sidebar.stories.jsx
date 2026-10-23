import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Count, Logo, Status } from '@/components';
import PatternSidebar from '@/patterns/Sidebar';
import { probe, px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';

/**
 * `PatternSidebar` — the foundation sidebar: a header (the logo), the
 * top-level items, then sections. A section is a group label, its items and an
 * optional divider. Every row is a `SidebarTab`.
 *
 * THE TEST SEAM IS THIS FILE. The stories assert what a person and a screen
 * reader meet: rows 32 high with a 16 icon, labels that truncate, section
 * labels that name a group rather than add a heading, `aria-current` on the
 * selected row, a visible focus ring, and a body that scrolls under a header
 * that stays put. Every expected length is read from its token.
 */

/** The 240 sidebar's content box: its width less the 8 it pads either side. */
const SIDEBAR_BOX = {
    width: 'calc(var(--layout-width-sidebar) - 2 * var(--surface-container-pad))',
    boxSizing: 'content-box',
    padding: 'var(--surface-container-pad)',
    backgroundColor: 'var(--surface-sunken)',
};

const header = <Logo style="colored" size="XS" text={true} className="p-0" />;

const home = [{ id: 'home', text: 'Home', icon: 'house' }];

const sections = [
    {
        id: 'training',
        title: 'Training',
        items: [
            { id: 'lessons', text: 'Lessons', icon: 'book-open' },
            { id: 'onboarding', text: 'Onboarding', icon: 'clipboard' },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar-alt', elemAfter: <Count value={3} label="3 upcoming" /> },
            { id: 'toolkit-students', text: 'Students', icon: 'user-graduate' },
            { id: 'slack', text: 'Slack', icon: 'arrow-up-right-from-square', href: 'https://slack.com/', external: true },
        ],
    },
];

const Box = ({ children, height }) => (
    <div style={{ ...SIDEBAR_BOX, height, display: 'flex', flexDirection: 'column' }}>{children}</div>
);

const Interactive = (args) => {
    const [active, setActive] = useState(args.activeId ?? 'home');
    return (
        <Box height={args.boxHeight}>
            <PatternSidebar {...args} activeId={active} onSelect={(id) => { setActive(id); args.onSelect?.(id); }} />
        </Box>
    );
};

export default {
    title: 'Foundations/Patterns/Sidebar',
    component: PatternSidebar,
    tags: ['!dev', '!autodocs'],
    render: Interactive,
    args: { header, items: home, sections, activeId: 'home', label: 'Main' },
    argTypes: {
        header: { control: false, table: { category: 'Content' } },
        items: { control: 'object', table: { category: 'Content' } },
        sections: { control: 'object', table: { category: 'Content' } },
        activeId: { control: 'text', table: { category: 'Behavior' } },
        label: { control: 'text', table: { category: 'Accessibility' } },
        onSelect: { table: { disable: true } },
        boxHeight: { table: { disable: true } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        style: { table: { disable: true } },
    },
};

const rowsOf = (canvasElement) => [
    ...within(canvasElement).getAllByRole('button'),
    ...within(canvasElement).queryAllByRole('link'),
];

/* ------------------------------------------------------------- stories */

export const Overview = {};

/** Each section label names a group; none of them is a heading. */
export const GroupLabels = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryAllByRole('heading'), 'section labels are not headings').toHaveLength(0);
        for (const title of ['Training', 'Toolkit']) {
            const group = canvas.getByRole('group', { name: title });
            const label = canvas.getByText(title);
            await expect(group).toHaveAttribute('aria-labelledby', label.id);
            // 12 semibold (Heading/xxsmall), padded 6 / 12.
            const style = getComputedStyle(label);
            await expect(style.font, 'Heading/xxsmall').toBe(probe(canvasElement, 'font', 'var(--heading-xxsmall)'));
            await expect(style.fontSize, '12').toBe(probe(canvasElement, 'fontSize', 'var(--font-size-075)'));
            await expect(style.fontWeight, 'semibold').toBe(probe(canvasElement, 'fontWeight', 'var(--type-weight-semibold)'));
            await expect(px(style.paddingTop), 'pad-y').toBeCloseTo(tokenLength(canvasElement, '--element-pad-y-md'), 0);
            await expect(px(style.paddingLeft), 'pad-x').toBeCloseTo(tokenLength(canvasElement, '--element-pad-x-md'), 0);
        }
        await expect(canvas.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    },
};

/** Every row is 32 high with a 16 icon box and a 16 glyph. */
export const ItemMetrics = {
    play: async ({ canvasElement }) => {
        const rows = rowsOf(canvasElement);
        await expect(rows.length, 'Home + 5 items').toBe(6);
        for (const row of rows) {
            await expect(row.getBoundingClientRect().height, 'row height').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
            const icon = row.querySelector('.plus-sidebar-tab__icon');
            await expect(icon.getBoundingClientRect().width, 'icon box').toBeCloseTo(tokenLength(canvasElement, '--icon-md'), 0);
            await expect(px(getComputedStyle(icon.querySelector('i')).fontSize), 'glyph').toBeCloseTo(tokenLength(canvasElement, '--icon-md'), 0);
        }
    },
};

const onSelect = fn();

/** The selected row, and only it, carries `aria-current="page"`; a press selects. */
export const SelectedItem = {
    args: { activeId: 'lessons', onSelect },
    play: async ({ canvasElement }) => {
        onSelect.mockClear();
        const canvas = within(canvasElement);
        const current = canvasElement.querySelectorAll('[aria-current="page"]');
        await expect(current).toHaveLength(1);
        await expect(current[0]).toHaveTextContent('Lessons');

        await userEvent.click(canvas.getByRole('button', { name: /^Sessions/ }));
        await expect(onSelect).toHaveBeenCalledWith('sessions');
        await waitFor(() => expect(canvas.getByRole('button', { name: /^Sessions/ })).toHaveAttribute('aria-current', 'page'));
        await expect(canvas.getByRole('button', { name: 'Lessons' })).not.toHaveAttribute('aria-current');
    },
};

/** Tab reaches the first row and draws the focus ring. */
export const KeyboardFocus = {
    play: async ({ canvasElement }) => {
        const first = within(canvasElement).getByRole('button', { name: 'Home' });
        await userEvent.tab();
        await expect(document.activeElement).toBe(first);
        await waitFor(() => expect(getComputedStyle(first).outlineStyle).toBe('solid'));
        await expect(getComputedStyle(first).outlineColor).toBe(tokenColor(canvasElement, '--color-focus-ring'));
    },
};

const many = Array.from({ length: 8 }, (_, s) => ({
    id: `section-${s + 1}`,
    title: `Section ${s + 1}`,
    divider: s < 7,
    items: Array.from({ length: 4 }, (__, i) => ({ id: `s${s + 1}-${i + 1}`, text: `Item ${s + 1}.${i + 1}`, icon: 'folder' })),
}));

/** Past the frame's height the body scrolls inside the sidebar; the logo stays put. */
export const ManySections = {
    args: { sections: many, boxHeight: 'var(--size-5400)' },
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('.plus-pattern-sidebar');
        const head = root.querySelector('.plus-pattern-sidebar__header');
        const body = root.querySelector('.plus-pattern-sidebar__body');
        await expect(body.scrollHeight, 'the body overflows').toBeGreaterThan(body.clientHeight);
        await expect(body.contains(head), 'the header is outside the scroller').toBe(false);
        await expect(root.getBoundingClientRect().height, 'the sidebar keeps the frame height')
            .toBeCloseTo(tokenLength(canvasElement, '--size-5400'), 0);

        const headTop = head.getBoundingClientRect().top;
        body.scrollTop = body.scrollHeight;
        await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));
        await expect(head.getBoundingClientRect().top, 'the logo did not move').toBeCloseTo(headTop, 0);
        await expect(canvasElement.querySelectorAll('.plus-pattern-sidebar__divider'), 'dividers between sections').toHaveLength(7);
    },
};

const longSections = [
    {
        id: 'toolkit',
        title: 'Toolkit for supervisors who manage several tutoring groups',
        items: [
            { id: 'long', text: 'Session reflections and post-session feedback for every student', icon: 'clipboard' },
            { id: 'live', text: 'Students in the live session right now', icon: 'user-graduate', elemAfter: <Status style="success">Live</Status> },
            { id: 'described', text: 'Sessions', icon: 'calendar-alt', description: 'Three upcoming this week, one needs a fill-in' },
        ],
    },
];

/** Long labels and long group labels end in an ellipsis; rows stay 32. */
export const LongLabels = {
    args: { sections: longSections, activeId: 'long' },
    play: async ({ canvasElement }) => {
        const label = within(canvasElement).getByText(/^Session reflections/);
        await expect(label.scrollWidth, 'the item label is clipped').toBeGreaterThan(label.clientWidth);
        const group = within(canvasElement).getByText(/^Toolkit for supervisors/);
        await expect(getComputedStyle(group).textOverflow).toBe('ellipsis');
        await expect(group.scrollWidth, 'the group label is clipped').toBeGreaterThan(group.clientWidth);
        const row = within(canvasElement).getByRole('button', { name: /^Session reflections/ });
        await expect(row.getBoundingClientRect().height).toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
    },
};

/** A disabled item is announced and skipped by Tab. */
export const DisabledItem = {
    args: {
        sections: [{
            id: 'admin',
            title: 'Admin',
            items: [
                { id: 'tutors', text: 'Tutors', icon: 'chart-pie' },
                { id: 'groups', text: 'Groups', icon: 'users-rectangle', disabled: true },
            ],
        }],
        activeId: 'tutors',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const disabled = canvas.getByRole('button', { name: 'Groups' });
        await expect(disabled).toHaveAttribute('aria-disabled', 'true');
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.tab();
        await expect(document.activeElement).not.toBe(disabled);
    },
};
