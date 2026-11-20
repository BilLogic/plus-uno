/**
 * The Logos page's wordmark figures: the lockup at each size with its weight,
 * the four build steps, the lockup rule and the two Don't figures.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WORDMARKS } from '@/assets/Logo/logoArt';
import { LockupSizes, LockupRule, WordmarkStep, TypedWordmarkFigure, TrackedWordmarkFigure } from './LogoWordmark';

describe('LogoWordmark figures', () => {
    it('draws the lockup at 24, 32, 48, 64 and 96, each captioned with its weight', () => {
        const { container } = render(<LockupSizes />);
        const items = within(screen.getByRole('list', { name: 'Lockup at each size' })).getAllByRole('listitem');
        expect(items.map((li) => li.textContent)).toEqual(
            [24, 32, 48, 64, 96].map((s) => `${s} · weight ${WORDMARKS[s].weight}`),
        );
        expect(container.querySelectorAll('.plus-logo--lockup')).toHaveLength(5);
    });

    it('redlines the three gaps at 12%, 6% and 10% of the cap in step 2', () => {
        const { container } = render(<WordmarkStep step={2} />);
        const labels = [...container.querySelectorAll('[data-part="measure"] text')].map((n) => n.textContent);
        expect(labels).toEqual(['12%', '6%', '10%']);
    });

    it('draws steps 0 and 1 as outlines with the font\'s own measured gaps', () => {
        for (const step of [0, 1]) {
            const { container, unmount } = render(<WordmarkStep step={step} />);
            expect(container.querySelectorAll('svg path')).toHaveLength(4);
            expect(container.querySelectorAll('text:not([data-part] text)').length).toBe(0);
            const labels = [...container.querySelectorAll('[data-part="measure"] text')].map((n) => n.textContent);
            expect(labels).toHaveLength(3);
            expect(labels).not.toEqual(['12%', '6%', '10%']);
            unmount();
        }
    });

    it('draws step 3 from the exported outlines and labels the U', () => {
        const { container } = render(<WordmarkStep step={3} />);
        expect(container.querySelectorAll('svg path')).toHaveLength(4);
        expect(screen.getByText('U 96%')).toBeInTheDocument();
    });

    it('draws the lockup rule over the real lockup', () => {
        const { container } = render(<LockupRule />);
        expect(container.querySelector('.plus-logo--lockup')).toBeInTheDocument();
        expect(container.textContent).toContain('½');
        expect(container.textContent).toContain('¼');
    });

    it('draws the Don\'t figures without the Logo wordmark', () => {
        const typed = render(<TypedWordmarkFigure />);
        expect(typed.container.querySelector('.plus-logo--lockup')).toBeNull();
        expect(typed.container.textContent).toContain('PLUS');
        const tracked = render(<TrackedWordmarkFigure />);
        expect(tracked.container.querySelectorAll('.logo-dont__tracked path')).toHaveLength(4);
    });

    it('keeps the Logos page weight table (cap is half the lockup size) equal to the exported wordmarks', () => {
        const mdx = readFileSync(join(__dirname, '../../styles/Logos.mdx'), 'utf8');
        const start = mdx.indexOf("head={['Lockup size'");
        const block = mdx.slice(mdx.indexOf('rows={', start), mdx.indexOf('/>', start));
        const rows = [...block.matchAll(/\[('[^\]]+')\]/g)].map((m) => m[1].split(',').map((c) => c.trim().replace(/'/g, '')));
        const expected = Object.keys(WORDMARKS)
            .map(Number)
            .sort((a, b) => b - a)
            .map((size) => [String(size), String(size / 2), String(WORDMARKS[size].weight), String(WORDMARKS[size].opticalSize)]);
        expect(rows).toEqual(expected);
    });
});
