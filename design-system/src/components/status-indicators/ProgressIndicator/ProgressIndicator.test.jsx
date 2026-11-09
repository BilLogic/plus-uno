import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgressIndicator from '.';

const VALUES = ['One', 'Two', 'Three'];
const dots = (container) => [...container.querySelectorAll('.plus-progress-indicator__dot')];
const fillOf = (dot) => dot.querySelector('.plus-progress-indicator__fill');

describe('ProgressIndicator progress', () => {
    it('draws plain dots without progress', () => {
        const { container } = render(<ProgressIndicator values={VALUES} selectedIndex={1} />);
        expect(container.querySelector('.plus-progress-indicator')).not.toHaveClass('plus-progress-indicator--timed');
        expect(container.querySelector('.plus-progress-indicator__fill')).toBeNull();
    });

    it('stretches only the current dot into a bar that fills to the progress', () => {
        const { container } = render(<ProgressIndicator values={VALUES} selectedIndex={1} progress={0.4} />);
        expect(container.querySelector('.plus-progress-indicator')).toHaveClass('plus-progress-indicator--timed');
        const [first, current, last] = dots(container);
        expect(fillOf(first)).toBeNull();
        expect(fillOf(last)).toBeNull();
        expect(fillOf(current).style.getPropertyValue('--progress-indicator-progress')).toBe('0.4');
    });

    it('keeps progress between 0 and 1', () => {
        const { container, rerender } = render(<ProgressIndicator values={VALUES} selectedIndex={0} progress={1.7} />);
        expect(fillOf(dots(container)[0]).style.getPropertyValue('--progress-indicator-progress')).toBe('1');
        rerender(<ProgressIndicator values={VALUES} selectedIndex={0} progress={-2} />);
        expect(fillOf(dots(container)[0]).style.getPropertyValue('--progress-indicator-progress')).toBe('0');
    });

    it('keeps the bar hidden from assistive technology', () => {
        const { container } = render(<ProgressIndicator values={VALUES} selectedIndex={2} progress={0.5} onSelect={() => {}} />);
        const current = dots(container)[2];
        expect(current).toHaveAttribute('aria-current', 'step');
        expect(current).toHaveAccessibleName('Three');
        expect(current.querySelector('.plus-progress-indicator__bar')).toHaveAttribute('aria-hidden', 'true');
    });
});
