import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Carousel from './Carousel/Carousel';

/**
 * How a person moves through a carousel: the arrow buttons, the dots, the
 * arrow keys, and what changes when they have asked for reduced motion.
 */

export default {
    title: 'Components/Layout and structure/Carousel behavior',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Behavior cover for Carousel: next and previous, keyboard, and reduced motion.',
            },
        },
    },
};

const SLIDES = [
    { content: 'First slide' },
    { content: 'Second slide' },
    { content: 'Third slide' },
];

const activeText = (canvasElement) => (
    canvasElement.querySelector('.plus-carousel-item:not([aria-hidden])')?.textContent
);

export const NextAndPrevious = () => (
    <div style={{ maxWidth: '480px' }}>
        <Carousel slides={SLIDES} aria-label="Examples" />
    </div>
);

NextAndPrevious.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(activeText(canvasElement)).toBe('First slide');

    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
    await expect(activeText(canvasElement)).toBe('Second slide');

    await userEvent.click(canvas.getByRole('button', { name: 'Previous slide' }));
    await expect(activeText(canvasElement)).toBe('First slide');

    // Wraps from the first slide to the last.
    await userEvent.click(canvas.getByRole('button', { name: 'Previous slide' }));
    await expect(activeText(canvasElement)).toBe('Third slide');

    await userEvent.click(canvas.getByRole('button', { name: 'Slide 2' }));
    await expect(activeText(canvasElement)).toBe('Second slide');
};

export const ArrowsStopAtTheEnds = () => (
    <div style={{ maxWidth: '480px' }}>
        <Carousel slides={SLIDES} wrap={false} />
    </div>
);

ArrowsStopAtTheEnds.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Slide 3' }));
    await expect(canvas.getByRole('button', { name: 'Next slide' })).toBeDisabled();
};

export const ArrowKeys = () => (
    <div style={{ maxWidth: '480px' }}>
        <Carousel slides={SLIDES} aria-label="Examples" />
    </div>
);

ArrowKeys.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Next slide' }).focus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(activeText(canvasElement)).toBe('Second slide');

    await userEvent.keyboard('{ArrowLeft}');
    await expect(activeText(canvasElement)).toBe('First slide');
};

export const KeyboardOff = () => (
    <div style={{ maxWidth: '480px' }}>
        <Carousel slides={SLIDES} keyboard={false} />
    </div>
);

KeyboardOff.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Next slide' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(activeText(canvasElement)).toBe('First slide');
};

/**
 * Reduced motion is the person's choice, so autoplay does not start and the
 * pause control, which exists only for autoplay, is not drawn. The slides
 * still move on a press.
 */
const realMatchMedia = window.matchMedia;

const withReducedMotion = (Story) => {
    window.matchMedia = (query) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
    });
    React.useEffect(() => () => { window.matchMedia = realMatchMedia; }, []);
    return <Story />;
};

export const ReducedMotion = () => (
    <div style={{ maxWidth: '480px' }}>
        <Carousel slides={SLIDES} interval={500} />
    </div>
);

ReducedMotion.decorators = [withReducedMotion];

ReducedMotion.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: /slideshow/ })).toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 1200));
    await expect(activeText(canvasElement)).toBe('First slide');

    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
    await expect(activeText(canvasElement)).toBe('Second slide');
};
