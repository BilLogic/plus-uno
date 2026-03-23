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
            control: 'boolean',
            description: 'Whether to wrap around at the ends',
            table: { category: 'Behavior' }
        },
        pause: {
            control: 'select',
            options: ['hover', false],
            description: 'Pause on hover behavior',
            table: { category: 'Behavior' }
        },
        keyboard: {
            control: 'boolean',
            description: 'Enable keyboard navigation',
            table: { category: 'Behavior' }
        },
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' }
        },
        activeIndex: {
            control: { type: 'number' },
            description: 'Controlled active slide index',
            table: { category: 'Development' }
        },
        onSelect: {
            table: { disable: true, category: 'Development' }
        },
        slides: {
            table: { disable: true, category: 'Development' }
        },
        children: {
            table: { disable: true, category: 'Development' }
        }
    }
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
                <h6 className="h6" style={{ marginBottom: '16px' }}>Slides only</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Basic carousel with only slide content, no controls or indicators.
                </p>
                <Carousel slides={threeSlides} controls={false} indicators={false} />
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With captions</h6>
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
                <h6 className="h6" style={{ marginBottom: '16px' }}>With controls</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Previous/next navigation arrows for manual control.
                </p>
                <Carousel slides={threeSlides} controls indicators={false} />
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With indicators</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Pill-style indicators showing current slide position.
                </p>
                <Carousel slides={threeSlides} controls={false} indicators />
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Full featured</h6>
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
            <h6 className="h6" style={{ marginBottom: '16px' }}>Fade transition</h6>
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
            <Carousel {...args} slides={slides} />
        </div>
    );
};

Interactive.args = {
    controls: true,
    indicators: true,
    interval: 5000,
    wrap: true,
    pause: 'hover',
    keyboard: true,
    fade: false,
    slideCount: 3,
    showCaptions: false
};
