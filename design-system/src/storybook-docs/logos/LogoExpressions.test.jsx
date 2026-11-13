/**
 * The Logos page's two expressions: logomark and lockup, each named with its
 * job, bracket labels on the lockup, and four in-product examples drawn with
 * the real Logo component.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LogoExpressions } from './LogoExpressions';

describe('LogoExpressions', () => {
    it('names both expressions with their jobs', () => {
        render(<LogoExpressions />);
        expect(screen.getByRole('heading', { name: 'Logomark' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Lockup' })).toBeInTheDocument();
        expect(screen.getByText(/mark the app itself/i)).toBeInTheDocument();
        expect(screen.getByText(/first hello/i)).toBeInTheDocument();
    });

    it('draws each expression with the Logo component', () => {
        const { container } = render(<LogoExpressions />);
        const lockups = container.querySelectorAll('.plus-logo--lockup');
        expect(lockups.length).toBeGreaterThanOrEqual(1);
        expect(container.querySelectorAll('.plus-logo:not(.plus-logo--lockup)').length).toBeGreaterThanOrEqual(1);
    });

    it('labels the logomark, wordmark and lockup parts with brackets', () => {
        render(<LogoExpressions />);
        const parts = screen.getByRole('group', { name: 'Parts of the lockup' });
        for (const label of ['Logomark', 'Wordmark', 'Lockup']) {
            expect(within(parts).getByText(label)).toBeInTheDocument();
        }
    });

    it('shows four in-product examples, each tagged with its expression', () => {
        render(<LogoExpressions />);
        const list = screen.getByRole('list', { name: 'In the product' });
        const items = within(list).getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(items.map((li) => li.textContent)).toEqual([
            expect.stringContaining('Sidebar header'),
            expect.stringContaining('Sign-in'),
            expect.stringContaining('Email header'),
            expect.stringContaining('Loading screen'),
        ]);
        expect(within(items[0]).getByText('Logomark')).toBeInTheDocument();
        expect(within(items[1]).getByText('Lockup')).toBeInTheDocument();
    });
});
