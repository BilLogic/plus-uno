import React from 'react';
import Carousel from './Carousel';

export default {
    title: 'Components/Carousel',
    component: Carousel,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Carousel component for displaying a rotating set of content slides. Supports controls, indicators, captions, and fade transitions. Built on React Bootstrap.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        fade: {
            control: 'boolean',
            description: 'Use fade transition instead of slide',
            table: { category: 'Design' }
        },
        slideCount: {
            control: { type: 'range', min: 2, max: 6, step: 1 },
            description: 'Number of slides to display',
            table: { category: 'Content' }
        },
        showCaptions: {
            control: 'boolean',
            description: 'Show title and caption on slides',
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

function CarouselContentDemos() {
    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SLIDES ONLY</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Basic carousel with only slide content, no controls or indicators.
                </p>
                <Carousel slides={threeSlides} controls={false} indicators={false} />
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH CAPTIONS</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Title and caption text overlaid on slides.
                </p>
                <Carousel
                    slides={[
                        {
                            content: createSlideContent('', slideColors[3]),
                            title: 'First Slide Title',
                            caption: 'This is the caption for the first slide with additional context.'
                        },
                        {
                            content: createSlideContent('', slideColors[4]),
                            title: 'Second Slide Title',
                            caption: 'Another descriptive caption providing more information.'
                        },
                        {
                            content: createSlideContent('', slideColors[5]),
                            title: 'Third Slide Title',
                            caption: 'The third slide caption with helpful details.'
                        }
                    ]}
                    controls
                    indicators
                />
            </section>
        </>
    );
}

function CarouselLayoutDemos() {
    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH CONTROLS</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Previous/next navigation arrows for manual control.
                </p>
                <Carousel slides={threeSlides} controls indicators={false} />
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH INDICATORS</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Pill-style indicators showing current slide position.
                </p>
                <Carousel slides={threeSlides} controls={false} indicators />
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FULL FEATURED</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Controls, indicators, and captions together.
                </p>
                <Carousel
                    slides={[
                        {
                            content: createSlideContent('', slideColors[0]),
                            title: 'Welcome',
                            caption: 'Start your journey here'
                        },
                        {
                            content: createSlideContent('', slideColors[1]),
                            title: 'Features',
                            caption: 'Discover what we offer'
                        },
                        {
                            content: createSlideContent('', slideColors[2]),
                            title: 'Get Started',
                            caption: 'Begin today'
                        }
                    ]}
                    controls
                    indicators
                />
            </section>
        </>
    );
}

function CarouselFadeDemo() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FADE TRANSITION</span>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Fade effect instead of slide animation.
            </p>
            <Carousel
                slides={[
                    { content: createSlideContent('Fade In', slideColors[3]) },
                    { content: createSlideContent('Fade Out', slideColors[4]) },
                    { content: createSlideContent('Smooth', slideColors[5]) }
                ]}
                controls
                indicators
                fade
                interval={4000}
            />
        </section>
    );
}

export const Content = () => (
    <div style={carouselCol}>
        <CarouselContentDemos />
    </div>
);

export const Layout = () => (
    <div style={carouselCol}>
        <CarouselLayoutDemos />
    </div>
);

export const Styles = () => (
    <div style={carouselCol}>
        <CarouselFadeDemo />
    </div>
);

export const Overview = () => (
    <div style={carouselCol}>
        <CarouselContentDemos />
        <CarouselLayoutDemos />
        <CarouselFadeDemo />
    </div>
);

export const Interactive = (args) => {
    const slides = Array.from({ length: args.slideCount || 3 }, (_, i) => ({
        content: createSlideContent(slideLabels[i], slideColors[i % slideColors.length]),
        title: args.showCaptions ? `${slideLabels[i]} Title` : undefined,
        caption: args.showCaptions ? `Caption for ${slideLabels[i].toLowerCase()}` : undefined
    }));

    return (
        <div style={{ maxWidth: '800px' }}>
            <Carousel
                fade={args.fade}
                controls={args.controls}
                indicators={args.indicators}
                interval={args.interval}
                slides={slides}
            />
        </div>
    );
};

Interactive.args = {
    controls: true,
    indicators: true,
    interval: 5000,
    fade: false,
    slideCount: 3,
    showCaptions: false
};
