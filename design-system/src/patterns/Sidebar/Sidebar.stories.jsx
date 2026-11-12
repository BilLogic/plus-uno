import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Breadcrumb, Sidebar as RoleSidebar, Button } from '@/components';
import { Frame } from '@/patterns';
import PatternSidebar, {
    createOpenTabsStore,
    OpenTabsProvider,
    SIDEBAR_SECTIONS_STORAGE_KEY,
} from '@/patterns/Sidebar';
import { computedShadow, px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';

/**
 * `PatternSidebar` — the app's side navigation.
 *
 * THE TEST SEAM IS THIS FILE. Each story is one state of the signed-off
 * prototype's dial (view, onboarding, sections, tabs, tab state, sidebar
 * state, color mode), and its play reads what a person and a screen reader
 * meet: the grid every part sits on, which row is selected, what shows on
 * hover and focus, and what a press does. Every expected length comes from
 * its token or from the grid: icon center x 32, label x 48, trailing center
 * x 208, thread x 32, section title x 20.
 */

const ACCOUNT = { id: 'story-john-doe', name: 'John Doe', role: 'Lead' };
const TUTOR = { id: 'story-john-doe-tutor', name: 'John Doe', role: 'Tutor' };

const groups = (view) => [
    {
        id: 'home',
        items: [
            { id: 'home', text: 'Home', icon: 'house' },
            { id: 'slack', text: 'Slack', icon: 'fa-brands fa-slack', href: 'https://slack.com/', external: true },
        ],
    },
    {
        id: 'training',
        title: 'Training',
        items: [
            { id: 'lessons', text: 'Lessons', icon: 'lightbulb', training: 'lessons' },
            { id: 'onboarding', text: 'Onboarding', icon: 'compass', training: 'modules' },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        lockedDuringOnboarding: true,
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar' },
            { id: 'students', text: 'Students', icon: 'user' },
        ],
    },
    ...(view === 'supervisor' ? [{
        id: 'admin',
        title: 'Admin',
        items: [
            { id: 'compliance', text: 'Compliance', icon: 'flag', count: 3, countLabel: '3 open flags' },
            { id: 'a-reflections', text: 'Reflections', icon: 'comment-dots' },
            { id: 'a-tutors', text: 'Tutors', icon: 'id-badge' },
            { id: 'a-sessions', text: 'Sessions', icon: 'calendar-check' },
            { id: 'a-students', text: 'Students', icon: 'address-book' },
            { id: 'a-groups', text: 'Groups', icon: 'object-group' },
        ],
    }] : []),
];

const SESSION_TABS = [
    { id: 't-s1', label: '4:00 PM · Ms. Ortiz', tooltip: 'Hillside · Ms. Ortiz', live: true },
    { id: 't-s2', label: '5:30 PM · Mr. Patel', tooltip: 'Roosevelt · Mr. Patel' },
    { id: 't-s3', label: 'Tue 3:00 PM · Ms. Ortiz', tooltip: 'Hillside · Ms. Ortiz' },
    { id: 't-s4', label: 'Wed 4:15 PM · Ms. Chen', tooltip: 'Lincoln · Ms. Chen' },
    { id: 't-s5', label: 'Thu 2:30 PM · Mr. Patel-Henderson', tooltip: 'Roosevelt Middle School · Mr. Patel-Henderson' },
    { id: 't-s6', label: 'Fri 1:00 PM · Mr. Adams', tooltip: 'Westview · Mr. Adams' },
    { id: 't-s7', label: 'Fri 3:30 PM · Ms. Chen', tooltip: 'Lincoln · Ms. Chen' },
];
const STUDENT_TABS = [
    { id: 't-st1', label: 'Maya R.', tooltip: 'Grade 8 · Hillside' },
    { id: 't-st2', label: 'Leo T.', tooltip: 'Grade 8 · Roosevelt' },
    { id: 't-st3', label: 'Ana P.', tooltip: 'Grade 7 · Lincoln' },
];
const TAB_SETS = {
    none: {},
    few: { sessions: SESSION_TABS.slice(0, 2), students: STUDENT_TABS.slice(0, 1) },
    many: { sessions: SESSION_TABS, students: STUDENT_TABS },
    // One tab that fits with no longer name, and two that do not.
    clipped: {
        sessions: [
            { id: 't-c1', label: '4:00 PM · Ms. Ortiz' },
            { id: 't-c2', label: 'Thu 2:30 PM · Mr. Patel-Henderson', tooltip: 'Roosevelt Middle School · Mr. Patel-Henderson' },
            { id: 't-c3', label: 'Wed 4:30 PM · Mr. Alexander-Montgomery' },
        ],
    },
};

/** The 240 Sidebar on the sunken fill, full height of its box, as the Frame docks it. */
const Box = ({ children, height = 760 }) => (
    <div
        className="plus-frame__sidebar plus-frame__sidebar--docked"
        style={{ height }}
    >
        {children}
    </div>
);

/** A live sidebar: selection, tab close and close all keep their own state. */
const Live = ({ view = 'supervisor', tabSet = 'few', boxHeight, account, ...args }) => {
    const [active, setActive] = useState(args.activeId ?? 'sessions');
    const [tabs, setTabs] = useState(TAB_SETS[tabSet]);
    return (
        <Box height={boxHeight}>
            <PatternSidebar
                groups={groups(view)}
                account={account ?? (view === 'tutor' ? TUTOR : ACCOUNT)}
                helpHref="https://www.notion.so/"
                onToggle={() => {}}
                {...args}
                tabs={tabs}
                activeId={active}
                onSelect={(id) => { setActive(id); args.onSelect?.(id); }}
                onSelectTab={(tab) => setActive(tab.id)}
                onCloseTab={(tab, item) => {
                    setTabs((prev) => ({ ...prev, [item.id]: prev[item.id].filter((t) => t.id !== tab.id) }));
                    if (active === tab.id) setActive(item.id);
                    args.onCloseTab?.(tab, item);
                }}
                onCloseAllTabs={(item) => {
                    setTabs((prev) => ({ ...prev, [item.id]: [] }));
                    if ((tabs[item.id] ?? []).some((t) => t.id === active)) setActive(item.id);
                    args.onCloseAllTabs?.(item);
                }}
            />
        </Box>
    );
};

export default {
    title: 'Components/Navigation/Navigation system',
    component: PatternSidebar,
    tags: ['!dev', '!autodocs'],
    render: (args) => <Live {...args} />,
    args: { view: 'supervisor', tabSet: 'few', activeId: 'sessions', modulesLeft: 0, lessonsLeft: 0, label: 'Main', storageKey: SIDEBAR_SECTIONS_STORAGE_KEY },
    argTypes: {
        view: { control: 'inline-radio', options: ['tutor', 'supervisor'], table: { category: 'Story' } },
        tabSet: { control: 'inline-radio', options: ['none', 'few', 'many'], table: { category: 'Story' } },
        groups: { control: false, table: { category: 'Content' } },
        tabs: { control: false, table: { category: 'Content' } },
        account: { control: 'object', table: { category: 'Content' } },
        modulesLeft: { control: { type: 'number', min: 0 }, table: { category: 'Content' } },
        lessonsLeft: { control: { type: 'number', min: 0 }, table: { category: 'Content' } },
        activeId: { control: 'text', table: { category: 'Behavior' } },
        helpHref: { control: 'text', table: { category: 'Content' } },
        homeHref: { control: 'text', table: { category: 'Content' } },
        storageKey: { control: 'text', table: { category: 'Behavior' } },
        label: { control: 'text', table: { category: 'Accessibility' } },
        onSelect: { table: { disable: true } },
        onSelectTab: { table: { disable: true } },
        onCloseTab: { table: { disable: true } },
        onCloseAllTabs: { table: { disable: true } },
        onProfile: { table: { disable: true } },
        onSignOut: { table: { disable: true } },
        onHome: { table: { disable: true } },
        onToggle: { table: { disable: true } },
        boxHeight: { table: { disable: true } },
        id: { table: { disable: true } },
        className: { table: { disable: true } },
        style: { table: { disable: true } },
    },
};

/* ------------------------------------------------------------- helpers */

const rect = (el) => el.getBoundingClientRect();
const sidebarOf = (canvasElement) => canvasElement.querySelector('.plus-pattern-sidebar');
/** x of an element's center, from the Sidebar's left edge. */
const centerX = (canvasElement, el) => {
    const r = rect(el);
    return r.left + r.width / 2 - rect(sidebarOf(canvasElement)).left;
};
const leftX = (canvasElement, el) => rect(el).left - rect(sidebarOf(canvasElement)).left;
const nav = (canvasElement) => within(canvasElement).getByRole('navigation', { name: 'Main' });
/** The first row so named: Sessions and Students show in the Toolkit and in Admin. */
const rowNamed = (canvasElement, name) => within(nav(canvasElement)).getAllByRole('button', { name })[0];
const tabNamed = (canvasElement, label) => within(nav(canvasElement)).getAllByRole('button', { name: label })[0];
const selectedRows = (canvasElement) => nav(canvasElement).querySelectorAll('[aria-current="page"]');
const visible = (el) => Boolean(el) && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';

/** Every row's parts sit on the grid: icon center 32, label 48, trailing center 208. */
const expectGrid = async (canvasElement) => {
    const out = {};
    for (const row of nav(canvasElement).querySelectorAll('.plus-pattern-sidebar__row')) {
        const slot = row.querySelector('.plus-pattern-sidebar__slot');
        const label = row.querySelector('.plus-pattern-sidebar__label');
        const end = row.querySelector('.plus-pattern-sidebar__end');
        await expect(px(getComputedStyle(row).height), 'rows are 32').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
        await expect(centerX(canvasElement, slot), `${label.textContent}: icon center`).toBeCloseTo(32, 0);
        await expect(leftX(canvasElement, label), `${label.textContent}: label`).toBeCloseTo(48, 0);
        if (end && visible(end)) await expect(centerX(canvasElement, end), `${label.textContent}: trailing center`).toBeCloseTo(208, 0);
        out.icon = centerX(canvasElement, slot);
        out.label = leftX(canvasElement, label);
        if (end && visible(end)) out.trailing = centerX(canvasElement, end);
    }
    for (const title of nav(canvasElement).querySelectorAll('.plus-pattern-sidebar__title-text')) {
        await expect(leftX(canvasElement, title), `${title.textContent}: title`).toBeCloseTo(20, 0);
        out.title = leftX(canvasElement, title);
    }
    return out;
};

/* ------------------------------------------------------------- view */

/** Supervisor, onboarding done, two Sessions tabs and one Students tab, Sessions selected. */
export const Overview = {
    play: async ({ canvasElement }) => {
        const titles = [...nav(canvasElement).querySelectorAll('.plus-pattern-sidebar__title-text')].map((t) => t.textContent);
        await expect(titles, 'Training, then the Toolkit, then Admin last').toEqual(['Training', 'Toolkit', 'Admin']);
        await expect(selectedRows(canvasElement), 'exactly one selected row').toHaveLength(1);
        await expect(rowNamed(canvasElement, 'Sessions')).toHaveAttribute('aria-current', 'page');
        await expectGrid(canvasElement);
    },
};

/**
 * The grid, measured at 1x: icon center x 32, label x 48, trailing center x
 * 208, thread x 32, section title x 20, logo mark x 20 to 44, toggle center x
 * 208, Help Center center x 208, the docked edge one 1px `--ds-border`.
 */
export const Geometry = {
    args: { tabSet: 'many' },
    play: async ({ canvasElement }) => {
        const grid = await expectGrid(canvasElement);
        const thread = nav(canvasElement).querySelector('.plus-pattern-sidebar__tab .plus-pattern-sidebar__slot');
        const line = getComputedStyle(thread, '::before');
        const threadX = leftX(canvasElement, thread) + px(line.left) + px(line.width) / 2;
        await expect(threadX, 'thread on the icon column').toBeCloseTo(32, 0);
        const turn = getComputedStyle(nav(canvasElement).querySelector('.plus-pattern-sidebar__tab--last .plus-pattern-sidebar__slot'), '::after');
        await expect(px(turn.borderBottomLeftRadius), 'the last tab turns at radius 6').toBeCloseTo(tokenLength(canvasElement, '--frame-sidebar-row-radius'), 0);
        const mark = canvasElement.querySelector('.plus-pattern-sidebar__brand .plus-logo');
        await expect(leftX(canvasElement, mark), 'mark on the slot edge').toBeCloseTo(20, 0);
        await expect(px(getComputedStyle(mark).height), 'lockup height 24').toBeCloseTo(24, 0);
        const toggle = within(canvasElement).getByRole('button', { name: 'Close sidebar' });
        await expect(centerX(canvasElement, toggle), 'toggle on the trailing column').toBeCloseTo(208, 0);
        const help = within(canvasElement).getByRole('link', { name: /Help Center/ });
        await expect(centerX(canvasElement, help), 'Help Center on the trailing column').toBeCloseTo(208, 0);
        const avatar = canvasElement.querySelector('.plus-sidebar-account .plus-avatar');
        await expect(centerX(canvasElement, avatar), 'avatar on the icon column').toBeCloseTo(32, 0);
        const edge = getComputedStyle(canvasElement.querySelector('.plus-frame__sidebar'));
        await expect(edge.boxShadow, 'the docked edge: one 1px line in --ds-border, outside the 240')
            .toBe(computedShadow(canvasElement, 'var(--border-default) 0 0 0 var(--ds-border)'));
        await expect(px(edge.width), 'the Sidebar keeps 240').toBeCloseTo(tokenLength(canvasElement, '--frame-sidebar-width'), 0);
        // Close all and the collapse angle show on hover and focus: focus the row to reach them.
        rowNamed(canvasElement, 'Sessions').focus();
        const close = within(nav(canvasElement)).getByRole('button', { name: /Close all/ });
        await expect(centerX(canvasElement, close), 'Close all on the trailing column').toBeCloseTo(208, 0);
        const twist = within(nav(canvasElement)).getAllByRole('button', { name: /Hide .* tabs/ })[0];
        await expect(centerX(canvasElement, twist), 'the collapse angle on the icon column').toBeCloseTo(32, 0);
        const measured = { ...grid, thread: threadX, toggle: centerX(canvasElement, toggle), help: centerX(canvasElement, help) };
        // The PR quotes these.
        // eslint-disable-next-line no-console
        console.info('[Sidebar geometry]', JSON.stringify(measured));
    },
};

/** A tutor: Home and Slack, Training, the Toolkit, and no Admin. */
export const Tutor = {
    args: { view: 'tutor' },
    play: async ({ canvasElement }) => {
        const titles = [...nav(canvasElement).querySelectorAll('.plus-pattern-sidebar__title-text')].map((t) => t.textContent);
        await expect(titles).toEqual(['Training', 'Toolkit']);
        await expect(within(canvasElement).getByText('· Tutor')).toBeVisible();
    },
};

/** A tutor mid-onboarding: the Toolkit locked, not hidden; its rows dimmed, with no tabs. */
export const OnboardingInProgress = {
    args: { view: 'tutor', modulesLeft: 3, lessonsLeft: 2, activeId: 'onboarding' },
    play: async ({ canvasElement }) => {
        const message = 'Complete your assigned training to unlock the Toolkit';
        const lock = within(canvasElement).getByRole('img', { name: `Locked. ${message}` });
        await expect(lock).toHaveAttribute('tabindex', '0');
        await expect(within(canvasElement).queryByRole('button', { name: 'Toolkit' }), 'a locked title does not collapse').toBeNull();
        const lessons = rowNamed(canvasElement, /^Lessons/);
        const onboarding = rowNamed(canvasElement, /^Onboarding/);
        await expect(lessons.querySelector('.plus-count:not(.plus-count--dot)'), 'a Count tag, not a dot').toHaveTextContent('2 assigned lessons left');
        await expect(onboarding.querySelector('.plus-count:not(.plus-count--dot)')).toHaveTextContent('3 onboarding modules left');
        await expect(lessons.querySelector('.plus-count--dot')).toBeNull();
        const sessions = rowNamed(canvasElement, 'Sessions');
        await expect(sessions).toHaveAttribute('aria-disabled', 'true');
        await expect(getComputedStyle(sessions).color).toBe(tokenColor(canvasElement, '--ds-text-subtlest'));
        const hovered = withForcedPseudo(sessions, ':hover', () => getComputedStyle(sessions).backgroundColor);
        await expect(hovered, 'no hover fill').toBe('rgba(0, 0, 0, 0)');
        await expect(within(nav(canvasElement)).queryByRole('list', { name: 'Open Sessions' }), 'no tabs while locked').toBeNull();
        lock.focus();
        await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent(message));
    },
};

/** Onboarding done: the lock becomes the caret and the Toolkit collapses like the others. */
export const OnboardingDone = {
    args: { view: 'tutor', modulesLeft: 0, lessonsLeft: 1 },
    play: async ({ canvasElement }) => {
        await expect(rowNamed(canvasElement, /^Onboarding/).querySelector('.plus-count'), 'no onboarding count once done').toBeNull();
        await expect(rowNamed(canvasElement, /^Lessons/).querySelector('.plus-count')).toHaveTextContent('1 assigned lesson left');
        await expect(within(canvasElement).queryByRole('img', { name: /Locked/ })).toBeNull();
        await expect(within(canvasElement).getByRole('button', { name: 'Toolkit' })).toHaveAttribute('aria-expanded', 'true');
    },
};

/* ------------------------------------------------------------- sections */

/** Section titles: full 32 rows; the angle shows after the title on hover and focus. */
export const SectionsOpen = {
    play: async ({ canvasElement }) => {
        const title = within(canvasElement).getByRole('button', { name: 'Training' });
        const caret = title.querySelector('.plus-pattern-sidebar__caret');
        await expect(px(getComputedStyle(title).height), 'title rows are 32').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
        await expect(getComputedStyle(caret).visibility, 'hidden at rest').toBe('hidden');
        const atHover = withForcedPseudo(title, ':hover', () => ({
            caret: getComputedStyle(caret).visibility,
            fill: getComputedStyle(title).backgroundColor,
            color: getComputedStyle(title).color,
        }));
        await expect(atHover.caret, 'the angle on hover').toBe('visible');
        await expect(atHover.fill, 'the hover fill').toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-hovered'));
        await expect(atHover.color, 'the title in ink').toBe(tokenColor(canvasElement, '--ds-text'));
        const caretX = rect(caret).left - rect(title.querySelector('.plus-pattern-sidebar__title-text')).right;
        await expect(caretX, 'the angle 4 after the title').toBeCloseTo(tokenLength(canvasElement, '--inline-sm'), 0);
    },
};

/** Collapsing a section hides its rows, turns the angle right, and is remembered per person. */
export const SectionsCollapsed = {
    render: (args) => {
        const [key, remount] = useState(0);
        return (
            <div>
                <Button data-testid="remount" onClick={() => remount((k) => k + 1)}>Remount</Button>
                <Live key={key} {...args} />
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const storage = `${SIDEBAR_SECTIONS_STORAGE_KEY}:${ACCOUNT.id}`;
        window.localStorage.removeItem(storage);
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByTestId('remount'));
        const training = canvas.getByRole('button', { name: 'Training' });
        await userEvent.click(training);
        await expect(training).toHaveAttribute('aria-expanded', 'false');
        await expect(canvas.queryByRole('button', { name: /^Lessons/ })).toBeNull();
        await expect(getComputedStyle(training.querySelector('.plus-pattern-sidebar__caret i')).transform, 'turned right').not.toBe('none');
        await expect(JSON.parse(window.localStorage.getItem(storage))).toEqual({ training: true });
        await userEvent.click(canvas.getByTestId('remount'));
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Training' })).toHaveAttribute('aria-expanded', 'false'));
        await userEvent.click(canvas.getByRole('button', { name: 'Training' }));
        await expect(canvas.getByRole('button', { name: /^Lessons/ })).toBeVisible();
        window.localStorage.removeItem(storage);
    },
};

/* ------------------------------------------------------------- tabs */

/** No tabs: Sessions and Students are plain rows. */
export const TabsNone = {
    args: { tabSet: 'none' },
    play: async ({ canvasElement }) => {
        await expect(within(nav(canvasElement)).queryAllByRole('list', { name: /^Open/ })).toHaveLength(0);
        await expect(within(nav(canvasElement)).queryByRole('button', { name: /Close all/ })).toBeNull();
    },
};

/** A few tabs: each one under its row on the thread; only the last one turns. */
export const TabsFew = {
    args: { tabSet: 'few', activeId: 'home' },
    play: async ({ canvasElement }) => {
        const list = within(nav(canvasElement)).getByRole('list', { name: 'Open Sessions' });
        const items = list.querySelectorAll(':scope > li');
        await expect(items).toHaveLength(2);
        await expect([...items].map((li) => li.classList.contains('plus-pattern-sidebar__tab--last'))).toEqual([false, true]);
        await expect(within(list).getByRole('button', { name: /4:00 PM · Ms. Ortiz/ }).querySelector('[aria-label="Live"]'), 'the live dot, named').not.toBeNull();
    },
};

/** Many tabs: three show, then "Show n more", which takes the turn. */
export const TabsMany = {
    args: { tabSet: 'many', activeId: 'home' },
    play: async ({ canvasElement }) => {
        const list = within(nav(canvasElement)).getByRole('list', { name: 'Open Sessions' });
        const more = within(list).getByRole('button', { name: 'Show 4 more' });
        await expect(list.querySelectorAll('.plus-pattern-sidebar__tab:not(.plus-pattern-sidebar__tab--more)')).toHaveLength(3);
        await expect(more.closest('li')).toHaveClass('plus-pattern-sidebar__tab--last');
        await userEvent.click(more);
        await expect(list.querySelectorAll('.plus-pattern-sidebar__tab:not(.plus-pattern-sidebar__tab--more)')).toHaveLength(7);
        await expect(within(list).getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
        // Students holds exactly three: no "Show more".
        const students = within(nav(canvasElement)).getByRole('list', { name: 'Open Students' });
        await expect(within(students).queryByRole('button', { name: /Show/ })).toBeNull();
    },
};

/**
 * A tab whose label is clipped shows the full text in a tooltip, on hover and
 * on focus. The row is already a button, so it takes no second tab stop, and a
 * tab that fits has no tooltip of its own (here, none). No `title` is used.
 */
export const TabsClipped = {
    args: { tabSet: 'clipped', activeId: 'home' },
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);
        const fits = tabNamed(canvasElement, /4:00 PM · Ms. Ortiz/);
        const clipped = tabNamed(canvasElement, /Wed 4:30 PM/);
        const fullText = 'Wed 4:30 PM · Mr. Alexander-Montgomery';
        const label = clipped.querySelector('.plus-pattern-sidebar__label');

        await waitFor(() => expect(label.scrollWidth, 'the label is clipped').toBeGreaterThan(label.clientWidth));
        await expect(clipped, 'no title attribute').not.toHaveAttribute('title');
        await expect(label, 'no title attribute on the label').not.toHaveAttribute('title');

        // Unclipped, no longer name: nothing to show.
        await userEvent.hover(fits);
        await new Promise((resolve) => { setTimeout(resolve, 600); });
        await expect(body.queryByRole('tooltip'), 'a tab that fits shows no tooltip').toBeNull();
        await userEvent.unhover(fits);

        // Pointer.
        await userEvent.hover(clipped);
        await expect(await body.findByRole('tooltip')).toHaveTextContent(fullText);
        await userEvent.unhover(clipped);
        await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());

        // Keyboard: focus alone shows it.
        clipped.focus();
        await expect(await body.findByRole('tooltip')).toHaveTextContent(fullText);
        clipped.blur();
        await waitFor(() => expect(body.queryByRole('tooltip')).toBeNull());

        // A tab that has a longer name leads with the clipped label, then the name.
        const both = tabNamed(canvasElement, /Thu 2:30 PM/);
        await userEvent.hover(both);
        await expect(await body.findByRole('tooltip')).toHaveTextContent('Thu 2:30 PM · Mr. Patel-Henderson. Roosevelt Middle School · Mr. Patel-Henderson');
        await userEvent.unhover(both);
    },
};

/** Tab at rest: the live dot in the trailing slot, no Close. */
export const TabRest = {
    args: { activeId: 'home' },
    play: async ({ canvasElement }) => {
        const tab = tabNamed(canvasElement, /4:00 PM · Ms. Ortiz/).closest('li');
        await expect(visible(tab.querySelector('.plus-pattern-sidebar__tab-close')), 'no Close at rest').toBe(false);
        await expect(visible(tab.querySelector('.plus-count--dot')), 'the live dot').toBe(true);
    },
};

/** Tab on hover: the hover fill, and Close in place of the live dot on x 208. */
export const TabHover = {
    args: { activeId: 'home' },
    play: async ({ canvasElement }) => {
        const tab = tabNamed(canvasElement, /4:00 PM · Ms. Ortiz/).closest('li');
        const close = tab.querySelector('.plus-pattern-sidebar__tab-close');
        const state = withForcedPseudo(tab, ':hover', () => ({ close: visible(close), dot: visible(tab.querySelector('.plus-pattern-sidebar__end')), x: centerX(canvasElement, close) }));
        await expect(state.close, 'Close on hover').toBe(true);
        await expect(state.dot, 'the dot gives way').toBe(false);
        await expect(state.x, 'Close on the trailing column').toBeCloseTo(208, 0);
    },
};

/** Tab on focus: the 2px ring inside the row, and Close shows. */
export const TabFocus = {
    args: { activeId: 'home' },
    play: async ({ canvasElement }) => {
        const row = tabNamed(canvasElement, /4:00 PM · Ms. Ortiz/);
        row.focus();
        const style = getComputedStyle(row);
        await expect(px(style.outlineWidth), 'a 2px ring').toBeCloseTo(tokenLength(canvasElement, '--focus-ring-width'), 0);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(visible(row.closest('li').querySelector('.plus-pattern-sidebar__tab-close')), 'Close on focus').toBe(true);
    },
};

/** Tab selected: it takes the fill, Close shows, and its row goes to ink without fill. */
export const TabSelected = {
    args: { activeId: 't-s1' },
    play: async ({ canvasElement }) => {
        const tab = tabNamed(canvasElement, /4:00 PM · Ms. Ortiz/);
        await expect(tab).toHaveAttribute('aria-current', 'page');
        await expect(selectedRows(canvasElement), 'exactly one selected row').toHaveLength(1);
        await expect(getComputedStyle(tab).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
        await expect(visible(tab.closest('li').querySelector('.plus-pattern-sidebar__tab-close')), 'Close while selected').toBe(true);
        const sessions = rowNamed(canvasElement, 'Sessions');
        await expect(getComputedStyle(sessions).color, 'the row in ink').toBe(tokenColor(canvasElement, '--ds-text-selected'));
        await expect(getComputedStyle(sessions).backgroundColor, 'without fill').toBe('rgba(0, 0, 0, 0)');
    },
};

/** Collapsed with its tab selected: the row takes the fill and shows the tab count. */
export const TabsCollapsedWithSelection = {
    args: { activeId: 't-s2' },
    play: async ({ canvasElement }) => {
        // The collapse angle shows on hover and focus: focus the row to reach it.
        rowNamed(canvasElement, 'Sessions').focus();
        const twist = within(nav(canvasElement)).getByRole('button', { name: 'Hide Sessions tabs' });
        await userEvent.click(twist);
        await expect(within(nav(canvasElement)).queryByRole('list', { name: 'Open Sessions' })).toBeNull();
        const sessions = rowNamed(canvasElement, /^Sessions/);
        await expect(sessions).toHaveAttribute('aria-current', 'page');
        await expect(selectedRows(canvasElement)).toHaveLength(1);
        // At rest (focus elsewhere) the count shows; on hover and focus Close all takes its place.
        document.activeElement?.blur();
        await expect(within(sessions).getByText('2')).toBeVisible();
        sessions.focus();
        await userEvent.click(within(nav(canvasElement)).getByRole('button', { name: 'Show Sessions tabs' }));
        await expect(tabNamed(canvasElement, /5:30 PM · Mr. Patel/)).toHaveAttribute('aria-current', 'page');
    },
};

/** Close, Delete and Close all: a closed selected tab hands the selection to its row. */
export const ClosingTabs = {
    args: { activeId: 't-s1', onCloseTab: fn(), onCloseAllTabs: fn() },
    play: async ({ canvasElement, args }) => {
        await userEvent.click(within(nav(canvasElement)).getByRole('button', { name: 'Close 4:00 PM · Ms. Ortiz' }));
        await expect(args.onCloseTab).toHaveBeenCalledTimes(1);
        await expect(rowNamed(canvasElement, 'Sessions')).toHaveAttribute('aria-current', 'page');
        const next = tabNamed(canvasElement, /5:30 PM · Mr. Patel/);
        next.focus();
        await userEvent.keyboard('{Delete}');
        await expect(args.onCloseTab).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(within(nav(canvasElement)).queryByRole('list', { name: 'Open Sessions' })).toBeNull());
        rowNamed(canvasElement, 'Students').focus();
        await userEvent.click(within(nav(canvasElement)).getByRole('button', { name: 'Close all 1 students tabs' }));
        await expect(args.onCloseAllTabs).toHaveBeenCalledTimes(1);
    },
};

/* ------------------------------------------------------------- account row */

/** The account button hugs avatar · name · role: its hover fill ends within 8 of the role; Help stays on x 208. */
export const AccountHug = {
    args: { account: { id: 'story-hug', name: 'Maria Lopez', role: 'Tutor' } },
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole('button', { name: /Maria Lopez, Tutor: account menu/ });
        const role = trigger.querySelector('.plus-sidebar-account__role');
        const gap = trigger.getBoundingClientRect().right - role.getBoundingClientRect().right;
        const eight = tokenLength(canvasElement, '--space-050');
        await expect(gap, 'the fill ends 8 after the role').toBeLessThanOrEqual(eight + 1);
        await expect(gap).toBeGreaterThanOrEqual(eight - 1);
        const avatar = trigger.querySelector('.plus-avatar');
        await expect(avatar.getBoundingClientRect().left - trigger.getBoundingClientRect().left, 'the avatar sits 8 in').toBeCloseTo(eight, 0);
        await expect(px(getComputedStyle(trigger).height), 'the button is 32 high').toBeCloseTo(tokenLength(canvasElement, '--size-200'), 0);
        await expect(avatar.getBoundingClientRect().height, 'the avatar is 24').toBeCloseTo(tokenLength(canvasElement, '--size-150'), 0);
        const help = within(canvasElement).queryByRole('link', { name: /Help Center/ }) ?? within(canvasElement).getByRole('button', { name: 'Help Center' });
        await expect(centerX(canvasElement, help), 'Help stays centered on x 208').toBeCloseTo(208, 0);
    },
};

/** Initials avatar, first name · role, the menu (Profile, Sign out) and Help Center. */
export const AccountRow = {
    args: { onProfile: fn(), onSignOut: fn(), account: { id: 'story-long', name: 'Maria-Guadalupe Fernández-Castellanos', role: 'Admin' } },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /Maria-Guadalupe Fernández-Castellanos, Admin: account menu/ });
        await expect(trigger).toHaveTextContent('MF');
        const name = trigger.querySelector('.plus-sidebar-account__name');
        const role = trigger.querySelector('.plus-sidebar-account__role');
        await expect(name.scrollWidth, 'the name truncates').toBeGreaterThan(name.clientWidth);
        await expect(role.scrollWidth, 'the role never truncates').toBeLessThanOrEqual(role.clientWidth + 1);
        await userEvent.hover(trigger);
        await new Promise((resolve) => { setTimeout(resolve, 600); });
        await expect(within(document.body).queryByRole('tooltip'), 'no tooltip on the account button').toBeNull();
        await userEvent.unhover(trigger);
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
        await expect(getComputedStyle(trigger).backgroundColor, 'menu open: the selected fill').toBe(tokenColor(canvasElement, '--ds-background-selected'));
        const signOut = await within(document.body).findByRole('menuitem', { name: 'Sign out' });
        await expect(signOut.closest('.plus-dropdown-menu')).toHaveTextContent('Maria-Guadalupe Fernández-Castellanos · Admin');
        await userEvent.click(signOut);
        await expect(args.onSignOut).toHaveBeenCalledTimes(1);
        const help = canvas.getByRole('link', { name: /Help Center/ });
        await expect(help).toHaveAttribute('target', '_blank');
        const rest = help.querySelector('.plus-sidebar-account__help-rest');
        const go = help.querySelector('.plus-sidebar-account__help-go');
        await expect(getComputedStyle(go).visibility, 'the question mark at rest').toBe('hidden');
        const hovered = withForcedPseudo(help, ':hover', () => [getComputedStyle(rest).visibility, getComputedStyle(go).visibility]);
        await expect(hovered, 'the external icon on hover').toEqual(['hidden', 'visible']);
        const divider = getComputedStyle(canvasElement.querySelector('.plus-sidebar-account'));
        await expect(px(divider.borderTopWidth), 'the divider above the account row').toBeCloseTo(1, 0);
        await expect(divider.borderTopColor).toBe(tokenColor(canvasElement, '--ds-border'));
    },
};

/* ------------------------------------------------------------- sidebar state */

/** The PLUS sidebar in a Frame, `width` wide, with its own open-tabs store. */
const InFrame = ({ width, sidebarDocked }) => {
    const [store] = useState(() => {
        const s = createOpenTabsStore({ key: 'story-sidebar-tabs', storage: window.sessionStorage });
        s.clear();
        s.open('sessions', { id: 's1', title: '4:00 PM · Ms. Ortiz', tooltip: 'Hillside · Ms. Ortiz', status: 'live' });
        s.select('sessions');
        return s;
    });
    return (
        <OpenTabsProvider store={store}>
            <div style={{ width, height: 760 }}>
                <Frame
                    sidebarDocked={sidebarDocked}
                    header={<Breadcrumb items={[{ text: 'Toolkit' }, { text: 'Sessions' }]} />}
                    sidebar={<RoleSidebar user="supervisor" activeTabId="sessions" account={ACCOUNT} badges={{ 'compliance-monitor': { count: 3, countLabel: '3 open flags' } }} lessonsLeft={2} />}
                    panelStorageKey={null}
                >
                    <p style={{ margin: 0 }}>Upcoming and past sessions.</p>
                </Frame>
            </div>
        </OpenTabsProvider>
    );
};

/** Docked: in flow beside the Page, the 1px edge, `angles-left` ends the logo row; Ctrl+[ closes it. */
export const SidebarOpen = {
    render: () => <InFrame width={1280} />,
    parameters: { layout: 'fullscreen' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const close = await canvas.findByRole('button', { name: 'Close sidebar' });
        await expect(close).toHaveAttribute('aria-keyshortcuts', 'Control+[ Meta+[');
        const aside = canvasElement.querySelector('.plus-frame__sidebar');
        await expect(aside).toHaveClass('plus-frame__sidebar--docked');
        await expect(getComputedStyle(aside).backgroundColor, 'the sunken fill').toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(getComputedStyle(aside).boxShadow, 'docked: the 1px line, no shadow')
            .toBe(computedShadow(canvasElement, 'var(--border-default) 0 0 0 var(--ds-border)'));
        await expect(canvasElement.querySelector('.plus-frame__topbar'), 'no top bar').toBeNull();
        await userEvent.keyboard('{Control>}[[{/Control}');
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Open sidebar' })).toHaveFocus());
        await userEvent.click(canvas.getByRole('button', { name: 'Open sidebar' }));
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Close sidebar' })).toHaveFocus());
    },
};

/** Closed: no rail; `bars` at the Page's top left on x 32, the breadcrumb from x 56 on its center line. */
export const SidebarClosed = {
    render: () => <InFrame width={1280} sidebarDocked={false} />,
    parameters: { layout: 'fullscreen' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = await canvas.findByRole('button', { name: 'Open sidebar' });
        const frame = rect(canvasElement.querySelector('.plus-frame'));
        const t = rect(toggle);
        await expect(t.left + t.width / 2 - frame.left, 'the toggle on the icon column').toBeCloseTo(32, 0);
        await expect(t.top + t.height / 2 - frame.top, 'on the logo row\'s center line').toBeCloseTo(28, 0);
        const crumb = rect(canvasElement.querySelector('.plus-frame__head .breadcrumb, .plus-frame__head nav'));
        await expect(crumb.left - frame.left, 'the breadcrumb from x 56').toBeCloseTo(56, 0);
        await expect(canvas.queryByRole('navigation', { name: 'Main' }), 'no rail').toBeNull();
    },
};

/** Floating: under 1024 the toggle opens it over the Page with the overlay shadow; Escape closes it. */
export const SidebarFloating = {
    render: () => <InFrame width={900} />,
    parameters: { layout: 'fullscreen' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole('button', { name: 'Open sidebar' }));
        const aside = await waitFor(() => {
            const el = canvasElement.querySelector('.plus-frame__sidebar--raised');
            expect(el).not.toBeNull();
            return el;
        });
        await expect(getComputedStyle(aside).position).toBe('absolute');
        await expect(getComputedStyle(aside).backgroundColor, 'the overlay fill').toBe(tokenColor(canvasElement, '--ds-surface-overlay'));
        await expect(getComputedStyle(aside).boxShadow, 'the overlay shadow').not.toBe('none');
        await expect(canvas.getByRole('button', { name: 'Close sidebar' })).toHaveFocus();
        // The first Escape may close the focused toggle's tooltip; the next closes the Sidebar.
        await waitFor(async () => {
            await userEvent.keyboard('{Escape}');
            expect(canvasElement.querySelector('.plus-frame__sidebar--raised')).toBeNull();
        });
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Open sidebar' })).toHaveFocus());
    },
};

/* ------------------------------------------------------------- docs */

/** The playground: a live Sidebar whose view, open tabs and counts follow the table. */
export const Interactive = {
    args: { view: 'supervisor', tabSet: 'few', activeId: 'sessions', modulesLeft: 0, lessonsLeft: 0 },
};

/* ------------------------------------------------------------- color modes */

/** Light: every part on its light token. */
export const Light = {
    globals: { plusColorMode: 'light' },
    play: async ({ canvasElement }) => {
        const row = rowNamed(canvasElement, 'Sessions');
        await expect(getComputedStyle(row).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
    },
};

/** Dark: the same roles, their dark values. */
export const Dark = {
    globals: { plusColorMode: 'dark' },
    play: async ({ canvasElement }) => {
<<<<<<< HEAD
        const row = rowNamed(canvasElement, 'Sessions');
        await expect(getComputedStyle(row).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
        await expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
=======
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
 * a surface: a 1 border-color line runs under the parent's icon center,
 * unbroken through the gaps, and ends in a radius-6 elbow at the last row,
 * which is "Show N more" when it shows. The surface pads 8, so labels line up
 * with the parent's label, and every state fill starts at 28.
 */
export const Thread = {
    render: () => <OpenTabsHarness storeKey="story:thread" seed={manySessions(20)} select="sessions:s20" boxHeight="var(--size-5400)" />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const outline = tokenColor(canvasElement, '--ds-border');
        const stroke = tokenLength(canvasElement, '--stroke-1');
        const thread = (li) => getComputedStyle(li, '::before');
        const parentRow = canvas.getByRole('button', { name: /^Sessions$/ });
        const parentIcon = parentRow.querySelector('.plus-sidebar-tab__icon').getBoundingClientRect();
        const parentLabel = parentRow.querySelector('.plus-sidebar-tab__label').getBoundingClientRect();
        const column = tokenLength(canvasElement, '--pad-x-md') + tokenLength(canvasElement, '--icon-md');
        const check = async () => {
            const rows = [...canvasElement.querySelectorAll('.plus-pattern-sidebar__tabs > li')];
            const last = rows[rows.length - 1];
            await expect(last, 'the last row is "Show N more" or "Show fewer"').toHaveClass('plus-pattern-sidebar__more');
            for (const [index, li] of rows.entries()) {
                const line = thread(li);
                const box = li.getBoundingClientRect();
                const surface = li.querySelector('.plus-sidebar-tab');
                await expect(line.borderLeftColor, 'the border color').toBe(outline);
                await expect(px(line.borderLeftWidth), 'a 1 stroke').toBeCloseTo(stroke, 1);
                await expect(box.left + px(line.left), 'under the parent icon center').toBeCloseTo(parentIcon.left + parentIcon.width / 2, 0);
                await expect(box.left, 'the row starts where the parent does').toBeCloseTo(parentRow.getBoundingClientRect().left, 0);
                await expect(surface.getBoundingClientRect().left, 'the surface starts after the 28 thread column').toBeCloseTo(box.left + column, 0);
                if (index === 0) {
                    await expect(box.top + px(line.top), 'the thread hangs from the parent row, through the gap above the first tab')
                        .toBeCloseTo(parentRow.getBoundingClientRect().bottom, 0);
                    await expect(box.top - parentRow.getBoundingClientRect().bottom, 'the 4 gap above the first tab')
                        .toBeCloseTo(tokenLength(canvasElement, '--stack-sm'), 0);
                }
                if (li === last) {
                    await expect(box.top + px(line.top) + px(line.height), 'the elbow stops at the row middle').toBeCloseTo(box.top + box.height / 2, 0);
                    await expect(px(line.borderBottomWidth), 'the elbow turns').toBeCloseTo(stroke, 1);
                    await expect(px(line.borderBottomLeftRadius), 'radius 6').toBeCloseTo(tokenLength(canvasElement, '--radius-h24'), 0);
                    await expect(box.left + px(line.left) + px(line.width), 'the stub stops short of a focused surface\'s ring')
                        .toBeCloseTo(box.left + column - 2 * tokenLength(canvasElement, '--stroke-2'), 0);
                } else {
                    await expect(box.top + px(line.top) + px(line.height), 'runs through the gap to the next row').toBeCloseTo(rows[index + 1].getBoundingClientRect().top, 0);
                    await expect(px(line.borderBottomWidth), 'no elbow mid-thread').toBe(0);
                }
                const label = li.querySelector('.plus-sidebar-tab__label');
                await expect(label.getBoundingClientRect().left, 'the label lines up with the parent label').toBeCloseTo(parentLabel.left, 0);
            }
            const selected = canvasElement.querySelector('.plus-pattern-sidebar__tabs [aria-current="page"]');
            if (selected) {
                await expect(getComputedStyle(selected).backgroundColor, 'selected fills the surface, neutral')
                    .toBe(tokenColor(canvasElement, '--ds-background-selected'));
                await expect(getComputedStyle(selected).boxShadow, 'and draws no leading bar').toBe('none');
                await expect(getComputedStyle(selected.querySelector('.plus-sidebar-tab__label')).fontWeight, 'its label takes the medium weight')
                    .toBe(getComputedStyle(canvasElement).getPropertyValue('--type-weight-medium').trim());
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

const longTitle = (n) => `Lincoln Middle, Tuesday Zoom session with Ms. Okonkwo-Rivera, session ${n}`;

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <div><Button spacing="compact" text="Reload" onClick={() => setLoad((n) => n + 1)} /></div>
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
>>>>>>> f7a15101e (docs(ds): replace subject-based example content with real PLUS sites, platforms and universities)
    },
};
