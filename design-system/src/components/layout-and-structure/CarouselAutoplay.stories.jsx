import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Carousel from './Carousel/Carousel';

/**
 * Stopping a carousel that moves on its own.
 *
 * WHY THIS FILE EXISTS (#333). `interval` starts autoplay and there was no way
 * to stop it. `pause="hover"` covers a mouse resting on the carousel, which is
 * not a mechanism a keyboard or touch user has, and nothing else existed — so an
 * `interval` produced content that moved indefinitely with no control over it.
 *
 * WCAG 2.2.2 is not a preference here: anything that moves automatically for
 * more than five seconds must be pausable, and a five-second slide rotation is
 * exactly the case it was written for. This is the one audit finding I first
 * called a design decision, and it is not: the control is required, and only its
 * position and icon were ever up for discussion.
 *
 * The control appears ONLY when there is autoplay to pause, which the second
 * assertion is about. A play/pause button on a carousel that never advances is a
 * control that lies about what the component does.
 *
 * WHAT THIS DOES NOT ASSERT. That the slides stop moving. Proving a negative
 * about a timer means waiting for one, and a test that waits is a test that goes
 * flaky. The pause is `interval={null}`, which is react-bootstrap's own
 * documented way of not advancing — the assertion is on the control being there,
 * named, and toggling.
 */

export default {
    title: 'Components/Layout and structure/Carousel autoplay',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #333: an autoplaying carousel can be stopped without '
                    + 'a mouse.',
            },
        },
    },
};

const SLIDES = [
    { content: 'First slide' },
    { content: 'Second slide' },
];

export const AutoplayCanBePaused = () => (
    <div style={{ maxWidth: '480px' }}>
        <Carousel slides={SLIDES} interval={5000} />
    </div>
);

AutoplayCanBePaused.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Named for what pressing it will do, which is the convention for a toggle
    // drawn as one button rather than two.
    const control = canvas.getByRole('button', { name: 'Pause slideshow' });

    // Reachable without a pointer — the whole point.
    control.focus();
    await expect(document.activeElement).toBe(control);

    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('button', { name: 'Play slideshow' })).toBeTruthy();

    // And back, so it is a pause and not a stop.
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('button', { name: 'Pause slideshow' })).toBeTruthy();
};

export const NoAutoplayMeansNoControl = () => (
    <div style={{ maxWidth: '480px' }}>
        <Carousel slides={SLIDES} />
    </div>
);

NoAutoplayMeansNoControl.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('button', { name: /slideshow/ })).toBeNull();

    // The ordinary controls are still there — this is not "no buttons".
    await expect(canvas.getByRole('button', { name: 'Previous slide' })).toBeTruthy();
};
