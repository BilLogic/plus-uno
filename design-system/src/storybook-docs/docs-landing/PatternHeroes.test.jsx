import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEROES } from './hero-registry.jsx';

const PATTERN_IDS = [
    'patterns-overview',
    'patterns-common-actions',
    'patterns-forms',
    'patterns-filtering',
    'patterns-navigation',
    'patterns-search',
    'patterns-indicators',
    'patterns-notifications',
    'patterns-states-disabled',
    'patterns-states-empty',
    'patterns-states-errors',
    'patterns-states-loading',
    'patterns-states-overflow',
    'patterns-states-read-only',
];

const ACCENT = 'var(--ds-background-brand-bold)';
const paints = (root) =>
    [...root.querySelectorAll('[fill],[stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]).filter((v) => v && v !== 'none');

describe('Patterns heroes', () => {
    it.each(PATTERN_IDS)('%s has a drawing and a one-sentence description', (id) => {
        expect(HEROES[id]?.Hero).toBeTypeOf('function');
        expect(HEROES[id].description).toMatch(/^[A-Z].*\.$/);
    });

    it.each(PATTERN_IDS)('%s draws no text and paints only through tokens', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(container.querySelector('text')).toBeNull();
        expect(container.textContent).toBe('');
        for (const value of paints(container)) expect(value).toMatch(/^var\(--ds-[a-z-]+\)$/);
    });

    it.each(PATTERN_IDS)('%s puts the brand accent on its subject', (id) => {
        const { container } = render(React.createElement(HEROES[id].Hero));
        expect(paints(container)).toContain(ACCENT);
    });

    it('Errors is the one hero that uses the danger roles, and only status tokens for them', () => {
        const danger = (id) => {
            const { container } = render(React.createElement(HEROES[id].Hero));
            return paints(container).filter((v) => /danger/.test(v));
        };
        expect(danger('patterns-states-errors').length).toBeGreaterThan(2);
        for (const id of PATTERN_IDS.filter((p) => p !== 'patterns-states-errors')) expect(danger(id)).toEqual([]);
    });
});
