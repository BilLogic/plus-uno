import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Carousel from './Carousel';

export default {
    title: 'Components/Carousel',
    component: Carousel,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Carousel component for displaying a rotating set of content slides. Supports controls, indicators, and captions. Built on React Bootstrap.'
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
        fontFamily: 'var(--font-family-lato)',
        color: 'var(--color-on-surface)'
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
        color: 'var(--color-on-surface)'
    }}>
        <div style={{
            flex: '1 0 auto',
            display: 'flex',
            alignItems: 'center',
            fontSize: '2rem',
            fontFamily: 'var(--font-family-lato)',
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
                fontSize: 'var(--font-size-h5)',
                lineHeight: 'var(--font-line-height-h5)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-lato)'
            }}>
                {label}
            </span>
            <span style={{
                fontSize: 'var(--font-size-b1)',
                lineHeight: 'var(--font-line-height-b1)',
                fontWeight: 'var(--font-weight-light)',
                fontFamily: 'var(--font-family-merriweather-sans)',
                color: 'var(--color-on-surface-variant)'
            }}>
                {description}
            </span>
        </div>
    </div>
);

const slideColors = [
    'var(--color-surface-container)',
    'var(--color-surface-container-high)',
    'var(--color-surface-container-highest)',
    'var(--color-primary-state-08)',
    'var(--color-secondary-state-08)',
    'var(--color-tertiary-state-08)'
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
        source: { language: 'html', code: webAppSourceSnippets.carousel }
    }
};

export const Interactive = renderCarouselPlayground;
Interactive.args = { ...carouselPlaygroundArgs };
