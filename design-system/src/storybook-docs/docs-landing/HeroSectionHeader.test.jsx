import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PAINT } from '../illustrations/paint.js';
import { FilteringHero } from './PatternHeroes.jsx';
import { SectionHero } from './TemplateHeroes.jsx';

/**
 * The heroes that draw a Section header draw the three-row header: the title
 * row ends with the labeled Primary, and filter triggers sit after Search in
 * their own row under the title, never on the title row.
 */

const rects = (container) => [...container.querySelectorAll('rect')].map((rect) => ({
    x: Number(rect.getAttribute('x')),
    y: Number(rect.getAttribute('y')),
    w: Number(rect.getAttribute('width')),
    h: Number(rect.getAttribute('height')),
    fill: rect.getAttribute('fill'),
}));

const BUTTON_FILLS = [PAINT.buttonDefault, PAINT.buttonPrimary, PAINT.rowSelected, PAINT.tabSelected];
/** A button in the Section hero, in hero units. */
const BUTTON_H = 8;

describe('heroes that draw a Section header', () => {
    it('SectionHero ends the title row with the Primary, after More', () => {
        const { container } = render(<svg><SectionHero /></svg>);
        const all = rects(container);
        const titleY = Math.min(...all.filter((r) => r.fill === PAINT.placeholderHeading || r.fill === PAINT.accent).map((r) => r.y));
        const titleRow = all.filter((r) => BUTTON_FILLS.includes(r.fill) && r.h === BUTTON_H && Math.abs(r.y - titleY) <= 4).sort((a, b) => a.x - b.x);
        expect(titleRow.length).toBe(2);
        expect(titleRow[1].fill).toBe(PAINT.buttonPrimary);
        expect(titleRow[0].w).toBeLessThan(titleRow[1].w);
    });

    it('SectionHero puts the description under the title, not beside it', () => {
        const { container } = render(<svg><SectionHero /></svg>);
        const all = rects(container);
        const title = all.find((r) => r.fill === PAINT.accent && r.h === 5);
        const description = all.find((r) => r.fill === PAINT.placeholderText && r.x === title.x && r.y > title.y);
        expect(description, 'a description bar starts at the title edge, below it').toBeTruthy();
        expect(description.y).toBeGreaterThanOrEqual(title.y + title.h);
    });

    it('FilteringHero puts Search, then the filter triggers, in a row under the title', () => {
        const { container } = render(<svg><FilteringHero /></svg>);
        const all = rects(container);
        const title = all.find((r) => r.fill === PAINT.placeholderHeading);
        const triggers = all.filter((r) => (r.fill === PAINT.buttonDefault || r.fill === PAINT.rowSelected) && r.h === 20);
        expect(triggers.length).toBe(2);
        for (const trigger of triggers) expect(trigger.y).toBeGreaterThanOrEqual(title.y + title.h);
        const search = all.find((r) => r.fill === PAINT.fieldSurface && r.y === triggers[0].y);
        expect(search, 'a Search field on the triggers row').toBeTruthy();
        expect(search.x).toBe(title.x);
        expect(Math.min(...triggers.map((t) => t.x))).toBeGreaterThan(search.x + search.w);
    });
});
