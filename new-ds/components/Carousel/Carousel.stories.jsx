import React from 'react';
import Carousel from './Carousel';

export default {
    title: 'Components/Carousel',
    component: Carousel,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Carousel component for displaying a rotating set of content slides. Supports controls, indicators, captions, and fade transitions. Built on React Bootstrap.'
            }
        }
    },
    argTypes: {
        // DESIGN
        fade: {
            control: 'boolean',
            description: 'Use fade transition instead of slide',
            table: { category: 'Design' }
        },

        // CONTENT
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

        // BEHAVIOR
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

        // DEVELOPMENT
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
        slides: {
            table: { disable: true, category: 'Development' }
        },
        children: {
            table: { disable: true, category: 'Development' }
        }
    }
};

// Helper to create slide content
const createSlideContent = (text, bgColor) => (
    <div style={{
        height: '300px',
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

// Sample slide configurations
const slideColors = [
    'var(--color-surface-container)',
    'var(--color-surface-container-high)',
    'var(--color-surface-container-highest)',
    'var(--color-primary-state-08)',
    'var(--color-secondary-state-08)',
    'var(--color-tertiary-state-08)'
];

const slideLabels = ['First Slide', 'Second Slide', 'Third Slide', 'Fourth Slide', 'Fifth Slide', 'Sixth Slide'];

/**
 * Overview
 * Comprehensive view of Carousel configurations matching Figma specifications.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>

        {/* 1. Slides Only */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Slides Only</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Basic carousel with only slide content, no controls or indicators.
            </p>
            <Carousel
                slides={[
                    { content: createSlideContent('First Slide', slideColors[0]) },
                    { content: createSlideContent('Second Slide', slideColors[1]) },
                    { content: createSlideContent('Third Slide', slideColors[2]) }
                ]}
                controls={false}
                indicators={false}
                interval={3000}
            />
        </section>

        {/* 2. With Controls */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>With Controls</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Carousel with previous/next navigation arrows for manual control.
            </p>
            <Carousel
                slides={[
                    { content: createSlideContent('First Slide', slideColors[0]) },
                    { content: createSlideContent('Second Slide', slideColors[1]) },
                    { content: createSlideContent('Third Slide', slideColors[2]) }
                ]}
                controls={true}
                indicators={false}
                interval={0}
            />
        </section>

        {/* 3. With Indicators */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>With Indicators</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Carousel with pill-style indicators showing current slide position.
            </p>
            <Carousel
                slides={[
                    { content: createSlideContent('First Slide', slideColors[0]) },
                    { content: createSlideContent('Second Slide', slideColors[1]) },
                    { content: createSlideContent('Third Slide', slideColors[2]) }
                ]}
                controls={false}
                indicators={true}
                interval={4000}
            />
        </section>

        {/* 4. With Captions */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>With Captions</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Carousel with title and caption text overlaid on slides.
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
                controls={true}
                indicators={true}
                interval={5000}
            />
        </section>

        {/* 5. Full Featured */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Full Featured</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Complete carousel with controls, indicators, and captions enabled.
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
                controls={true}
                indicators={true}
                interval={0}
            />
        </section>

        {/* 6. Fade Transition */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Fade Transition</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Uses fade effect instead of slide animation for smoother transitions.
            </p>
            <Carousel
                slides={[
                    { content: createSlideContent('Fade In', slideColors[3]) },
                    { content: createSlideContent('Fade Out', slideColors[4]) },
                    { content: createSlideContent('Smooth', slideColors[5]) }
                ]}
                controls={true}
                indicators={true}
                fade={true}
                interval={3000}
            />
        </section>
    </div>
);

/**
 * Interactive Playground
 * Customize the carousel attributes in real-time.
 */
export const Interactive = (args) => {
    // Generate slides based on slideCount
    const slides = Array.from({ length: args.slideCount || 3 }, (_, i) => ({
        content: createSlideContent(slideLabels[i], slideColors[i % slideColors.length]),
        title: args.showCaptions ? `${slideLabels[i]} Title` : undefined,
        caption: args.showCaptions ? `Caption for ${slideLabels[i].toLowerCase()}` : undefined
    }));

    return (
        <div style={{ maxWidth: '800px' }}>
            <Carousel
                {...args}
                slides={slides}
            />
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
