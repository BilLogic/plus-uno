import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FIGURES } from './layout-figure-data.js';
import { CoreSizeMatrix, LayoutFigure } from './layout-figures.jsx';

const NAMES = Object.keys(FIGURES);

describe('Layout figures', () => {
    it.each(NAMES)('%s is a titled drawing painted only with kit roles', (name) => {
        const { container } = render(<LayoutFigure name={name} title={`Figure ${name}`} />);
        const svg = container.querySelector('svg');
        expect(svg.getAttribute('aria-label')).toBe(`Figure ${name}`);
        const paints = [...svg.querySelectorAll('[fill],[stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]);
        for (const paint of paints.filter((p) => p && p !== 'none')) expect(paint, `${name} paints a literal`).toMatch(/^var\(--/);
    });

    it('refuses a figure it does not have', () => {
        expect(() => render(<LayoutFigure name="nope" title="x" />)).toThrow(/no figure named nope/);
    });

    it('draws the core-size matrix with a drawing in every filled cell and none in an empty one', () => {
        const { container } = render(<CoreSizeMatrix />);
        expect(container.querySelectorAll('[role="row"]')).toHaveLength(7);
        expect(container.querySelectorAll('svg')).toHaveLength(23);
    });
});
