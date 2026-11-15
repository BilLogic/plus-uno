import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpringPrimitiveTable, SpringSemanticTable, dampingOf, springValues } from './token-collection-blocks.jsx';

// Vitest hands back an empty string for a `.scss?raw` import, so the spring
// stylesheet is read from disk here; the page code is unchanged.
vi.mock('@/tokens/ladder/_springs.scss?raw', async () => {
    const fs = await import('node:fs');
    return { default: fs.readFileSync(`${process.cwd()}/src/tokens/ladder/_springs.scss`, 'utf8') };
});

/** Foundations ▸ Tokens ▸ Motion shows each spring as numbers, not a raw `linear()` string. */
describe('Motion token tables', () => {
    it('derives damping from stiffness and ratio at unit mass', () => {
        expect(dampingOf({ stiffness: 880, ratio: 1 })).toBeCloseTo(59.3, 1);
        expect(dampingOf({ stiffness: 800, ratio: 0.6 })).toBeCloseTo(33.9, 1);
        expect(dampingOf({ stiffness: 27.4, ratio: 0 })).toBe(0);
    });

    it('reads the easing and settle time of each primitive from the stylesheet', () => {
        const values = springValues();
        expect(values['880'].duration).toBe('224ms');
        expect(values['880'].easing).toMatch(/^linear\(/);
    });

    it('lists stiffness, damping and settle in columns, with the raw value folded away', () => {
        render(<SpringPrimitiveTable />);
        const row = screen.getByText('--motion-spring-880').closest('tr');
        const cells = within(row).getAllByRole('cell').map((c) => c.textContent);
        expect(cells[1]).toBe('880');
        expect(cells[2]).toBe('59.3');
        expect(cells[3]).toBe('224ms');
        const details = row.querySelector('details');
        expect(details).not.toBeNull();
        expect(details.open).toBe(false);
        // Only the folded row carries the linear() string.
        expect(cells.slice(0, 4).join(' ')).not.toContain('linear(');
    });

    it('names the spring each semantic aliases, with its numbers', () => {
        render(<SpringSemanticTable />);
        const row = screen.getByText('--ds-motion-spatial-fast').closest('tr');
        expect(within(row).getByText('--motion-spring-880')).toBeTruthy();
        expect(within(row).getByText('224ms')).toBeTruthy();
    });
});
