import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Carousel from './Carousel';

export default {
    title: 'Components/Layout and structure/Carousel',
    component: Carousel,
    tags: ['!dev', '!autodocs'],
    args: { onSlideChange: fn() },
    parameters: {
        docs: {
            description: {
                component: 'A centered stage of slides in a flat row, with a play button in a progress ring, a progress pill per slide and a caption that changes with the slide.',
            },
        },
    },
    argTypes: {
        slides: { table: { disable: true } },
        style: { table: { disable: true } },
        className: { table: { disable: true } },
        onSlideChange: { table: { disable: true } },
        defaultIndex: { table: { disable: true } },
        'aria-label': { table: { disable: true } },
        'aria-labelledby': { table: { disable: true } },
        autoplay: { control: 'boolean', table: { category: 'Behavior' } },
        interval: { control: { type: 'number', min: 2000, max: 12000, step: 500 }, table: { category: 'Behavior' } },
        loop: { control: 'boolean', table: { category: 'Behavior' } },
        peek: { control: 'boolean', table: { category: 'Layout' } },
        aspectRatio: { control: { type: 'number', min: 1, max: 2.4, step: 0.1 }, table: { category: 'Layout' } },
    },
};

/* ------------------------------------------------------------------ content */

const SlideArt = ({ accent, icon, eyebrow }) => (
    <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--stack-lg)',
        background: `var(--ds-background-accent-${accent}-subtler)`,
        color: `var(--ds-icon-accent-${accent})`,
    }}>
        <i className={`fa-solid fa-${icon}`} aria-hidden="true" style={{ fontSize: 'var(--font-size-200)' }} />
        <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text-subtle)' }}>{eyebrow}</span>
    </div>
);

const featureSlides = [
    {
        id: 'session-prep',
        title: 'Prep a session in two minutes',
        description: 'Open a student before you join and see their goals, last notes and the lesson you planned.',
        media: <SlideArt accent="blue" icon="clipboard-list" eyebrow="Session prep" />,
    },
    {
        id: 'reflection',
        title: 'Reflect while it is fresh',
        description: 'A short reflection after each session records what worked and what to try next time.',
        media: <SlideArt accent="green" icon="pen-to-square" eyebrow="Reflection" />,
    },
    {
        id: 'training',
        title: 'Training that fits between sessions',
        description: 'Lessons run ten minutes or less, so you can finish one in the gap before your next student.',
        media: <SlideArt accent="purple" icon="graduation-cap" eyebrow="Training" />,
    },
    {
        id: 'skills',
        title: 'See your skills grow',
        description: 'Each lesson you finish and each session you reflect on fills in your skills profile.',
        media: <SlideArt accent="orange" icon="chart-line" eyebrow="Skills" />,
    },
    {
        id: 'schedule',
        title: 'Your week at a glance',
        description: 'Upcoming sessions, open shifts and call-offs sit on one schedule you can check from your phone.',
        media: <SlideArt accent="teal" icon="calendar-days" eyebrow="Schedule" />,
    },
];

const frame = { width: '100%' };

const CarouselFrame = (props) => (
    <div style={frame}>
        <Carousel aria-label="What's new for tutors" slides={featureSlides} {...props} />
    </div>
);

/* ----------------------------------------------------------------- examples */

/** Autoplay: the ring round the play button fills over each slide's time, then the next slide comes to the front. */
export const Overview = {
    render: (args) => <CarouselFrame {...args} />,
    args: { autoplay: true, interval: 5000 },
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.carousel } } },
};

/** Autoplay off: arrows on either side of the dots, and the slides wait to be chosen. */
export const Static = {
    render: (args) => <CarouselFrame {...args} />,
    args: { autoplay: false },
};

/** Without `loop`, the arrows stop at the first and last slide. */
export const NoLoop = {
    render: (args) => <CarouselFrame {...args} />,
    args: { autoplay: false, loop: false },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
        // The first slide has no neighbor on its left: nothing wraps round.
        await expect(slideAt(canvasElement, 4)).toHaveClass('plus-carousel-slide--away');
        await userEvent.click(canvas.getByRole('button', { name: /^Slide 5 of 5/ }));
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Next slide' })).toBeDisabled());
        await expect(slideAt(canvasElement, 0)).toHaveClass('plus-carousel-slide--away');
    },
};

/** Two slides: no neighbor wraps round, so one side of the stage stays open. */
export const FewSlides = {
    render: (args) => <CarouselFrame {...args} slides={featureSlides.slice(0, 2)} />,
    args: { autoplay: true },
};

/* Reduced motion is the viewer's setting, so the story fakes the query for
   as long as it is on screen. */
/*
 * The clock stories share one browser page with every other story file, so
 * they set their own ground: full motion (another file may have emulated
 * reduced motion), the carousel counted as in view, and the pointer off the
 * stage (it may rest wherever the last file left it).
 */
const clockReady = () => {
    const realMatch = window.matchMedia;
    const realObserver = window.IntersectionObserver;
    window.matchMedia = (query) => ({
        ...realMatch.call(window, query),
        matches: query.includes('prefers-reduced-motion') ? false : realMatch.call(window, query).matches,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
    });
    window.IntersectionObserver = class {
        constructor(callback) { this.callback = callback; }
        observe(target) {
            this.callback([{ isIntersecting: true, intersectionRatio: 1, intersectionRect: target.getBoundingClientRect(), target }]);
        }
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
    };
    return () => {
        window.matchMedia = realMatch;
        window.IntersectionObserver = realObserver;
    };
};

const pointerOffStage = async (canvasElement) => {
    await userEvent.unhover(canvasElement.querySelector('.plus-carousel-stage'));
};

// Waits for the clock to pass `min`. The real cursor's hover can land after
// the story's own unhover, so each check takes the pointer off the stage again.
const clockPasses = (canvasElement, min) => waitFor(async () => {
    await pointerOffStage(canvasElement);
    expect(progressOf(canvasElement)).toBeGreaterThan(min);
}, { timeout: 4000 });

const fakeReducedMotion = () => {
    const real = window.matchMedia;
    window.matchMedia = (query) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    });
    return () => { window.matchMedia = real; };
};

/** Reduced motion: no autoplay, no play button or ring, the active pill full; arrows show and every move is instant. */
export const ReducedMotion = {
    render: (args) => <CarouselFrame {...args} />,
    args: { autoplay: true, interval: 500 },
    beforeEach: fakeReducedMotion,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('button', { name: /^(Pause|Play)$/ })).toBeNull();
        await expect(canvas.getByRole('button', { name: 'Previous slide' })).toBeVisible();
        await expect(canvas.getByRole('button', { name: 'Next slide' })).toBeVisible();
        await expect(canvasElement.querySelector('.plus-carousel-ring')).toBeNull();
        await waitFor(() => expect(pillFillScale(canvasElement.querySelector('.plus-carousel-pill--active'))).toBe(1));

        // Nothing moves on its own, even past several intervals.
        await new Promise((resolve) => setTimeout(resolve, 1200));
        await expect(activeLabel(canvasElement)).toBe('1 of 5');

        // The same flat row, with no movement between places.
        await expect(getComputedStyle(slideAt(canvasElement, 1)).transitionDuration).toBe('0s');

        await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
        await waitFor(() => expect(activeLabel(canvasElement)).toBe('2 of 5'));
    },
};

/** Change the props in the table below. */
export const Interactive = {
    render: (args) => <CarouselFrame {...args} />,
    args: { autoplay: true, interval: 5000, loop: true, aspectRatio: 1.6 },
};

/** Without `peek`, only the current slide shows. */
export const NoPeek = {
    render: (args) => <CarouselFrame {...args} />,
    args: { autoplay: false, peek: false },
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-carousel')).toHaveClass('plus-carousel--no-peek');
        await waitFor(() => expect(getComputedStyle(slideAt(canvasElement, 1)).visibility).toBe('hidden'));
    },
};

/* -------------------------------------------------------------------- tests */

const progressOf = (canvasElement) => parseFloat(
    canvasElement.querySelector('.plus-carousel').style.getPropertyValue('--carousel-progress') || '0'
);
const slideAt = (canvasElement, k) => canvasElement.querySelectorAll('.plus-carousel-slide')[k];
const activeLabel = (canvasElement) => (
    canvasElement.querySelector('.plus-carousel-slide:not([aria-hidden])')?.getAttribute('aria-label')
);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The pause button stops the clock where it is; Play picks it up from there. */
export const PauseStopsProgress = {
    render: () => <CarouselFrame interval={3000} />,
    beforeEach: clockReady,
    play: async ({ canvasElement }) => {
        await pointerOffStage(canvasElement);
        const canvas = within(canvasElement);
        await clockPasses(canvasElement, 0.03);

        const pause = canvas.getByRole('button', { name: 'Pause' });
        await expect(pause).not.toHaveAttribute('aria-pressed');
        pause.click();
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Play' })).toBeTruthy());
        await expect(canvasElement.querySelector('.plus-carousel')).toHaveClass('plus-carousel--paused');

        const held = progressOf(canvasElement);
        await wait(400);
        await expect(progressOf(canvasElement)).toBe(held);

        canvas.getByRole('button', { name: 'Play' }).click();
        await waitFor(() => expect(progressOf(canvasElement)).toBeGreaterThan(held), { timeout: 4000 });
        await expect(canvas.getByRole('button', { name: 'Pause' })).toBeTruthy();
    },
};

/** Choosing a pill moves to its slide and starts that slide's clock over; it does not pause. */
export const DotRestartsClock = {
    render: () => <CarouselFrame interval={3000} />,
    beforeEach: clockReady,
    play: async ({ canvasElement }) => {
        await pointerOffStage(canvasElement);
        const canvas = within(canvasElement);
        await clockPasses(canvasElement, 0.1);

        const third = canvas.getByRole('button', { name: 'Slide 3 of 5: Training that fits between sessions' });
        await userEvent.click(third);
        await waitFor(() => expect(third).toHaveAttribute('aria-current', 'true'));
        await expect(activeLabel(canvasElement)).toBe('3 of 5');
        await expect(progressOf(canvasElement)).toBeLessThan(0.1);

        await expect(canvas.getByRole('button', { name: 'Pause' })).toBeTruthy();
        await clockPasses(canvasElement, 0.03);
    },
};

/** ArrowRight and ArrowLeft on the region move a slide either way. */
export const ArrowKeysMove = {
    render: () => <CarouselFrame autoplay={false} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByRole('region', { name: "What's new for tutors" }).focus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(activeLabel(canvasElement)).toBe('2 of 5'));
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        await waitFor(() => expect(activeLabel(canvasElement)).toBe('5 of 5'));
    },
};

/** The pointer resting on the stage holds the clock; leaving lets it run on. */
export const HoverHolds = {
    render: () => <CarouselFrame interval={3000} />,
    beforeEach: clockReady,
    play: async ({ canvasElement }) => {
        await pointerOffStage(canvasElement);
        await clockPasses(canvasElement, 0.03);
        const stage = canvasElement.querySelector('.plus-carousel-stage');

        await userEvent.hover(stage);
        await wait(50);
        const held = progressOf(canvasElement);
        await wait(400);
        await expect(progressOf(canvasElement)).toBe(held);

        await userEvent.unhover(stage);
        await waitFor(() => expect(progressOf(canvasElement)).toBeGreaterThan(held), { timeout: 4000 });
    },
};

/** Only the active slide is in the accessibility tree; the others are hidden and inert. */
export const InactiveSlidesHidden = {
    render: () => <CarouselFrame autoplay={false} />,
    play: async ({ canvasElement }) => {
        const slides = [...canvasElement.querySelectorAll('.plus-carousel-slide')];
        await expect(slides).toHaveLength(5);
        slides.forEach((slide, k) => {
            expect(slide).toHaveAttribute('role', 'group');
            expect(slide).toHaveAttribute('aria-roledescription', 'slide');
            expect(slide).toHaveAttribute('aria-label', `${k + 1} of 5`);
            const card = slide.querySelector('.plus-carousel-card');
            if (k === 0) {
                expect(slide).not.toHaveAttribute('aria-hidden');
                expect(card.inert).toBe(false);
            } else {
                expect(slide).toHaveAttribute('aria-hidden', 'true');
                expect(card.inert).toBe(true);
            }
        });

        // A neighbor is a way forward for a pointer: clicking it brings it to the front.
        slideAt(canvasElement, 1).click();
        await waitFor(() => expect(activeLabel(canvasElement)).toBe('2 of 5'));
    },
};

/** The region is named, announced as a carousel, and its caption speaks only when it is not autoplaying. */
export const RegionIsNamed = {
    render: () => <CarouselFrame autoplay={false} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const region = canvas.getByRole('region', { name: "What's new for tutors" });
        await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
        await expect(canvas.getByRole('group', { name: 'Choose a slide' })).toBeTruthy();
        await expect(canvasElement.querySelector('.plus-carousel-caption')).toHaveAttribute('aria-live', 'polite');
    },
};

/** One neighbor each side in a flat row; the rest wait off stage, and the ring wraps round. */
export const NeighborsWrap = {
    render: () => <CarouselFrame autoplay={false} />,
    play: async ({ canvasElement }) => {
        const offsets = [...canvasElement.querySelectorAll('.plus-carousel-slide')]
            .map((slide) => slide.style.getPropertyValue('--carousel-offset'));
        await expect(offsets).toEqual(['0', '1', '2', '-2', '-1']);
        await expect(slideAt(canvasElement, 4)).not.toHaveClass('plus-carousel-slide--away');
        await expect(slideAt(canvasElement, 2)).toHaveClass('plus-carousel-slide--away');
        await expect(getComputedStyle(slideAt(canvasElement, 1)).transform).not.toContain('matrix3d');
    },
};

const pillFillScale = (pill) => new DOMMatrixReadOnly(
    getComputedStyle(pill.querySelector('.plus-carousel-pill-fill')).transform
).a;

/** The active slide is a 32px pill whose fill grows on the ring's clock; the others are 8px dots. */
export const PillFills = {
    render: () => <CarouselFrame interval={3000} />,
    beforeEach: clockReady,
    play: async ({ canvasElement }) => {
        await pointerOffStage(canvasElement);
        const pills = [...canvasElement.querySelectorAll('.plus-carousel-pill')];
        await expect(pills).toHaveLength(5);
        await expect(pills[0]).toHaveAttribute('aria-current', 'true');
        await waitFor(() => expect(pills[0].querySelector('.plus-carousel-pill-track').getBoundingClientRect().width).toBe(32));
        await expect(pills[1].querySelector('.plus-carousel-pill-track').getBoundingClientRect().width).toBe(8);

        await clockPasses(canvasElement, 0.1);
        await waitFor(() => expect(pillFillScale(pills[0])).toBeGreaterThan(0.05));
        // The pill and the ring read the same clock.
        await expect(Math.abs(pillFillScale(pills[0]) - progressOf(canvasElement))).toBeLessThan(0.1);
        await expect(pillFillScale(pills[1])).toBe(0);
    },
};

/** Without autoplay the active pill shows full. */
export const StaticPillFull = {
    render: () => <CarouselFrame autoplay={false} />,
    play: async ({ canvasElement }) => {
        const active = canvasElement.querySelector('.plus-carousel-pill--active');
        await waitFor(() => expect(pillFillScale(active)).toBe(1));
    },
};
