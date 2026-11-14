import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEROES } from './hero-registry.jsx';
import { PLATES } from './TemplateHeroes.jsx';
import { PAINT } from '../illustrations/paint.js';

const TEMPLATE_IDS = [
    'templates-overview',
    'templates-frame',
    'templates-page',
    'templates-section',
    'templates-card',
    'templates-table',
    'templates-form',
    'templates-modal',
    'templates-panel',
    'templates-popup',
];

const ACCENT = 'var(--ds-background-brand-bold)';
const paints = (root) =>
    [...root.querySelectorAll('[fill],[stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]).filter((v) => v && v !== 'none');

describe('Templates heroes', () => {
    it.each(TEMPLATE_IDS)('%s has a drawing and a one-sentence description', (id) => {
        expect(HEROES[id]?.Hero).toBeTypeOf('function');
        expect(HEROES[id].description).toMatch(/^[A-Z].*\.$/);
    });

    it.each(TEMPLATE_IDS)('%s draws no text and paints only through tokens', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(container.querySelector('text')).toBeNull();
        expect(container.textContent).toBe('');
        for (const value of paints(container)) expect(value).toMatch(/^var\(--ds-[a-z-]+\)$/);
    });

    it.each(TEMPLATE_IDS)('%s puts the brand accent on its subject', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(paints(container)).toContain(ACCENT);
    });

    it('uses no status color: the accent is the only hue', () => {
        for (const id of TEMPLATE_IDS) {
            const { container } = render(React.createElement(HEROES[id].Hero));
            expect(paints(container).filter((v) => /danger|warning|success/.test(v))).toEqual([]);
        }
    });
});


describe('Templates Overview: the flat exploded view', () => {
    const draw = () => render(React.createElement(HEROES['templates-overview'].Hero)).container;

    it('draws four plates, back to front, each with the same flat turn and no perspective', () => {
        const plates = [...draw().querySelectorAll('[data-plate]')];
        expect(plates.map((p) => p.dataset.plate)).toEqual(['frame', 'shell', 'section', 'rows']);
        for (const p of plates) expect(p.getAttribute('transform')).toMatch(/skewY\(-12\) scale\(0\.8 1\)$/);
    });

    it('spaces the part centers evenly', () => {
        const centers = PLATES.map((p) => p.center);
        const steps = centers.slice(1).map((c, i) => +(c - centers[i]).toFixed(6));
        expect(new Set(steps).size).toBe(1);
    });

    it('outlines only the Frame plate', () => {
        const edged = [...draw().querySelectorAll('[data-plate]')].filter((p) => p.querySelector(`[stroke="${PAINT.illustrationEdge}"]`));
        expect(edged.map((p) => p.dataset.plate)).toEqual(['frame']);
    });

    it('selects one table row and rings it', () => {
        const rows = draw().querySelector('[data-plate="rows"]');
        const selected = rows.querySelectorAll(`rect[fill="${PAINT.rowSelected}"]`);
        expect(selected).toHaveLength(1);
        expect(selected[0].getAttribute('stroke')).toBe(ACCENT);
    });
});
