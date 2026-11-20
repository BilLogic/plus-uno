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
        const labels = [...container.querySelectorAll('.logo-wm__label')].map((n) => n.textContent);
        expect(labels).toEqual(['12%', '6%', '10%']);
    });

    it('shows the font as it ships in step 0, square ends and no redlines', () => {
        const { container } = render(<WordmarkStep step={0} />);
        expect(container.querySelectorAll('.logo-wm__letter--square')).toHaveLength(1);
        expect(container.textContent).toContain('9%, 5% and 6%');
        expect(container.querySelectorAll('.logo-wm__label')).toHaveLength(0);
    });

    it('rounds the ends from step 1', () => {
        const { container } = render(<WordmarkStep step={1} />);
        expect(container.querySelectorAll('.logo-wm__letter--round')).toHaveLength(1);
    });

    it('draws step 3 from the exported outlines and labels the U', () => {
        const { container } = render(<WordmarkStep step={3} />);
        expect(container.querySelectorAll('text.logo-wm__letter')).toHaveLength(0);
        expect(container.querySelectorAll('.logo-wm__outline')).toHaveLength(4);
        expect(screen.getByText('U 96% wide')).toBeInTheDocument();
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
