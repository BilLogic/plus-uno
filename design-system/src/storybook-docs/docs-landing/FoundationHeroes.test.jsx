import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEROES } from './hero-registry.jsx';
import { PAINT } from '../illustrations/paint.js';

const FOUNDATION_IDS = [
    'foundations-basics-overview',
    'foundations-basics-accessibility',
    'foundations-visual-border',
    'foundations-visual-elevation',
    'foundations-layout-grid',
    'foundations-visual-iconography',
    'foundations-brand-illustrations',
    'foundations-brand-logos',
    'foundations-visual-radius',
    'foundations-layout-spacing',
    'foundations-basics-tokens',
    'foundations-visual-typography',
];

const ACCENT = 'var(--ds-background-brand-bold)';
const paints = (root) =>
    [...root.querySelectorAll('[fill],[stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]).filter((v) => v && v !== 'none');

describe('Foundations heroes', () => {
    it.each(FOUNDATION_IDS)('%s has a drawing and a one-sentence description', (id) => {
        expect(HEROES[id]?.Hero).toBeTypeOf('function');
        expect(HEROES[id].description).toMatch(/^[A-Z].*\.$/);
    });

    it.each(FOUNDATION_IDS.filter((id) => id !== 'foundations-visual-typography'))('%s draws no text', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(container.querySelector('text')).toBeNull();
        expect(container.textContent).toBe('');
    });

    it('Typography is the one hero with letterforms: Aa twice, serif and sans', () => {
        const { container } = render(React.createElement(HEROES['foundations-visual-typography'].Hero));
        const glyphs = [...container.querySelectorAll('text')];
        expect(glyphs.map((t) => t.textContent)).toEqual(['Aa', 'Aa']);
        expect(glyphs[0].style.fontFamily).toContain('serif');
        expect(glyphs[1].style.fontFamily).not.toContain('serif');
    });

    it.each(FOUNDATION_IDS)('%s paints only through tokens', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        for (const value of paints(container)) expect(value === PAINT.markTile || /^var\(--ds-[a-z-]+\)$/.test(value), value).toBe(true);
    });

    it.each(FOUNDATION_IDS)('%s puts the brand accent on its subject', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(paints(container)).toContain(ACCENT);
    });

    it('Elevation is a light | dark split, the same drawing in two panes', () => {
        const { container } = render(React.createElement(HEROES['foundations-visual-elevation'].Hero));
        expect([...container.querySelectorAll('[data-color-mode]')].map((n) => n.dataset.colorMode)).toEqual(['light', 'dark']);
    });

    it('Logos draws the kit construction: the four corner circles', () => {
        const { container } = render(React.createElement(HEROES['foundations-brand-logos'].Hero));
        expect(container.querySelectorAll('[data-shape="logo-construction"] circle[stroke-dasharray]')).toHaveLength(4);
    });

    it('Logos draws the mark: a rounded tile at the mark radius and the whole white plus', () => {
        const { container } = render(React.createElement(HEROES['foundations-brand-logos'].Hero));
        const tile = container.querySelector('rect[fill="' + PAINT.markTile + '"]');
        expect(tile).not.toBeNull();
        expect(tile.getAttribute('rx')).toBe('16');
        const arms = [...container.querySelectorAll('rect[fill="' + PAINT.pageSurface + '"][rx="1.25"]')];
        expect(arms.map((a) => [a.getAttribute('width'), a.getAttribute('height')])).toEqual([['24', '5.58'], ['6', '24']]);
        // the plus sits inside the tile: nothing clipped by the plus box
        for (const a of arms) {
            expect(+a.getAttribute('x') + +a.getAttribute('width')).toBeLessThanOrEqual(96);
            expect(+a.getAttribute('y')).toBeGreaterThanOrEqual(0);
        }
    });

    it('Radius: the surface corner is the circle it comes from, drawn dashed whole', () => {
        const { container } = render(React.createElement(HEROES['foundations-visual-radius'].Hero));
        const surface = container.querySelector('rect[fill="' + PAINT.cardSurface + '"]');
        const circle = container.querySelector('circle[stroke-dasharray]');
        expect(surface.getAttribute('rx')).toBe(circle.getAttribute('r'));
        expect(+circle.getAttribute('cx')).toBe(+surface.getAttribute('x') + +surface.getAttribute('rx'));
        expect(+circle.getAttribute('cy')).toBe(+surface.getAttribute('y') + +surface.getAttribute('ry'));
    });
});
