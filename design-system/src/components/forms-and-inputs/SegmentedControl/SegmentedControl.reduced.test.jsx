import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SegmentedControl from './SegmentedControl';

const motion = vi.hoisted(() => ({ reduced: true }));
vi.mock('@/lib/motionPreference', () => ({ useMotionReduced: () => motion.reduced }));

const OPTIONS = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }];

describe('SegmentedControl under reduced motion', () => {
    beforeEach(() => { motion.reduced = true; });

    it('drops the fade when motion comes back on', async () => {
        const user = userEvent.setup();
        const { container, rerender } = render(<SegmentedControl label="View" options={OPTIONS} />);
        await user.click(screen.getByRole('button', { name: 'B' }));
        const indicator = container.querySelector('.plus-segmented-control__indicator');
        expect(indicator.dataset.fade).toBeDefined();
        motion.reduced = false;
        rerender(<SegmentedControl label="View" options={OPTIONS} />);
        expect(indicator.dataset.fade).toBeUndefined();
    });

    it('does not fade on first render, and changes the fade on each selection so it restarts', async () => {
        const user = userEvent.setup();
        const { container } = render(<SegmentedControl label="View" options={OPTIONS} />);
        const indicator = container.querySelector('.plus-segmented-control__indicator');
        expect(indicator.dataset.fade).toBeUndefined();
        await user.click(screen.getByRole('button', { name: 'B' }));
        const first = indicator.dataset.fade;
        expect(first).toBeDefined();
        await user.click(screen.getByRole('button', { name: 'C' }));
        expect(indicator.dataset.fade).toBeDefined();
        expect(indicator.dataset.fade).not.toBe(first);
    });
});
