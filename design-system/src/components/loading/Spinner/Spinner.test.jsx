import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Spinner, { SPINNER_SIZES } from './Spinner';

describe('Spinner sizes', () => {
    it('follows the icon sizes, then the larger two: 12, 16, 24, 48', () => {
        expect(SPINNER_SIZES).toEqual([12, 16, 24, 48]);
    });

    it('carries its size as data-size so the stylesheet can read it', () => {
        const { container } = render(<Spinner size={12} />);
        expect(container.querySelector('.plus-spinner')).toHaveAttribute('data-size', '12');
    });
});
