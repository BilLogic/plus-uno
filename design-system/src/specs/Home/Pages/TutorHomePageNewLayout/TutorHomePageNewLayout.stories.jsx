/**
 * Home (new layout) stories: today's tutor Home on the new frame, grid and type.
 * Figma: the "Home (tutor)" example in BS4 Foundation › Patterns › Page templates.
 *
 * THE TEST SEAM IS THIS FILE. Each width story sets the viewport first, since
 * the layout tokens switch on `@media (min-width: …)`, then asserts what a
 * person sees: every block starts and ends on a column of the content grid,
 * nothing runs past the content width, and the outline is one h1 with h2s
 * under it. Expected lengths are read from tokens, never typed in.
 */

import React from 'react';
import { expect, waitFor, within } from 'storybook/test';

import TutorHomePageNewLayout from './TutorHomePageNewLayout';
import { columnWidth } from './homeGrid';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';

const skillsOverviewData = {
    categories: [
        'Teaching Math',
        'Communicating Clearly',
        'Motivating Students',
        'Staying Positive',
        'Managing Time',
        'Fostering Participation',
    ],
    yourPerformance: [60, 55, 80, 90, 70, 85],
    averagePerformance: [70, 70, 65, 75, 60, 70],
};

const HEIGHT = 900;

export default {
    title: 'Specs/Home/Pages/Home (new layout)',
    component: TutorHomePageNewLayout,
    tags: ['!dev', '!autodocs'],
    args: {
        tutorName: 'John',
        userName: 'John Doe',
        userBadge: 'Lead',
    },
    argTypes: {
        tutorName: { control: 'text', table: { category: 'Content' } },
        userName: { control: 'text', table: { category: 'Content' } },
        userBadge: { control: 'select', options: ['Lead', 'Regular'], table: { category: 'Content' } },
        skillsOverviewData: { table: { disable: true } },
        skillsProgressData: { table: { disable: true } },
        recommendedLessons: { table: { disable: true } },
        sessionLinks: { table: { disable: true } },
        onReviewLesson: { table: { disable: true } },
        id: { table: { disable: true } },
        className: { table: { disable: true } },
        style: { table: { disable: true } },
    },
    render: (args) => (
        <div style={{ height: '100vh' }}>
            <TutorHomePageNewLayout {...args} skillsOverviewData={skillsOverviewData} />
        </div>
    ),
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Today\'s tutor Home rebuilt on the surface container, the 12-column content grid, the Section and Card patterns and the new type scale. Pick MD, LG or XL from the Breakpoint toolbar.',
            },
        },
    },
};

/* ------------------------------------------------------------- probes */

const rect = (el) => el.getBoundingClientRect();

const content = (canvasElement) => canvasElement.querySelector('.plus-surface-container__content');

/** Every block the page lays on the grid, with a name for the failure message. */
const blocks = (canvasElement) => [...canvasElement.querySelectorAll('.plus-home-new__block')].map((el) => ({
    el,
    name: el.querySelector('h1, h2')?.textContent || el.className.split(' ').find((c) => c.startsWith('plus-') && !c.startsWith('plus-home-new')) || el.className,
}));

/**
 * The block starts and ends on a column edge of the content grid, and stays
 * inside the content box; its contents do not run past its own edges.
 */
const expectOnGrid = async (box, gutter, columns, { el, name }) => {
    const col = columnWidth(box.width, { columns, gutter });
    const pitch = col + gutter;
    const r = rect(el);
    const start = (r.left - box.left) / pitch;
    const end = (r.right - box.left + gutter) / pitch;
    await expect(Math.abs(start - Math.round(start)) * pitch, `${name} starts on a column`).toBeLessThan(1);
    await expect(Math.abs(end - Math.round(end)) * pitch, `${name} ends on a column`).toBeLessThan(1);
    await expect(r.left, `${name} inside the content's left edge`).toBeGreaterThanOrEqual(box.left - 0.5);
    await expect(r.right, `${name} inside the content's right edge`).toBeLessThanOrEqual(box.right + 0.5);
    await expect(el.scrollWidth, `${name} does not overflow its width`).toBeLessThanOrEqual(el.clientWidth + 1);
    await expect(el.scrollHeight, `${name} does not overflow its height`).toBeLessThanOrEqual(el.clientHeight + 1);
};

/** No two blocks overlap. */
const expectNoOverlap = async (list) => {
    for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
            const a = rect(list[i].el);
            const b = rect(list[j].el);
            const overlap = a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
            await expect(overlap, `${list[i].name} and ${list[j].name} overlap`).toBe(false);
        }
    }
};

/** One h1, the greeting, then h2s: My Badge, Your Impact, Personalized Recommendations. */
const expectOutline = async (canvasElement) => {
    const outline = [...canvasElement.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => [h.tagName.toLowerCase(), h.textContent]);
    await expect(outline).toEqual([
        ['h1', 'Sign up for your next session, John!'],
        ['h2', 'My Badge'],
        ['h2', 'Your Impact'],
        ['h2', 'Personalized Recommendations'],
    ]);
};

/** Each lesson card in view spans whole columns, and a whole number of them fill the strip. */
const expectLessonsOnGrid = async (canvasElement, gutter, columns, perView) => {
    const strip = canvasElement.querySelector('.plus-home-new__lessons');
    const box = rect(content(canvasElement));
    const cards = [...strip.children];
    const col = columnWidth(box.width, { columns, gutter });
    const span = columns / perView;
    for (const card of cards.slice(0, perView)) {
        await expect(rect(card).width, `a lesson card spans ${span} columns`).toBeCloseTo(span * col + (span - 1) * gutter, 0);
    }
    await expect(getComputedStyle(strip).getPropertyValue('--plus-home-new-cards-per-view').trim()).toBe(String(perView));
};

/**
 * The checks every width runs; `expected` is what the formulas give there, so
 * a change to the tokens or the formulas shows up as a named difference.
 */
const atWidth = (width, expected) => async ({ canvasElement }) => withTestViewport(width, HEIGHT, async () => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('heading', { level: 1 })).toBeTruthy());
    const box = rect(content(canvasElement));
    const gutter = tokenLength(canvasElement, '--layout-gutter');
    const columns = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--layout-columns'), 10);
    await expect(box.width, 'content width').toBeCloseTo(tokenLength(canvasElement, '--layout-width-content'), 0);

    const list = blocks(canvasElement);
    await waitFor(() => expect(rect(list[0].el).width, 'the greeting').toBeCloseTo(
        expected.greetingMain * columnWidth(box.width, { columns, gutter }) + (expected.greetingMain - 1) * gutter, 0,
    ));
    for (const block of list) await expectOnGrid(box, gutter, columns, block);
    await expectNoOverlap(list);
    await expectLessonsOnGrid(canvasElement, gutter, columns, expected.lessonsPerView);
    await expectOutline(canvasElement);

    // The tutor sidebar, with Home selected, docks from 1024; below it is closed.
    const sidebar = canvas.queryByRole('complementary', { name: 'Sidebar' });
    if (expected.sidebarDocked) {
        await expect(sidebar, 'the sidebar docks').not.toBeNull();
        await expect(within(sidebar).getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    } else {
        await expect(sidebar, 'the sidebar is closed').toBeNull();
    }
});

/* ------------------------------------------------------------- stories */

export const Overview = {};

/** 768: content is 720, too narrow for a main column of 480 beside a side of 224, so both rows stack. */
export const Medium768 = {
    play: atWidth(768, { greetingMain: 12, lessonsPerView: 2, sidebarDocked: false }),
};

/** 1024: the sidebar docks; the badge takes 4 columns to reach 224, Your Impact 4, two lessons per view. */
export const Large1024 = {
    play: atWidth(1024, { greetingMain: 8, lessonsPerView: 2, sidebarDocked: true }),
};

/** 1440: the badge fits in 3 columns, Your Impact in 4, and three lessons fill a view. */
export const XLarge1440 = {
    play: atWidth(1440, { greetingMain: 9, lessonsPerView: 3, sidebarDocked: true }),
};
