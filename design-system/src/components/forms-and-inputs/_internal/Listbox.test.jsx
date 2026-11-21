import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STAGGER } from '@/lib/listMotion';
import Listbox from './Listbox';

describe('Listbox reveal', () => {
    it('hands each row the stagger gap and cap from STAGGER', () => {
        render(<Listbox reveal options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]} />);
        const row = screen.getByText('Beta').closest('.plus-listbox-reveal');
        expect(row.style.getPropertyValue('--plus-listbox-reveal-index')).toBe('1');
        expect(row.style.getPropertyValue('--plus-listbox-reveal-gap')).toBe(`${STAGGER.gap}ms`);
        expect(row.style.getPropertyValue('--plus-listbox-reveal-cap')).toBe(`${STAGGER.cap}ms`);
    });
});
