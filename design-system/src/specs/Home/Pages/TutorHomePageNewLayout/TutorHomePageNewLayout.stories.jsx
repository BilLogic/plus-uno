/**
 * Home (new layout) stories: today's tutor Home on the new frame, grid and type.
 * Figma: the "Home (tutor)" example in BS4 Foundation › Patterns › Page templates.
 *
 * THE TEST SEAM IS THIS FILE. Each width story sets the viewport first, since
 * the layout tokens switch on `@media (min-width: …)`, then asserts what a
 * person sees: every block is a Section or Card pattern placed straight on
 * the content grid, on whole columns where the formulas put it; no card sits
 * in a card; no text is clipped by its own box; the skills chart keeps its
 * axis labels and its 0 row; and the outline is one h1 with h2s and h3s
 * under it. Expected lengths are read from tokens, never typed in.
 */

import React from 'react';
import { expect, waitFor, within } from 'storybook/test';

import TutorHomePageNewLayout from './TutorHomePageNewLayout';
import { BLOCKS, columnWidth, spanWidth } from './homeGrid';
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

/** The content grid's children: the blocks, by name. */
const blocks = (canvasElement) => [...content(canvasElement).children].map((el) => ({ el, name: el.dataset.block || el.className }));

/** Every block is a Section or Card pattern, straight on the grid, in reading order; no card holds a card. */
const expectPatterns = async (canvasElement, list) => {
    await expect(list.map((b) => b.name), 'the grid holds the blocks and nothing else').toEqual(BLOCKS);
    for (const { el, name } of list) {
        const pattern = el.classList.contains('plus-pattern-section') || el.classList.contains('plus-pattern-card');
        await expect(pattern, `${name} is a Section or Card pattern`).toBe(true);
    }
    const nested = canvasElement.querySelectorAll('.plus-pattern-card .plus-pattern-card, .plus-pattern-card .card');
    await expect(nested.length, 'no card inside a card').toBe(0);
    // One elevation for every card on the page: the Card pattern's level 1.
    const shadows = new Set([...canvasElement.querySelectorAll('.plus-pattern-card')].map((c) => getComputedStyle(c).boxShadow));
    await expect([...shadows].length, 'every card has the same elevation').toBe(1);
    await expect([...shadows][0], 'and it is not flat').not.toBe('none');
};

/** Cards side by side stretch to the tallest in their row, as the Card pattern says; the badge hugs. */
const expectRowHeights = async (list, stacked) => {
    const block = (name) => rect(list.find((b) => b.name === name).el);
    if (!stacked) await expect(block('impact').height, 'Your Impact takes the skills card\'s height').toBeCloseTo(block('skills').height, 0);
    const badge = list.find((b) => b.name === 'badge').el;
    // Hugging: its box is exactly its content, the cell's leftover height below it.
    const inner = badge.querySelector('.plus-pattern-card-inner');
    await expect(badge.clientHeight, 'My Badge hugs its content').toBeCloseTo(inner.getBoundingClientRect().height, 0);
};

/** The block sits where the formula put it: on column edges, `span` columns wide, inside the content box. */
const expectPlaced = async (box, grid, { el, name }, [start, span, row]) => {
    await expect(el.style.gridColumn, `${name}'s columns`).toBe(`${start} / span ${span}`);
    await expect(el.style.gridRow, `${name}'s row`).toBe(String(row));
    const r = rect(el);
    const pitch = columnWidth(box.width, grid) + grid.gutter;
    await expect(r.left - box.left, `${name} starts on column ${start}`).toBeCloseTo((start - 1) * pitch, 0);
    await expect(r.width, `${name} spans ${span} columns`).toBeCloseTo(spanWidth(span, box.width, grid), 0);
    await expect(r.right, `${name} inside the content's right edge`).toBeLessThanOrEqual(box.right + 0.5);
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

/**
 * No text is clipped by its own box: every element in a block that holds text
 * of its own and lays out as a box fits its content in both directions. Text
 * kept for screen readers only (the chart's description) is clipped by design.
 */
const screenReaderOnly = (el, block) => {
    for (let node = el; node && node !== block; node = node.parentElement) {
        const css = getComputedStyle(node);
        if (css.position === 'absolute' && css.clip !== 'auto') return true;
    }
    return false;
};
const expectNoClippedText = async (list) => {
    for (const { el: block, name } of list) {
        const holders = [block, ...block.querySelectorAll('*')].filter((el) => !(el instanceof SVGElement)
            && !screenReaderOnly(el, block)
            && [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
            && getComputedStyle(el).display !== 'inline'
            && el.clientWidth > 0);
        for (const el of holders) {
            const label = `${name}: "${el.textContent.trim().slice(0, 40)}"`;
            await expect(el.scrollWidth, `${label} fits its width`).toBeLessThanOrEqual(el.clientWidth + 1);
            await expect(el.scrollHeight, `${label} fits its height`).toBeLessThanOrEqual(el.clientHeight + 1);
        }
    }
};

/** The skills chart keeps its 0 row and every x label, each inside the chart's box. */
const expectChartAxes = async (canvasElement) => {
    const block = canvasElement.querySelector('[data-block="skills"]');
    await waitFor(() => expect(block.querySelectorAll('.highcharts-xaxis-labels text').length, 'every x label').toBe(5));
    const chart = block.querySelector('.highcharts-container');
    const box = rect(chart);
    const yLabels = [...chart.querySelectorAll('.highcharts-yaxis-labels text')];
    await expect(yLabels.map((t) => t.textContent), 'the score axis, 0 row included').toEqual(['0', '25', '50', '75', '100']);
    await expect(getComputedStyle(chart.querySelector('.highcharts-graph')).stroke, 'the line is the Secondary role')
        .toBe(getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim().replace(/^#(..)(..)(..)$/, (_, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`));
    for (const t of [...yLabels, ...chart.querySelectorAll('.highcharts-xaxis-labels text')]) {
        const r = rect(t);
        await expect(r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5, `"${t.textContent}" inside the chart`).toBe(true);
    }
    // LineChart's own box takes the height the page reads from the Size token.
    const frame = block.querySelector('.plus-home-new__chart > div');
    await expect(rect(frame).height, 'the chart holds its token height').toBeCloseTo(tokenLength(canvasElement, '--height-2000'), 0);
};

/** One h1, the greeting, then h2s for the cards and sections, and an h3 for each lesson. */
const expectOutline = async (canvasElement) => {
    const outline = [...canvasElement.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => [h.tagName.toLowerCase(), h.textContent]);
    await expect(outline).toEqual([
        ['h1', 'Sign up for your next session, John!'],
        ['h2', 'My Badge'],
        ['h2', 'Your Impact'],
        ['h2', 'Personalized Recommendations'],
        ['h3', 'Lesson Title'],
        ['h3', 'Lesson Title'],
        ['h3', 'Lesson Title'],
    ]);
};

/** Each lesson card in view spans whole columns, and a whole number of them fill the strip. */
const expectLessonsOnGrid = async (canvasElement, grid, perView) => {
    const strip = canvasElement.querySelector('.plus-home-new__lessons');
    const box = rect(content(canvasElement));
    const span = grid.columns / perView;
    for (const card of [...strip.children].slice(0, perView)) {
        await expect(rect(card).width, `a lesson card spans ${span} columns`).toBeCloseTo(spanWidth(span, box.width, grid), 0);
    }
    await expect(getComputedStyle(strip).getPropertyValue('--plus-home-new-cards-per-view').trim()).toBe(String(perView));

    // The strip scrolls, so it clips at its padding box: every card in view sits whole inside it.
    const sb = rect(strip);
    const clip = { left: sb.left + strip.clientLeft, top: sb.top + strip.clientTop, right: sb.left + strip.clientLeft + strip.clientWidth, bottom: sb.top + strip.clientTop + strip.clientHeight };
    for (const li of [...strip.children].slice(0, perView)) {
        const cb = rect(li.firstElementChild);
        const inside = cb.left >= clip.left - 0.5 && cb.right <= clip.right + 0.5 && cb.top >= clip.top - 0.5 && cb.bottom <= clip.bottom + 0.5;
        await expect(inside, 'a lesson card renders whole inside the strip').toBe(true);
    }
};

/**
 * The checks every width runs; `expected` is what the formulas give there,
 * as [start column, span, row] per block, so a change to the tokens or the
 * formulas shows up as a named difference.
 */
const atWidth = (width, expected) => async ({ canvasElement }) => withTestViewport(width, HEIGHT, async () => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('heading', { level: 1 })).toBeTruthy());
    const box = rect(content(canvasElement));
    const grid = {
        gutter: tokenLength(canvasElement, '--layout-gutter'),
        columns: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--layout-columns'), 10),
    };
    await expect(box.width, 'content width').toBeCloseTo(tokenLength(canvasElement, '--layout-width-content'), 0);

    const list = blocks(canvasElement);
    await expectPatterns(canvasElement, list);
    await waitFor(() => expect(list[0].el.style.gridColumn, 'the formulas have run').toBe(`1 / span ${expected.greeting[1]}`));
    for (const block of list) await expectPlaced(box, grid, block, expected[block.name]);
    await expectNoOverlap(list);
    await expectRowHeights(list, expected.greeting[1] === grid.columns);
    await expectLessonsOnGrid(canvasElement, grid, expected.lessonsPerView);
    await expectChartAxes(canvasElement);
    await expectNoClippedText(list);
    await expectOutline(canvasElement);

    // Your Impact opens on its first page, the ratings.
    await expect(within(list.find((b) => b.name === 'impact').el).getByText('Student Interaction Rating')).toBeTruthy();

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

/**
 * 768: content is 720, too narrow for a main column of 480 beside a side of
 * 224, so the blocks stack one per row in reading order.
 */
export const Medium768 = {
    play: atWidth(768, {
        greeting: [1, 12, 1],
        badge: [1, 12, 2],
        skills: [1, 12, 3],
        impact: [1, 12, 4],
        lessons: [1, 12, 5],
        lessonsPerView: 2,
        sidebarDocked: false,
    }),
};

/** 1024: the sidebar docks; the badge takes 4 columns to reach 224, Your Impact 4, two lessons per view. */
export const Large1024 = {
    play: atWidth(1024, {
        greeting: [1, 8, 1],
        badge: [9, 4, 1],
        impact: [9, 4, 2],
        skills: [1, 8, 2],
        lessons: [1, 12, 3],
        lessonsPerView: 2,
        sidebarDocked: true,
    }),
};

/** 1440: the badge fits in 3 columns, Your Impact in 4, and three lessons fill a view. */
export const XLarge1440 = {
    play: atWidth(1440, {
        greeting: [1, 9, 1],
        badge: [10, 3, 1],
        impact: [9, 4, 2],
        skills: [1, 8, 2],
        lessons: [1, 12, 3],
        lessonsPerView: 3,
        sidebarDocked: true,
    }),
};
