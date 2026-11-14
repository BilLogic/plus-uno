import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgressRing, { PROGRESS_RING_APPEARANCES, PROGRESS_RING_SIZES } from '.';

describe('ProgressRing', () => {
    it('renders a determinate progressbar named by label with min 0 and max 100', () => {
        render(<ProgressRing value={64} label="Uploading session recording" />);

        const ring = screen.getByRole('progressbar', { name: 'Uploading session recording' });
        expect(ring).toHaveAttribute('aria-valuenow', '64');
        expect(ring).toHaveAttribute('aria-valuemin', '0');
        expect(ring).toHaveAttribute('aria-valuemax', '100');
    });

    it('renders 0, partial and 100 states on both aria-valuenow and the SVG arc', () => {
        const { rerender } = render(<ProgressRing value={0} label="Upload progress" />);
        const ring = screen.getByRole('progressbar', { name: 'Upload progress' });
        const fill = () => ring.querySelector('circle:nth-of-type(2)');

        expect(ring).toHaveAttribute('aria-valuenow', '0');
        expect(fill()).toHaveAttribute('pathLength', '100');
        expect(fill()).toHaveAttribute('stroke-dasharray', '100');
        expect(fill()).toHaveAttribute('stroke-dashoffset', '100');

        rerender(<ProgressRing value={45} label="Upload progress" />);
        expect(ring).toHaveAttribute('aria-valuenow', '45');
        expect(fill()).toHaveAttribute('stroke-dashoffset', '55');

        rerender(<ProgressRing value={100} label="Upload progress" />);
        expect(ring).toHaveAttribute('aria-valuenow', '100');
        expect(fill()).toHaveAttribute('stroke-dashoffset', '0');
    });

    it('clamps values outside 0–100 on both aria-valuenow and the drawn arc', () => {
        const { rerender } = render(<ProgressRing value={-25} label="Upload progress" />);
        const ring = screen.getByRole('progressbar', { name: 'Upload progress' });
        const fill = () => ring.querySelector('circle:nth-of-type(2)');

        expect(ring).toHaveAttribute('aria-valuenow', '0');
        expect(fill()).toHaveAttribute('stroke-dashoffset', '100');

        rerender(<ProgressRing value={140} label="Upload progress" />);
        expect(ring).toHaveAttribute('aria-valuenow', '100');
        expect(fill()).toHaveAttribute('stroke-dashoffset', '0');

        rerender(<ProgressRing value={Number.NaN} label="Upload progress" />);
        expect(ring).toHaveAttribute('aria-valuenow', '0');
        expect(fill()).toHaveAttribute('stroke-dashoffset', '100');
    });

    it('defaults to size 20 and supports 16, 20 and 24 with unclipped 2 px stroke geometry', () => {
        expect(PROGRESS_RING_SIZES).toEqual([16, 20, 24]);

        const { rerender } = render(<ProgressRing value={50} label="Upload progress" />);
        const ring = screen.getByRole('progressbar', { name: 'Upload progress' });
        expect(ring).toHaveAttribute('data-size', '20');
        expect(ring.querySelector('svg')).toHaveAttribute('viewBox', '0 0 20 20');
        expect(ring.querySelector('circle')).toHaveAttribute('r', '9');

        rerender(<ProgressRing value={50} size={16} label="Upload progress" />);
        expect(ring).toHaveAttribute('data-size', '16');
        expect(ring.querySelector('svg')).toHaveAttribute('viewBox', '0 0 16 16');
        expect(ring.querySelector('circle')).toHaveAttribute('r', '7');

        rerender(<ProgressRing value={50} size="24" label="Upload progress" />);
        expect(ring).toHaveAttribute('data-size', '24');
        expect(ring.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');
        expect(ring.querySelector('circle')).toHaveAttribute('r', '11');
    });

    it('supports default and inverse appearances and keeps the SVG hidden from assistive tech', () => {
        expect(PROGRESS_RING_APPEARANCES).toEqual(['default', 'inverse']);

        const { rerender } = render(<ProgressRing value={60} label="Upload progress" id="ring-1" />);
        const ring = screen.getByRole('progressbar', { name: 'Upload progress' });
        expect(ring).toHaveAttribute('id', 'ring-1');
        expect(ring.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
        expect(ring.querySelector('svg')).toHaveAttribute('focusable', 'false');

        rerender(<ProgressRing value={60} appearance="inverse" label="Upload progress" />);
        expect(screen.getByRole('progressbar', { name: 'Upload progress' })).toHaveAttribute('aria-valuenow', '60');
    });
});
