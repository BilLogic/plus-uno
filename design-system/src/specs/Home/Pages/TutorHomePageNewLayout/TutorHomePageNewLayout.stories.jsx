/**
 * Home (new layout) stories: today's tutor Home recomposed on the new frame,
 * grid and type, in a one-off neutral palette.
 * Figma: the "Home (tutor)" example in BS4 Foundation › Patterns › Page templates.
 *
 * THE TEST SEAM IS THIS FILE. Each width story sets the viewport first, since
 * the layout tokens switch on `@media (min-width: …)`, then asserts what a
 * person sees: every block is a flat Section on the content grid, in reading
 * order; the lesson cards are the only cards, never nested, and render whole;
 * no text is clipped by its own box; the skills chart keeps its axis labels;
 * and the outline is one h1 with h2s and h3s under it. Expected lengths are
 * read from tokens, never typed in.
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

/**
 * Every block is a flat Section, straight on the grid, in reading order. The
 * lesson cards are the page's only cards, and no card holds a card.
 */
const expectStructure = async (canvasElement, list) => {
    await expect(list.map((b) => b.name), 'the grid holds the blocks and nothing else').toEqual(BLOCKS);
    for (const { el, name } of list) {
        await expect(el.classList.contains('plus-pattern-section'), `${name} is a Section`).toBe(true);
    }
    const cards = [...canvasElement.querySelectorAll('.plus-pattern-card, .card')];
    await expect(cards.length, 'a card for each lesson').toBe(3);
    for (const card of cards) {
        await expect(Boolean(card.closest('.plus-home-new__lesson')), 'only lessons are cards').toBe(true);
        await expect(Boolean(card.parentElement.closest('.plus-pattern-card, .card')), 'no card inside a card').toBe(false);
    }
};

/** Each block spans the content width, and the blocks run top to bottom in DOM order. */
const expectReadingOrder = async (box, list) => {
    let bottom = -Infinity;
    for (const { el, name } of list) {
        const r = rect(el);
        await expect(r.left, `${name} starts at the content's left edge`).toBeCloseTo(box.left, 0);
        await expect(r.width, `${name} spans the content`).toBeCloseTo(box.width, 0);
        await expect(r.top, `${name} sits below the block before it`).toBeGreaterThanOrEqual(bottom - 0.5);
        bottom = r.bottom;
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

/** The resolved color a CSS custom property names, as computed styles print it. */
const resolvedColor = (el, token) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    el.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
};

/** The skills chart shows 0 to 100 in quarters and every x label, inside its box, in the Primary blue. */
const expectChartAxes = async (canvasElement) => {
    const block = canvasElement.querySelector('[data-block="skills"]');
    await waitFor(() => expect(block.querySelectorAll('.highcharts-xaxis-labels text').length, 'every x label').toBe(5));
    const chart = block.querySelector('.highcharts-container');
    const box = rect(chart);
    const yLabels = [...chart.querySelectorAll('.highcharts-yaxis-labels text')];
    await expect(yLabels.map((t) => t.textContent), 'the score axis, 0 row included').toEqual(['0', '25', '50', '75', '100']);
    await expect(getComputedStyle(chart.querySelector('.highcharts-graph')).stroke, 'the line is the Primary role')
        .toBe(resolvedColor(block, '--color-primary'));
    for (const t of [...yLabels, ...chart.querySelectorAll('.highcharts-xaxis-labels text')]) {
        const r = rect(t);
        await expect(r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5, `"${t.textContent}" inside the chart`).toBe(true);
    }
    // LineChart's own box takes the height the page reads from the Size token.
    const frame = block.querySelector('.plus-home-new__chart > div');
    await expect(rect(frame).height, 'the chart holds its token height').toBeCloseTo(tokenLength(canvasElement, '--height-2000'), 0);
};

/** One h1, the header, then an h2 per section, the Skills subsection's h3 and an h3 per lesson. */
const expectOutline = async (canvasElement) => {
    const outline = [...canvasElement.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => [h.tagName.toLowerCase(), h.textContent]);
    await expect(outline).toEqual([
        ['h1', 'Welcome back, John'],
        ['h2', 'Next session'],
        ['h2', 'Your impact'],
        ['h3', 'Skills'],
        ['h2', 'Personalized recommendations'],
        ['h3', 'Reacting to Errors'],
        ['h3', 'Prompting Students to Explain'],
        ['h3', 'Giving Effective Praise'],
    ]);
};

/** Each lesson card in view spans whole columns, a whole number of them fill the strip, and none is clipped. */
const expectLessonsOnGrid = async (canvasElement, grid, perView) => {
    const strip = canvasElement.querySelector('.plus-home-new__lessons');
    const box = rect(content(canvasElement));
    const span = grid.columns / perView;
    for (const card of [...strip.children].slice(0, perView)) {
        await expect(rect(card).width, `a lesson card spans ${span} columns`).toBeCloseTo(spanWidth(span, box.width, grid), 0);
    }
    await expect(getComputedStyle(strip).getPropertyValue('--plus-home-new-cards-per-view').trim()).toBe(String(perView));

    // Each card shows its own decorative picture at 16:9.
    const pictures = [...strip.querySelectorAll('.plus-home-new__thumb')];
    await expect(pictures.length, 'a picture per lesson').toBe(strip.children.length);
    await expect(new Set(pictures.map((img) => img.getAttribute('src'))).size, 'no two lessons share a picture').toBe(pictures.length);
    for (const img of pictures) {
        await expect(img.getAttribute('alt'), 'the picture is decorative').toBe('');
        await expect(rect(img).width / rect(img).height, 'the picture is 16:9').toBeCloseTo(16 / 9, 1);
    }

    // The strip scrolls, so it clips at its padding box: every card in view sits whole inside it.
    const sb = rect(strip);
    const clip = { left: sb.left + strip.clientLeft, top: sb.top + strip.clientTop, right: sb.left + strip.clientLeft + strip.clientWidth, bottom: sb.top + strip.clientTop + strip.clientHeight };
    for (const li of [...strip.children].slice(0, perView)) {
        const cb = rect(li.firstElementChild);
        const inside = cb.left >= clip.left - 0.5 && cb.right <= clip.right + 0.5 && cb.top >= clip.top - 0.5 && cb.bottom <= clip.bottom + 0.5;
        await expect(inside, 'a lesson card renders whole inside the strip').toBe(true);
    }
};

/** Your impact's stats share one row from 1024, and stack below it. */
const expectStats = async (canvasElement, inRow) => {
    const stats = [...canvasElement.querySelectorAll('.plus-home-new__stat')].map(rect);
    await expect(stats.length, 'three stats').toBe(3);
    const sameRow = stats.every((r) => Math.abs(r.top - stats[0].top) < 1);
    await expect(sameRow, inRow ? 'the stats share a row' : 'the stats stack').toBe(inRow);
};

/** The checks every width runs; `expected` is what the tokens give there. */
const atWidth = (width, expected) => async ({ canvasElement }) => withTestViewport(width, HEIGHT, async () => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('heading', { level: 1 })).toBeTruthy());
    const box = rect(content(canvasElement));
    const grid = {
        gutter: tokenLength(canvasElement, '--layout-gutter'),
        columns: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--layout-columns'), 10),
    };
    await expect(box.width, 'content width').toBeCloseTo(tokenLength(canvasElement, '--layout-width-content'), 0);
    await expect(columnWidth(box.width, grid), 'a column').toBeGreaterThan(0);

    const list = blocks(canvasElement);
    await expectStructure(canvasElement, list);
    await expectReadingOrder(box, list);
    await waitFor(() => expect(getComputedStyle(canvasElement.querySelector('.plus-home-new__lessons')).getPropertyValue('--plus-home-new-cards-per-view').trim()).toBe(String(expected.lessonsPerView)));
    await expectLessonsOnGrid(canvasElement, grid, expected.lessonsPerView);
    await expectStats(canvasElement, expected.statsInRow);
    await expectChartAxes(canvasElement);
    await expectNoClippedText(list);
    await expectOutline(canvasElement);

    // Your impact opens on its first page, the ratings.
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

/** 768: content is 720; the header's actions and the stats stack, and two lessons fill a view. */
export const Medium768 = {
    play: atWidth(768, { lessonsPerView: 2, statsInRow: false, sidebarDocked: false }),
};

/** 1024: the sidebar docks; the stats share a row, two lessons per view. */
export const Large1024 = {
    play: atWidth(1024, { lessonsPerView: 2, statsInRow: true, sidebarDocked: true }),
};

/** 1440: three lessons fill a view. */
export const XLarge1440 = {
    play: atWidth(1440, { lessonsPerView: 3, statsInRow: true, sidebarDocked: true }),
};
