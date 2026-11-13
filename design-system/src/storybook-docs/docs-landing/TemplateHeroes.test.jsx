import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEROES } from './hero-registry.jsx';

const TEMPLATE_IDS = [
    'templates-overview',
    'templates-frame',
    'templates-page',
    'templates-section-section',
    'templates-card',
    'templates-table',
    'templates-form',
    'templates-modal-modal',
    'templates-panel-panel',
    'templates-popup-popup',
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

