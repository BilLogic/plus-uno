import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgressTracker, { PROGRESS_TRACKER_SPACINGS } from '.';

const ITEMS = [
    { id: 'one', label: 'Session information', status: 'visited' },
    { id: 'two', label: 'Student reflection', status: 'current' },
    { id: 'three', label: 'Form feedback', status: 'unvisited' },
];

describe('ProgressTracker spacing', () => {
    it('uses PLUS spacing vocabulary (default, compact, spacious) with default as default', () => {
        expect(PROGRESS_TRACKER_SPACINGS).toEqual(['default', 'compact', 'spacious']);
        const { container, rerender } = render(<ProgressTracker items={ITEMS} />);
        expect(container.querySelector('.plus-progress-tracker')).toHaveClass('plus-progress-tracker--default');
        rerender(<ProgressTracker items={ITEMS} spacing="spacious" />);
        expect(container.querySelector('.plus-progress-tracker')).toHaveClass('plus-progress-tracker--spacious');
        rerender(<ProgressTracker items={ITEMS} spacing="compact" />);
        expect(container.querySelector('.plus-progress-tracker')).toHaveClass('plus-progress-tracker--compact');
    });
});
