import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEROES } from './hero-registry.jsx';

const FOUNDATION_IDS = [
    'foundations-overview',
    'foundations-accessibility',
    'foundations-border',
    'foundations-elevation',
    'foundations-grid',
    'foundations-iconography',
    'foundations-illustrations',
    'foundations-logos',
    'foundations-radius',
    'foundations-spacing',
    'foundations-tokens',
    'foundations-typography',
];

const ACCENT = 'var(--ds-background-brand-bold)';
const paints = (root) =>
    [...root.querySelectorAll('[fill],[stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]).filter((v) => v && v !== 'none');

describe('Foundations heroes', () => {
    it.each(FOUNDATION_IDS)('%s has a drawing and a one-sentence description', (id) => {
        expect(HEROES[id]?.Hero).toBeTypeOf('function');
        expect(HEROES[id].description).toMatch(/^[A-Z].*\.$/);
    });

    it.each(FOUNDATION_IDS.filter((id) => id !== 'foundations-typography'))('%s draws no text', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(container.querySelector('text')).toBeNull();
        expect(container.textContent).toBe('');
    });

    it('Typography is the one hero with letterforms: Aa twice, serif and sans', () => {
        const { container } = render(React.createElement(HEROES['foundations-typography'].Hero));
        const glyphs = [...container.querySelectorAll('text')];
        expect(glyphs.map((t) => t.textContent)).toEqual(['Aa', 'Aa']);
        expect(glyphs[0].style.fontFamily).toContain('serif');
        expect(glyphs[1].style.fontFamily).not.toContain('serif');
    });

    it.each(FOUNDATION_IDS)('%s paints only through tokens', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        for (const value of paints(container)) expect(value).toMatch(/^var\(--ds-[a-z-]+\)$/);
    });

    it.each(FOUNDATION_IDS)('%s puts the brand accent on its subject', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(paints(container)).toContain(ACCENT);
    });

    it('Elevation is a light | dark split, the same drawing in two panes', () => {
        const { container } = render(React.createElement(HEROES['foundations-elevation'].Hero));
        expect([...container.querySelectorAll('[data-color-mode]')].map((n) => n.dataset.colorMode)).toEqual(['light', 'dark']);
    });

    it('Logos draws the kit construction: the four corner circles', () => {
        const { container } = render(React.createElement(HEROES['foundations-logos'].Hero));
        expect(container.querySelectorAll('[data-shape="logo-construction"] circle[stroke-dasharray]')).toHaveLength(4);
    });
});
