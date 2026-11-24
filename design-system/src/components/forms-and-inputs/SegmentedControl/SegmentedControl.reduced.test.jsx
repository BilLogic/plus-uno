import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from './SegmentedControl';

vi.mock('@/lib/motionPreference', () => ({ useMotionReduced: () => true }));

const OPTIONS = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }];

describe('SegmentedControl under reduced motion', () => {
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
