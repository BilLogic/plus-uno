import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Carousel from './Carousel';

const motion = vi.hoisted(() => ({ reduced: true }));
vi.mock('@/lib/motionPreference', () => ({ useMotionReduced: () => motion.reduced }));

const SLIDES = [{ id: 1, title: 'One' }, { id: 2, title: 'Two' }, { id: 3, title: 'Three' }];

describe('Carousel under reduced motion', () => {
    beforeEach(() => { motion.reduced = true; });

    it('shows the new caption in the same commit as the fade', () => {
        const { container } = render(<Carousel aria-label="Tour" slides={SLIDES} loop />);
        fireEvent.click(container.querySelectorAll('button.plus-progress-indicator__dot')[1]);
        expect(container.querySelector('.plus-carousel-caption-inner')).toHaveTextContent('Two');
    });

    it('keeps no fade while motion is on, so turning reduced motion on later plays nothing', () => {
        motion.reduced = false;
        const { container, rerender } = render(<Carousel aria-label="Tour" slides={SLIDES} autoplay={false} loop />);
        fireEvent.click(container.querySelectorAll('button.plus-progress-indicator__dot')[1]);
        motion.reduced = true;
        rerender(<Carousel aria-label="Tour" slides={SLIDES} autoplay={false} loop />);
        expect(container.querySelector('.plus-carousel-track').dataset.fade).toBeUndefined();
    });

    it('does not fade on first render, and restarts the fade on every step, a wrap included', () => {
        const { container } = render(<Carousel aria-label="Tour" slides={SLIDES} loop />);
        const track = container.querySelector('.plus-carousel-track');
        const caption = container.querySelector('.plus-carousel-caption-inner');
        const dots = container.querySelectorAll('button.plus-progress-indicator__dot');
        expect(track.dataset.fade).toBeUndefined();
        const seen = [];
        for (const k of [1, 2, 0]) {
            fireEvent.click(dots[k]);
            seen.push(track.dataset.fade);
            expect(caption.dataset.fade).toBe(track.dataset.fade);
        }
        expect(seen[0]).toBeDefined();
        expect(seen[1]).not.toBe(seen[0]);
        expect(seen[2]).not.toBe(seen[1]);
    });
});
