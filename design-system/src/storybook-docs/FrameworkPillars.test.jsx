import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FrameworkPillars, PILLARS } from './framework-pillars.jsx';

/**
 * The Foundations Overview opens on the PLUS framework: four pillars in a fixed
 * order, each with one line of promise and a placeholder for its illustration.
 */
describe('FrameworkPillars', () => {
    it('renders the four pillars in order with their promises', () => {
        render(<FrameworkPillars />);
        const names = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
        expect(names).toEqual(['Productivity', 'Learning', 'Uplift', 'Simplicity']);
        for (const pillar of PILLARS) {
            const card = screen.getByRole('heading', { level: 3, name: pillar.name }).closest('article');
            expect(within(card).getByText(pillar.promise)).toBeTruthy();
        }
    });

    it('leaves one labeled illustration placeholder per pillar', () => {
        render(<FrameworkPillars />);
        expect(screen.getAllByText('Illustration placeholder')).toHaveLength(4);
    });

    it('sits above the foundation cards on the Overview page', () => {
        const mdx = readFileSync(join(__dirname, '..', 'styles', 'FoundationsOverview.mdx'), 'utf8');
        expect(mdx.indexOf('<FrameworkPillars')).toBeGreaterThan(-1);
        expect(mdx.indexOf('<FrameworkPillars')).toBeLessThan(mdx.indexOf('The foundations">'));
    });
});
