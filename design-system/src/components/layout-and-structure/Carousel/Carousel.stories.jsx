import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, userEvent, within } from 'storybook/test';
import Carousel from './Carousel';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { probe, tokenColor } from '@/storybook-docs/lib/style-probes.js';

export default {
    title: 'Components/Layout and structure/Carousel',
    component: Carousel,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Carousel component for displaying a rotating set of content slides. Supports controls, indicators, and captions.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        slideCount: {
            control: { type: 'range', min: 2, max: 6, step: 1 },
            description: 'Number of slides to display',
            table: { category: 'Content' }
        },
        showCaptions: {
            control: 'boolean',
            description: 'Show label and description text inside each slide',
            table: { category: 'Content' }
        },
        controls: {
            control: 'boolean',
            description: 'Show previous/next navigation controls',
            table: { category: 'Behavior' }
        },
        indicators: {
            control: 'boolean',
            description: 'Show slide position indicators',
            table: { category: 'Behavior' }
        },
        interval: {
            control: { type: 'number', min: 1000, max: 10000, step: 500 },
            description: 'Auto-advance interval in milliseconds (0 to disable)',
            table: { category: 'Behavior' }
        },
        wrap: {
            table: { disable: true, category: 'Behavior' }
        },
        pause: {
            table: { disable: true, category: 'Behavior' }
        },
        keyboard: {
            table: { disable: true, category: 'Behavior' }
        },
        slide: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        prevIcon: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        nextIcon: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        activeIndex: {
            table: { disable: true, category: 'Development' }
        },
        onSelect: {
            table: { disable: true, category: 'Development' }
        },
        slides: {
            table: { disable: true, category: 'Development' }
        },}
};

const createSlideContent = (text, bgColor) => (
    <div style={{
        height: '300px',
        width: '100%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontFamily: 'var(--type-family-heading)',
        color: 'var(--ds-text)'
    }}>
        {text}
    </div>
);

const createLabeledSlideContent = (text, bgColor, label, description) => (
    <div style={{
        height: '300px',
        width: '100%',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px 60px',
        color: 'var(--ds-text)'
    }}>
        <div style={{
            flex: '1 0 auto',
            display: 'flex',
            alignItems: 'center',
            fontSize: '2rem',
            fontFamily: 'var(--type-family-heading)',
            textAlign: 'center'
        }}>
            {text}
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            textAlign: 'center',
            paddingBottom: '16px'
        }}>
            <span style={{
                fontSize: 'var(--font-size-125)',
                lineHeight: 'var(--line-height-150)',
                fontWeight: 'var(--type-weight-semibold)',
                fontFamily: 'var(--type-family-heading)'
            }}>
                {label}
            </span>
            <span style={{
                fontSize: 'var(--font-size-100)',
                lineHeight: 'var(--line-height-150)',
                fontWeight: 'var(--type-weight-regular)',
                fontFamily: 'var(--type-family-body)',
                color: 'var(--ds-text-subtle)'
            }}>
                {description}
            </span>
        </div>
    </div>
);

const slideColors = [
    'var(--ds-surface-container)',
    'var(--ds-background-neutral-hovered)',
    'var(--ds-background-neutral-pressed)',
    'var(--ds-background-selected)',
    'var(--ds-background-neutral)',
    'var(--ds-background-accent-teal-subtler)'
];

const slideLabels = ['First Slide', 'Second Slide', 'Third Slide', 'Fourth Slide', 'Fifth Slide', 'Sixth Slide'];

const carouselCol = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' };

const threeSlides = [
    { content: createSlideContent('First Slide', slideColors[0]) },
    { content: createSlideContent('Second Slide', slideColors[1]) },
    { content: createSlideContent('Third Slide', slideColors[2]) }
];

const labeledSlides = [
    {
        content: createLabeledSlideContent(
            'First Slide',
            slideColors[0],
            'First slide label',
            'Some representative placeholder content for the first slide.'
        )
    },
    {
        content: createLabeledSlideContent(
            'Second Slide',
            slideColors[1],
            'Second slide label',
            'Some representative placeholder content for the second slide.'
        )
    },
    {
        content: createLabeledSlideContent(
            'Third Slide',
            slideColors[2],
            'Third slide label',
            'Some representative placeholder content for the third slide.'
        )
    }
];

function CarouselContentDemos() {
    return (
        <>
            <section>
                <Carousel slides={threeSlides} controls={false} indicators={false} />
            </section>
            <section style={{ marginTop: '32px' }}>
                <Carousel slides={threeSlides} controls indicators />
            </section>
            <section style={{ marginTop: '32px' }}>
                <Carousel slides={labeledSlides} controls={false} indicators />
            </section>
        </>
    );
}

export const Content = () => (
    <div style={carouselCol}>
        <CarouselContentDemos />
    </div>
);

function renderCarouselPlayground(args) {
    const slides = Array.from({ length: args.slideCount || 3 }, (_, i) => ({
        content: args.showCaptions
            ? createLabeledSlideContent(
                slideLabels[i],
                slideColors[i % slideColors.length],
                `${slideLabels[i]} label`,
                'Some representative placeholder content for this slide.'
            )
            : createSlideContent(slideLabels[i], slideColors[i % slideColors.length])
    }));

    return (
        <div style={{ width: '100%' }}>
            <Carousel
                controls={args.controls}
                indicators={args.indicators}
                interval={args.interval}
                slides={slides}
            />
        </div>
    );
}

/** Hero: controls + indicators on, no auto-advance noise in docs. */
const overviewCarouselArgs = {
    controls: true,
    indicators: true,
    interval: 0,
    slideCount: 3,
    showCaptions: false,
};

/** Playground defaults: tweak slide count, labels, and timing from Controls. */
const carouselPlaygroundArgs = {
    controls: true,
    indicators: true,
    interval: 5000,
    slideCount: 4,
    showCaptions: false,
};

export const Overview = renderCarouselPlayground;
Overview.args = { ...overviewCarouselArgs };
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.carousel }
    }
};

export const Interactive = renderCarouselPlayground;
Interactive.args = { ...carouselPlaygroundArgs };

/* ------------------------------------------------------------------- states */

const stateSlides = ['One', 'Two', 'Three'].map((label) => ({ content: label }));
const StateCarousel = (props) => (
    <div style={{ width: '100%', maxWidth: '520px' }}>
        <Carousel aria-label="Lesson highlights" slides={stateSlides} controls indicators interval={0} {...props} />
    </div>
);
const next = (canvasElement) => within(canvasElement).getByRole('button', { name: 'Next slide' });
const prev = (canvasElement) => within(canvasElement).getByRole('button', { name: 'Previous slide' });
const readControl = (el, pseudo) => {
    el.style.transition = 'none';
    const read = () => {
        const style = getComputedStyle(el);
        return { opacity: style.opacity, color: style.color };
    };
    return pseudo ? withForcedPseudo(el, pseudo, read) : read();
};

/** Rest: a control at 70% over the slide, in the subtle text color. */
export const Rest = {
    render: () => <StateCarousel />,
    play: async ({ canvasElement }) => {
        const rest = readControl(next(canvasElement));
        await expect(rest.opacity).toBe('0.7');
        await expect(rest.color).toBe(tokenColor(canvasElement, '--ds-text-subtle'));
    },
};

/** Hovered: full opacity and the default text color. */
export const Hovered = {
    render: () => <StateCarousel />,
    play: async ({ canvasElement }) => {
        const hovered = readControl(next(canvasElement), ':hover');
        await expect(hovered.opacity).toBe('1');
        await expect(hovered.color).toBe(tokenColor(canvasElement, '--ds-text'));
    },
};

/** Pressed: the control has no pressed layer; pressing an indicator moves to its slide. */
export const Pressed = {
    render: () => <StateCarousel />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const third = canvas.getByRole('button', { name: 'Slide 3' });
        await userEvent.click(third);
        await expect(third).toHaveAttribute('aria-current', 'true');
        await userEvent.click(prev(canvasElement));
        await expect(canvas.getByRole('button', { name: 'Slide 2' })).toHaveAttribute('aria-current', 'true');
    },
};

/** Focused: the 2px ring, 2px off the control. */
export const Focused = {
    render: () => <StateCarousel />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, next(canvasElement), 'carousel control');
    },
};

/** Disabled: without wrap, the first slide has no previous. Dimmed to the disabled opacity. */
export const Disabled = {
    render: () => <StateCarousel wrap={false} />,
    play: async ({ canvasElement }) => {
        const el = prev(canvasElement);
        await expect(el).toBeDisabled();
        await expect(getComputedStyle(el).opacity).toBe(probe(canvasElement, 'opacity', 'var(--ds-opacity-disabled)'));
        await expect(next(canvasElement)).toBeEnabled();
    },
};
