import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Sidebar } from '@/components';
import { SurfaceContainer, Topbar } from '@/patterns';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';

/**
 * `Topbar` — the app frame's top row: the sidebar toggle at the start, the
 * page's breadcrumb in the middle, Help Center and the account at the end.
 *
 * THE TEST SEAM IS THIS FILE. Each story asserts what a person sees and what a
 * screen reader hears: the toggle's icon and name in every sidebar state, where
 * the breadcrumb starts, that a long breadcrumb or name truncates instead of
 * pushing the end controls off screen, and the 32 height. Every expected length
 * is read from its token through a probe, never typed in.
 */

const USER = { name: 'John Doe', type: 'lead tutor' };
const LONG_TRAIL = [
    { text: 'Home', href: '#' },
    { text: 'Tutors', href: '#' },
    { text: 'Ana Ruiz-Hernández', href: '#' },
    { text: 'Algebra I (Period 3)', href: '#' },
    { text: 'Weekly session notes and follow-ups for October' },
];

export default {
    title: 'Foundations/Patterns/Topbar',
    component: Topbar,
    tags: ['!dev', '!autodocs'],
    args: {
        sidebar: 'open',
        docked: true,
        breadcrumbs: [{ text: 'Home', href: '#' }, { text: 'Strategies' }],
        user: USER,
        onToggle: fn(),
        onHelpClick: fn(),
    },
    argTypes: {
        sidebar: {
            control: 'inline-radio',
            options: ['open', 'closed'],
            description: 'Whether the sidebar is open (docked or floating) or closed. Sets the toggle icon and `aria-expanded`.',
            table: { category: 'Design' },
        },
        docked: {
            control: 'boolean',
            description: 'Docked, the start area is sidebar-wide so the breadcrumb lines up with the surface.',
            table: { category: 'Design' },
        },
        breadcrumbs: { table: { category: 'Content' } },
        user: { table: { category: 'Content' } },
        loading: { control: 'boolean', table: { category: 'Design' } },
        onToggle: { table: { category: 'Development' } },
        onHelpClick: { table: { category: 'Development' } },
        helpHref: { table: { category: 'Development' } },
        toggleProps: { table: { disable: true } },
        id: { control: false, table: { disable: true } },
        className: { control: false, table: { disable: true } },
        style: { table: { disable: true } },
    },
};

/* ------------------------------------------------------------- probes */

const rect = (el) => el.getBoundingClientRect();

/**
 * A token's length in px. Probed on the body, not inside the bar: a probe
 * appended to the flex row would shrink with the row's content.
 */
const token = (name) => tokenLength(document.body, name);

const parts = (canvasElement) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector('.plus-topbar');
    return {
        canvas,
        bar,
        toggle: () => canvas.queryByRole('button', { name: /sidebar$/i }),
        breadcrumb: () => canvas.getByRole('navigation', { name: /breadcrumb/i }),
        help: () => canvas.getByRole('button', { name: 'Help Center' }),
        avatar: () => bar.querySelector('.plus-user-avatar'),
        icon: (el) => el.querySelector('i'),
    };
};

const expectIcon = async (toggle, name) => {
    await expect(toggle.querySelector('i'), `toggle icon is ${name}`).toHaveClass(`fa-${name}`);
};

const expectHeight = async (bar) => {
    await expect(rect(bar).height, 'topbar height').toBeCloseTo(token('--layout-height-topbar'), 0);
};

/** The end controls are inside the bar, whole, and nothing overlaps them. */
const expectEndInside = async (bar, help, avatar, breadcrumb) => {
    const b = rect(bar);
    await expect(rect(avatar).right, 'avatar inside the bar').toBeLessThanOrEqual(b.right + 0.5);
    await expect(rect(help).left, 'help inside the bar').toBeGreaterThanOrEqual(b.left);
    await expect(rect(breadcrumb).right, 'breadcrumb ends before Help Center').toBeLessThanOrEqual(rect(help).left);
};

/* ------------------------------------------------------------- stories */

/** Docked: the start area is sidebar-wide, the toggle shows angles-left. */
export const Overview = {
    play: async ({ canvasElement, args }) => {
        const { bar, toggle, breadcrumb, help, avatar } = parts(canvasElement);
        await expectHeight(bar);
        await expectIcon(toggle(), 'angles-left');
        await expect(toggle()).toHaveAccessibleName('Close sidebar');
        await expect(toggle()).toHaveAttribute('aria-expanded', 'true');
        await expect(rect(toggle()).height, 'toggle is a 32 item').toBeCloseTo(token('--item-height-md'), 0);
        await expect(rect(toggle()).width, 'toggle is square').toBeCloseTo(rect(toggle()).height, 0);
        await expect(rect(toggle()).left - rect(bar).left, 'toggle sits at the container pad')
            .toBeCloseTo(token('--surface-container-pad'), 0);
        await expect(rect(breadcrumb()).left - rect(bar).left, 'docked: the breadcrumb starts at the sidebar width')
            .toBeCloseTo(token('--layout-width-sidebar'), 0);
        await expect(rect(avatar()).height, 'avatar at 32').toBeCloseTo(token('--item-height-md'), 0);
        await expect(rect(avatar()).left - rect(help()).right, 'end gap').toBeCloseTo(token('--element-inline-lg'), 0);
        await expect(within(avatar()).getByText('Lead')).toBeVisible();

        await userEvent.click(toggle());
        await expect(args.onToggle).toHaveBeenCalledTimes(1);
        await userEvent.click(help());
        await expect(args.onHelpClick).toHaveBeenCalledTimes(1);
    },
};

/** Closed: bars, and the breadcrumb follows the toggle. */
export const Closed = {
    args: { sidebar: 'closed', docked: false },
    play: async ({ canvasElement }) => {
        const { bar, toggle, breadcrumb } = parts(canvasElement);
        await expectHeight(bar);
        await expectIcon(toggle(), 'bars');
        await expect(toggle()).toHaveAccessibleName('Open sidebar');
        await expect(toggle()).toHaveAttribute('aria-expanded', 'false');
        await expect(rect(breadcrumb()).left - rect(toggle()).right, 'the breadcrumb follows the toggle')
            .toBeCloseTo(token('--element-inline-lg'), 0);
    },
};

/** Floating open: angles-left, and the breadcrumb still follows the toggle. */
export const Floating = {
    args: { sidebar: 'open', docked: false },
    play: async ({ canvasElement }) => {
        const { bar, toggle, breadcrumb } = parts(canvasElement);
        await expectIcon(toggle(), 'angles-left');
        await expect(toggle()).toHaveAttribute('aria-expanded', 'true');
        await expect(rect(breadcrumb()).left - rect(toggle()).right)
            .toBeCloseTo(token('--element-inline-lg'), 0);
    },
};

/** Without `onToggle`, and outside a surface container, there is no toggle. */
export const NoSidebar = {
    args: { onToggle: undefined },
    play: async ({ canvasElement }) => {
        const { toggle } = parts(canvasElement);
        await expect(toggle()).toBeNull();
    },
};

/** At 768 a long breadcrumb truncates on one line; Help Center and the avatar stay whole and on screen. */
export const LongBreadcrumbAt768 = {
    args: { sidebar: 'closed', docked: false, breadcrumbs: LONG_TRAIL },
    play: async ({ canvasElement }) => withTestViewport(768, 600, async () => {
        const { bar, breadcrumb, help, avatar } = parts(canvasElement);
        await expectHeight(bar);
        await expect(rect(bar).right, 'the bar fits the viewport').toBeLessThanOrEqual(window.innerWidth + 0.5);
        await expectEndInside(bar, help(), avatar(), breadcrumb());
        const list = breadcrumb().querySelector('ol');
        await expect(rect(list).height, 'the trail stays on one line').toBeCloseTo(token('--item-height-md'), 0);
        const current = within(breadcrumb()).getByText(LONG_TRAIL.at(-1).text);
        await expect(current.scrollWidth, 'the current page is cut short').toBeGreaterThan(current.clientWidth);
        await expect(getComputedStyle(current).textOverflow).toBe('ellipsis');
    }),
};

/** A long name truncates at the label cap; the avatar keeps its 32 height. */
export const LongName = {
    args: {
        sidebar: 'closed',
        docked: false,
        user: { name: 'Maximiliana Alexandra Constantinopoulou-Whitfield', type: 'lead tutor' },
    },
    play: async ({ canvasElement }) => withTestViewport(768, 600, async () => {
        const { bar, breadcrumb, help, avatar } = parts(canvasElement);
        await expectHeight(bar);
        await expect(rect(avatar()).height).toBeCloseTo(token('--item-height-md'), 0);
        const name = avatar().querySelector('.plus-user-avatar__name');
        await expect(rect(name).width, 'name caps at the label max width')
            .toBeLessThanOrEqual(token('--label-max-width') + 0.5);
        await expect(name.scrollWidth, 'the name is cut short').toBeGreaterThan(name.clientWidth);
        await expect(within(avatar()).getByText('Lead')).toBeVisible();
        await expectEndInside(bar, help(), avatar(), breadcrumb());
    }),
};

/** Loading keeps the toggle and holds skeletons where the breadcrumb and account go. */
export const Loading = {
    args: { loading: true },
    play: async ({ canvasElement }) => {
        const { bar, toggle } = parts(canvasElement);
        await expectHeight(bar);
        await expect(toggle()).not.toBeNull();
        await expect(within(canvasElement).queryByRole('navigation', { name: /breadcrumb/i })).toBeNull();
    },
};

/* ------------------------------------------------------- in the frame */

const Frame = (args) => (
    <div style={{ height: '100vh' }}>
        <SurfaceContainer
            topbar={<Topbar breadcrumbs={args.breadcrumbs} user={args.user} />}
            sidebar={<Sidebar user="tutor" activeTabId="home" />}
        />
    </div>
);

/**
 * Inside the surface container there is one toggle, and the frame drives it:
 * docked shows angles-left and a sidebar-wide start, a peek shows angles-left
 * with the breadcrumb beside the toggle, closed shows bars.
 */
export const InSurfaceContainer = {
    parameters: { layout: 'fullscreen' },
    render: Frame,
    play: async ({ canvasElement }) => withTestViewport(1024, 800, async () => {
        const canvas = within(canvasElement);
        const frame = canvasElement.querySelector('.plus-surface-container');
        const toggles = () => canvas.getAllByRole('button', { name: /sidebar$/i });
        const sidebar = () => canvas.queryByRole('complementary', { name: 'Sidebar' });
        const breadcrumb = () => canvas.getByRole('navigation', { name: /breadcrumb/i });
        const surface = frame.querySelector('.plus-surface-container__surface');

        await expect(toggles(), 'one toggle, not two').toHaveLength(1);
        const [toggle] = toggles();
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectIcon(toggle, 'angles-left');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(toggle).toHaveAccessibleName('Close sidebar');
        await expect(rect(breadcrumb()).left, 'docked: the breadcrumb lines up with the surface')
            .toBeCloseTo(rect(surface).left, 0);

        await userEvent.click(toggle);
        await waitFor(() => expect(sidebar()).toBeNull());
        await expectIcon(toggle, 'bars');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle).toHaveAccessibleName('Open sidebar');
        await expect(rect(breadcrumb()).left - rect(toggle).right)
            .toBeCloseTo(token('--element-inline-lg'), 0);

        // A peek floats the sidebar open: angles-left, and the breadcrumb does not move.
        const left = rect(breadcrumb()).left;
        await userEvent.hover(toggle);
        await waitFor(() => expect(sidebar()).not.toBeNull());
        await expectIcon(toggle, 'angles-left');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(rect(breadcrumb()).left, 'floating: the breadcrumb stays beside the toggle').toBeCloseTo(left, 0);
    }),
};
