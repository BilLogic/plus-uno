import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CloseButton from './CloseButton';

describe('CloseButton', () => {
    it('is the default appearance on a neutral surface', () => {
        render(<CloseButton label="Close" />);
        expect(screen.getByRole('button', { name: 'Close' })).not.toHaveClass('plus-close-btn--inverse');
    });

    it('`appearance="inverse"` is for colored and dark grounds', () => {
        render(<CloseButton label="Close" appearance="inverse" />);
        expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('plus-close-btn--inverse');
    });

    it('has no `tone` prop: the old name no longer sets the appearance', () => {
        render(<CloseButton label="Close" tone="inverse" />);
        expect(screen.getByRole('button', { name: 'Close' })).not.toHaveClass('plus-close-btn--inverse');
    });
});
