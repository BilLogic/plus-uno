import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button, Count, Logo, Status } from '@/components';
import PatternSidebar, {
    clearOpenTabs,
    createOpenTabsStore,
    getOpenTabsStore,
    OPEN_TABS_STORAGE_KEY,
    OpenTabsProvider,
    useOpenTabs,
} from '@/patterns/Sidebar';
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

/* ------------------------------------------------------------- open tabs */

/*
 * Each open-tabs story gets its own store over its own sessionStorage key, so
 * no story sees another's tabs and the app's default store is never touched.
 * The buttons beside the sidebar stand in for a list page opening a record.
 */

const tabSections = [
    sections[0],
    {
        id: 'toolkit',
        title: 'Toolkit',
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar-alt' },
            { id: 'toolkit-students', text: 'Students', icon: 'user-graduate' },
            { id: 'slack', text: 'Slack', icon: 'arrow-up-right-from-square', href: 'https://slack.com/', external: true },
        ],
    },
];

const sessionRecord = (n, title, extra = {}) => ['sessions', { id: `s${n}`, title, href: `/toolkit/sessions?session=s${n}`, ...extra }];
const studentRecord = (id, title) => ['toolkit-students', { id, title, href: `/toolkit/students?student=${id}` }];

const tutorExample = [
    sessionRecord(2, 'Beauxbatons · Wed, Sep 10'),
    sessionRecord(1, 'Hogwarts · Tue, Sep 9', { status: 'live' }),
    studentRecord('kiera', 'Kiera Wintervale'),
];

const manySessions = (count, title = (n) => `Session ${n}`) =>
    Array.from({ length: count }, (_, i) => sessionRecord(i + 1, title(i + 1)));

const OpenTabsSidebar = ({ boxHeight, records = [], label = 'Main' }) => {
    const tabs = useOpenTabs();
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--section-stack-md)' }}>
            <Box height={boxHeight}>
                <PatternSidebar
                    header={header}
                    items={home}
                    sections={tabSections}
                    activeId={tabs.selectedId ?? 'sessions'}
                    onSelect={(id) => tabs.select(id)}
                    openTabs={tabs.byParent}
                    onTabSelect={(tab) => tabs.select(tab.id)}
                    onTabClose={(tab) => tabs.close(tab.id)}
                    onTabsCloseAll={(item) => tabs.closeAll(item.id)}
                    label={label}
                />
            </Box>
            {records.length ? (
                <div role="group" aria-label="Records" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
                    {records.map(([parent, record]) => (
                        <Button
                            key={`${parent}:${record.id}`}
                            size="small"
                            fill="outline"
                            style="secondary"
                            text={`Open ${record.title}`}
                            onClick={() => tabs.open(parent, record)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
};

/** A sidebar over its own store, seeded with `seed` and with `select` selected. */
const OpenTabsHarness = ({ storeKey, seed = [], select, keepStored = false, ...rest }) => {
    const [store] = useState(() => {
        if (!keepStored) {
            try { sessionStorage.removeItem(storeKey); } catch { /* blocked storage: start empty */ }
        }
        const created = createOpenTabsStore({ key: storeKey });
        if (!keepStored) {
            seed.forEach(([parent, record]) => created.open(parent, record));
            if (select) created.select(select);
        }
        return created;
    });
    return (
        <OpenTabsProvider store={store}>
            <OpenTabsSidebar {...rest} />
        </OpenTabsProvider>
    );
};

const tabRows = (canvasElement) => [...canvasElement.querySelectorAll('.plus-pattern-sidebar__tab .plus-sidebar-tab')];
const tabTitles = (canvasElement) => tabRows(canvasElement).map((row) => row.querySelector('.plus-sidebar-tab__label').textContent);

/**
 * The tutor example: Sessions with two open sessions, one of them live, and
 * Students with one open student. Each parent is an open accordion; each tab is
 * 32 high, its surface past a 28 thread column.
 */
export const OpenTabs = {
    render: () => <OpenTabsHarness storeKey="story:open-tabs" seed={tutorExample} select="sessions:s1" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(tabTitles(canvasElement), 'most recent first, keyed per parent')
            .toEqual(['Hogwarts · Tue, Sep 9', 'Beauxbatons · Wed, Sep 10', 'Kiera Wintervale']);
        for (const name of ['Sessions tabs', 'Students tabs']) {
            await expect(canvas.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'true');
        }
        await expect(canvas.queryByRole('button', { name: 'Lessons tabs' }), 'no tabs, no chevron').toBeNull();

        const selected = canvas.getByRole('link', { name: /^Hogwarts/ });
        await expect(selected).toHaveAttribute('aria-current', 'page');
        const parentRow = canvas.getByRole('button', { name: /^Sessions$/ });
        await expect(parentRow).not.toHaveAttribute('aria-current');

        for (const row of tabRows(canvasElement)) {
            await expect(row.getBoundingClientRect().height, 'tab row 32').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
        }
        await expect(selected.getBoundingClientRect().left - parentRow.getBoundingClientRect().left, 'the surface sits past the 28 thread column')
            .toBeCloseTo(tokenLength(canvasElement, '--element-pad-x-md') + tokenLength(canvasElement, '--icon-md'), 0);
    },
};

/** A live session shows a green dot named "Live"; the others show nothing. */
export const LiveDot = {
    render: () => <OpenTabsHarness storeKey="story:live-dot" seed={tutorExample} select="sessions" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const dots = canvas.getAllByRole('img', { name: 'Live' });
        await expect(dots, 'one live session').toHaveLength(1);
        await expect(canvas.getByRole('link', { name: /^Hogwarts/ })).toContainElement(dots[0]);
        await expect(getComputedStyle(dots[0]).backgroundColor).toBe(tokenColor(canvasElement, '--color-success'));
        await expect(canvas.getByRole('link', { name: /^Hogwarts.*Live$/ }), 'the row is announced as live').toBeInTheDocument();
    },
};

/**
 * Opening a record adds its tab and selects it; × closes one; closing the
 * selected tab selects its parent; "Close all" closes the parent's tabs and
 * the chevron goes with them.
 */
export const OpenAndClose = {
    render: () => (
        <OpenTabsHarness
            storeKey="story:open-close"
            records={[sessionRecord(1, 'Hogwarts · Tue, Sep 9', { status: 'live' }), sessionRecord(2, 'Beauxbatons · Wed, Sep 10'), studentRecord('kiera', 'Kiera Wintervale')]}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(tabRows(canvasElement)).toHaveLength(0);

        await userEvent.click(canvas.getByRole('button', { name: 'Open Hogwarts · Tue, Sep 9' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Open Beauxbatons · Wed, Sep 10' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Open Kiera Wintervale' }));
        await expect(tabTitles(canvasElement)).toEqual(['Beauxbatons · Wed, Sep 10', 'Hogwarts · Tue, Sep 9', 'Kiera Wintervale']);
        await expect(canvas.getByRole('link', { name: 'Kiera Wintervale' }), 'opening selects').toHaveAttribute('aria-current', 'page');

        // Close an unselected tab with its ×: the selection stays.
        canvas.getByRole('link', { name: /^Hogwarts/ }).focus(); // focus shows the hover actions, as hover does
        await userEvent.click(canvas.getByRole('button', { name: 'Close Hogwarts · Tue, Sep 9' }));
        await expect(tabTitles(canvasElement)).toEqual(['Beauxbatons · Wed, Sep 10', 'Kiera Wintervale']);
        await expect(canvas.getByRole('link', { name: 'Kiera Wintervale' })).toHaveAttribute('aria-current', 'page');

        // Select a session tab, then close it: its parent is selected.
        await userEvent.click(canvas.getByRole('link', { name: 'Beauxbatons · Wed, Sep 10' }));
        await expect(canvas.getByRole('link', { name: 'Beauxbatons · Wed, Sep 10' })).toHaveAttribute('aria-current', 'page');
        await userEvent.click(canvas.getByRole('button', { name: 'Close Beauxbatons · Wed, Sep 10' }));
        await waitFor(() => expect(canvas.getByRole('button', { name: /^Sessions$/ })).toHaveAttribute('aria-current', 'page'));
        await expect(canvas.queryByRole('button', { name: 'Sessions tabs' }), 'no tabs left, no chevron').toBeNull();

        // Close all on Students.
        canvas.getByRole('button', { name: /^Students$/ }).focus(); // focus shows the hover actions, as hover does
        await userEvent.click(canvas.getByRole('button', { name: 'Close all Students tabs' }));
        await expect(tabRows(canvasElement)).toHaveLength(0);
    },
};

/** Closing the selected tab with "Close all" selects the parent too. */
export const CloseAllSelectsParent = {
    render: () => <OpenTabsHarness storeKey="story:close-all" seed={tutorExample} select="sessions:s2" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByRole('button', { name: /^Sessions$/ }).focus(); // focus shows the hover actions, as hover does
        await userEvent.click(canvas.getByRole('button', { name: 'Close all Sessions tabs' }));
        await expect(tabTitles(canvasElement)).toEqual(['Kiera Wintervale']);
        await waitFor(() => expect(canvas.getByRole('button', { name: /^Sessions$/ })).toHaveAttribute('aria-current', 'page'));
    },
};

/**
 * The parent is a disclosure: the chevron carries `aria-expanded` and
 * `aria-controls`, hides and shows the tabs, and opening a tab opens it again.
 * The label still selects the parent's own page.
 */
export const Disclosure = {
    render: () => (
        <OpenTabsHarness
            storeKey="story:disclosure"
            seed={[sessionRecord(1, 'Hogwarts · Tue, Sep 9')]}
            select="sessions:s1"
            records={[sessionRecord(2, 'Beauxbatons · Wed, Sep 10')]}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const chevron = canvas.getByRole('button', { name: 'Sessions tabs' });
        const list = canvasElement.querySelector(`#${CSS.escape(chevron.getAttribute('aria-controls'))}`);
        await expect(list, 'aria-controls names the tab list').toBeInTheDocument();
        await expect(chevron).toHaveAttribute('aria-expanded', 'true');
        await expect(list).toBeVisible();

        await userEvent.click(chevron);
        await expect(chevron).toHaveAttribute('aria-expanded', 'false');
        await expect(list).not.toBeVisible();

        await userEvent.click(canvas.getByRole('button', { name: 'Open Beauxbatons · Wed, Sep 10' }));
        await waitFor(() => expect(chevron).toHaveAttribute('aria-expanded', 'true'));
        await expect(list).toBeVisible();

        await userEvent.click(canvas.getByRole('button', { name: /^Sessions$/ }));
        await expect(canvas.getByRole('button', { name: /^Sessions$/ }), 'the label opens the list page').toHaveAttribute('aria-current', 'page');
        await expect(chevron, 'and leaves the accordion as it was').toHaveAttribute('aria-expanded', 'true');
    },
};

/** Delete (and Backspace) closes the focused tab; focus moves to the next one, then to the parent. */
export const DeleteClosesTab = {
    render: () => <OpenTabsHarness storeKey="story:delete" seed={manySessions(3)} select="sessions" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(tabTitles(canvasElement)).toEqual(['Session 3', 'Session 2', 'Session 1']);
        canvas.getByRole('link', { name: 'Session 2' }).focus();
        await userEvent.keyboard('{Delete}');
        await expect(tabTitles(canvasElement)).toEqual(['Session 3', 'Session 1']);
        await waitFor(() => expect(document.activeElement).toBe(canvas.getByRole('link', { name: 'Session 1' })));

        await userEvent.keyboard('{Backspace}');
        await waitFor(() => expect(document.activeElement).toBe(canvas.getByRole('link', { name: 'Session 3' })));
        await userEvent.keyboard('{Delete}');
        await expect(tabRows(canvasElement)).toHaveLength(0);
        await waitFor(() => expect(document.activeElement).toBe(canvas.getByRole('button', { name: /^Sessions$/ })));
    },
};

/** Five tabs show; past five a "Show N more" row expands the rest. */
export const Overflow = {
    render: () => <OpenTabsHarness storeKey="story:overflow" seed={manySessions(20)} select="sessions" boxHeight="var(--size-5400)" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(tabRows(canvasElement)).toHaveLength(5);
        await expect(tabTitles(canvasElement)[0], 'the most recent first').toBe('Session 20');
        await userEvent.click(canvas.getByRole('button', { name: 'Show 15 more' }));
        await expect(tabRows(canvasElement)).toHaveLength(20);
        await userEvent.click(canvas.getByRole('button', { name: 'Show fewer' }));
        await expect(tabRows(canvasElement)).toHaveLength(5);
    },
};

/**
 * The thread ties the tabs to their parent. Each row is a 28 thread column and
 * a surface: a 1 outline-variant line runs under the parent's icon center,
 * unbroken through the gaps, and ends in a radius-6 elbow at the last row,
 * which is "Show N more" when it shows. The surface pads 8, so labels line up
 * with the parent's label, and every state fill starts at 28.
 */
export const Thread = {
    render: () => <OpenTabsHarness storeKey="story:thread" seed={manySessions(20)} select="sessions:s20" boxHeight="var(--size-5400)" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const outline = tokenColor(canvasElement, '--color-outline-variant');
        const stroke = tokenLength(canvasElement, '--size-element-stroke-sm');
        const thread = (li) => getComputedStyle(li, '::before');
        const parentRow = canvas.getByRole('button', { name: /^Sessions$/ });
        const parentIcon = parentRow.querySelector('.plus-sidebar-tab__icon').getBoundingClientRect();
        const parentLabel = parentRow.querySelector('.plus-sidebar-tab__label').getBoundingClientRect();
        const column = tokenLength(canvasElement, '--element-pad-x-md') + tokenLength(canvasElement, '--icon-md');
        const check = async () => {
            const rows = [...canvasElement.querySelectorAll('.plus-pattern-sidebar__tabs > li')];
            const last = rows[rows.length - 1];
            await expect(last, 'the last row is "Show N more" or "Show fewer"').toHaveClass('plus-pattern-sidebar__more');
            for (const [index, li] of rows.entries()) {
                const line = thread(li);
                const box = li.getBoundingClientRect();
                const surface = li.querySelector('.plus-sidebar-tab');
                await expect(line.borderLeftColor, 'outline-variant').toBe(outline);
                await expect(px(line.borderLeftWidth), 'a 1 stroke').toBeCloseTo(stroke, 1);
                await expect(box.left + px(line.left), 'under the parent icon center').toBeCloseTo(parentIcon.left + parentIcon.width / 2, 0);
                await expect(box.left, 'the row starts where the parent does').toBeCloseTo(parentRow.getBoundingClientRect().left, 0);
                await expect(surface.getBoundingClientRect().left, 'the surface starts after the 28 thread column').toBeCloseTo(box.left + column, 0);
                if (index === 0) {
                    await expect(box.top + px(line.top), 'the thread hangs from the parent row, through the gap above the first tab')
                        .toBeCloseTo(parentRow.getBoundingClientRect().bottom, 0);
                    await expect(box.top - parentRow.getBoundingClientRect().bottom, 'the 4 gap above the first tab')
                        .toBeCloseTo(tokenLength(canvasElement, '--element-stack-sm'), 0);
                }
                if (li === last) {
                    await expect(box.top + px(line.top) + px(line.height), 'the elbow stops at the row middle').toBeCloseTo(box.top + box.height / 2, 0);
                    await expect(px(line.borderBottomWidth), 'the elbow turns').toBeCloseTo(stroke, 1);
                    await expect(px(line.borderBottomLeftRadius), 'radius 6').toBeCloseTo(tokenLength(canvasElement, '--element-radius-item-sm'), 0);
                    await expect(box.left + px(line.left) + px(line.width), 'the stub ends 2 before the surface').toBeCloseTo(box.left + column - 2, 0);
                } else {
                    await expect(box.top + px(line.top) + px(line.height), 'runs through the gap to the next row').toBeCloseTo(rows[index + 1].getBoundingClientRect().top, 0);
                    await expect(px(line.borderBottomWidth), 'no elbow mid-thread').toBe(0);
                }
                const label = li.querySelector('.plus-sidebar-tab__label');
                await expect(label.getBoundingClientRect().left, 'the label lines up with the parent label').toBeCloseTo(parentLabel.left, 0);
            }
            const selected = canvasElement.querySelector('.plus-pattern-sidebar__tabs [aria-current="page"]');
            if (selected) {
                await expect(getComputedStyle(selected).backgroundColor, 'selected fills the surface, Primary 16')
                    .toBe(tokenColor(canvasElement, '--color-primary-state-16'));
            }
        };
        await expect(canvas.getByRole('link', { name: 'Session 20' }), 'a selected tab').toHaveAttribute('aria-current', 'page');
        await check();
        await userEvent.click(canvas.getByRole('button', { name: 'Show 15 more' }));
        await check();
    },
};

/** Exactly five tabs: no "Show more" row. */
export const FiveTabs = {
    render: () => <OpenTabsHarness storeKey="story:five" seed={manySessions(5)} select="sessions" />,
    play: async ({ canvasElement }) => {
        await expect(tabRows(canvasElement)).toHaveLength(5);
        await expect(within(canvasElement).queryByRole('button', { name: /^Show \d+ more$/ })).toBeNull();
    },
};

const longTitle = (n) => `Lincoln High School, Algebra I recovery block with Ms. Okonkwo-Rivera, session ${n}`;

/** Long titles end in an ellipsis; rows stay 32, and × still fits on hover. */
export const LongTitles = {
    render: () => (
        <OpenTabsHarness
            storeKey="story:long"
            seed={[...manySessions(2, longTitle), ['sessions', { id: 'live', title: longTitle(3), status: 'live' }], studentRecord('long', 'Maximiliana Theodora Featherstonehaugh-Wintervale')]}
            select="sessions:live"
        />
    ),
    play: async ({ canvasElement }) => {
        for (const row of tabRows(canvasElement)) {
            const label = row.querySelector('.plus-sidebar-tab__label');
            await expect(label.scrollWidth, 'clipped').toBeGreaterThan(label.clientWidth);
            await expect(row.getBoundingClientRect().height).toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
        }
        const row = within(canvasElement).getByRole('button', { name: /^Lincoln.*session 3/ });
        row.focus();
        const close = within(canvasElement).getByRole('button', { name: `Close ${longTitle(3)}` });
        await waitFor(() => expect(getComputedStyle(close.parentElement).visibility).toBe('visible'));
        const label = row.querySelector('.plus-sidebar-tab__label');
        await expect(label.getBoundingClientRect().right, 'the label stops before ×').toBeLessThanOrEqual(close.getBoundingClientRect().left);
    },
};

const PERSIST_KEY = 'story:persistence';

const PersistenceDemo = () => {
    const [load, setLoad] = useState(0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
            <div><Button size="small" fill="tonal" text="Reload" onClick={() => setLoad((n) => n + 1)} /></div>
            <OpenTabsHarness
                key={load}
                storeKey={PERSIST_KEY}
                keepStored={load > 0}
                records={[sessionRecord(1, 'Hogwarts · Tue, Sep 9', { status: 'live' }), studentRecord('kiera', 'Kiera Wintervale')]}
            />
        </div>
    );
};

/**
 * Tabs are session-scoped: they live in sessionStorage, so a new store over it
 * (a reload) shows the same tabs and selection. `clearOpenTabs()`, for
 * sign-out, empties the app's store and its stored copy.
 */
export const SessionPersistence = {
    render: () => <PersistenceDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open Hogwarts · Tue, Sep 9' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Open Kiera Wintervale' }));
        await expect(JSON.parse(sessionStorage.getItem(PERSIST_KEY)).tabs).toHaveLength(2);

        const before = canvasElement.querySelector('.plus-pattern-sidebar');
        await userEvent.click(canvas.getByRole('button', { name: 'Reload' }));
        await waitFor(() => expect(canvasElement.querySelector('.plus-pattern-sidebar')).not.toBe(before));
        await expect(tabTitles(canvasElement), 'remounted from storage').toEqual(['Hogwarts · Tue, Sep 9', 'Kiera Wintervale']);
        await expect(canvas.getByRole('link', { name: 'Kiera Wintervale' })).toHaveAttribute('aria-current', 'page');
        sessionStorage.removeItem(PERSIST_KEY);

        // Sign-out, on the app's own store.
        const app = getOpenTabsStore();
        app.open('sessions', { id: 'probe', title: 'Probe' });
        await expect(sessionStorage.getItem(OPEN_TABS_STORAGE_KEY)).not.toBeNull();
        clearOpenTabs();
        await expect(sessionStorage.getItem(OPEN_TABS_STORAGE_KEY)).toBeNull();
        await expect(app.getSnapshot().tabs).toEqual([]);
    },
};

/** Tab actions never change the URL or add history: each tab only links to its record. */
export const UrlUnchanged = {
    render: () => <OpenTabsHarness storeKey="story:url" seed={tutorExample} select="sessions" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const href = window.location.href;
        const length = window.history.length;
        const tab = canvas.getByRole('link', { name: /^Hogwarts/ });
        await expect(tab).toHaveAttribute('href', '/toolkit/sessions?session=s1');

        await userEvent.click(tab);
        await expect(tab).toHaveAttribute('aria-current', 'page');
        await userEvent.click(canvas.getByRole('button', { name: 'Sessions tabs' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Sessions tabs' }));
        canvas.getByRole('link', { name: 'Kiera Wintervale' }).focus(); // focus shows the hover actions, as hover does
        await userEvent.click(canvas.getByRole('button', { name: 'Close Kiera Wintervale' }));
        canvas.getByRole('button', { name: /^Sessions$/ }).focus(); // focus shows the hover actions, as hover does
        await userEvent.click(canvas.getByRole('button', { name: 'Close all Sessions tabs' }));
        await expect(tabRows(canvasElement)).toHaveLength(0);
        await expect(window.location.href).toBe(href);
        await expect(window.history.length).toBe(length);
    },
};

/** Playground extremes: none, one, five, twenty and long titles, side by side. */
export const OpenTabExtremes = {
    render: () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--section-stack-md)', alignItems: 'flex-start' }}>
            <OpenTabsHarness label="Sidebar, 0 open" storeKey="story:extremes-0" />
            <OpenTabsHarness label="Sidebar, 1 open" storeKey="story:extremes-1" seed={[sessionRecord(1, 'Hogwarts · Tue, Sep 9', { status: 'live' })]} select="sessions:s1" />
            <OpenTabsHarness label="Sidebar, 5 open" storeKey="story:extremes-5" seed={manySessions(5)} select="sessions" />
            <OpenTabsHarness label="Sidebar, 20 open" storeKey="story:extremes-20" seed={manySessions(20)} select="sessions" boxHeight="var(--size-5400)" />
            <OpenTabsHarness label="Sidebar, long titles" storeKey="story:extremes-long" seed={manySessions(3, longTitle)} select="sessions:s3" />
        </div>
    ),
};

/** Collapsing the parent of the selected tab selects the parent, so the sidebar always shows a selection. */
export const CollapsedKeepsSelection = {
    render: () => <OpenTabsHarness storeKey="story:collapsed" seed={[sessionRecord(1, 'Hogwarts · Tue, Sep 9')]} select="sessions:s1" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: /^Sessions$/ })).not.toHaveAttribute('aria-current');
        await userEvent.click(canvas.getByRole('button', { name: 'Sessions tabs' }));
        await expect(canvas.getByRole('button', { name: /^Sessions$/ })).toHaveAttribute('aria-current', 'page');
        await userEvent.click(canvas.getByRole('button', { name: 'Sessions tabs' }));
        await expect(canvas.getByRole('link', { name: 'Hogwarts · Tue, Sep 9' })).toHaveAttribute('aria-current', 'page');
    },
};

/** A selected tab older than the five most recent still shows, after them. */
export const SelectedPastTheFive = {
    render: () => <OpenTabsHarness storeKey="story:selected-old" seed={manySessions(7)} select="sessions:s1" />,
    play: async ({ canvasElement }) => {
        await expect(tabTitles(canvasElement)).toEqual(['Session 7', 'Session 6', 'Session 5', 'Session 4', 'Session 3', 'Session 1']);
        await expect(within(canvasElement).getByRole('link', { name: 'Session 1' })).toHaveAttribute('aria-current', 'page');
        await expect(within(canvasElement).getByRole('button', { name: 'Show 2 more' })).toBeInTheDocument();
    },
};
