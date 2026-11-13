import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEROES } from './hero-registry.jsx';
import { TRANSITION_PARTS } from './MotionHeroes.jsx';
import { crossings } from '../illustrations/trails.js';
import { SpringTrail } from '../illustrations/shapes.jsx';
import { pathGeometry } from '../illustrations/shapes-geometry.js';

const IDS = ['principles', 'physics', 'transitions', 'choreography', 'playground', 'library'].map((n) => `foundations-motion-${n}`);
const ACCENT = 'var(--ds-background-brand-bold)';
const paints = (root) =>
    [...root.querySelectorAll('[fill],[stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]).filter((v) => v && v !== 'none');
const draw = (id) => render(React.createElement(HEROES[id].Hero)).container;

describe('Motion heroes', () => {
    it.each(IDS)('%s has a drawing and a one-sentence description', (id) => {
        expect(HEROES[id]?.Hero).toBeTypeOf('function');
        expect(HEROES[id].description).toMatch(/^[A-Z].*\.$/);
    });

    it.each(IDS)('%s draws no text and paints only through tokens', (id) => {
        const c = draw(id);
        expect(c.querySelector('text')).toBeNull();
        expect(c.textContent).toBe('');
        for (const v of paints(c)) expect(/^var\(--ds-[a-z-]+\)$/.test(v), v).toBe(true);
    });

    it.each(IDS)('%s puts the brand accent on its subject', (id) => {
        expect(paints(draw(id))).toContain(ACCENT);
    });

    it('Physics is one shape at equal time steps on a time grid', () => {
        const c = draw('foundations-motion-physics');
        expect(c.querySelectorAll('[data-shape="spring-trail"] rect')).toHaveLength(11);
        expect(c.querySelectorAll('[data-time-grid] line').length).toBeGreaterThan(5);
        const xs = [...c.querySelectorAll('[data-shape="spring-trail"] rect')].map((r) => +r.getAttribute('x') + +r.getAttribute('width') / 2);
        const gaps = xs.slice(1).map((x, i) => Math.round((x - xs[i]) * 100) / 100);
        expect(new Set(gaps).size).toBe(1);
    });

    it('Transitions draws three paths from the before row to the after card, ring to arrowhead', () => {
        const c = draw('foundations-motion-transitions');
        expect(c.querySelectorAll('[data-shape="path"]')).toHaveLength(3);
        expect(c.querySelectorAll('[data-shape="path"] circle')).toHaveLength(3);
        expect(c.querySelectorAll('[data-shape="path"] polygon')).toHaveLength(3);
    });

    it('Transitions paths all point downward and none cross', () => {
        const geo = Object.values(TRANSITION_PARTS).map((p) => pathGeometry(p.from, p.to, { rect: p.rect }));
        for (const g of geo) expect(g.tip[1]).toBeGreaterThan(g.start[1]);
        expect(crossings(geo.map((g) => [g.start, g.tip]))).toEqual([]);
    });

    it("Transitions' button path stops at the button's top edge", () => {
        const { from, to, rect } = TRANSITION_PARTS.button;
        expect(pathGeometry(from, to, { rect }).tip[1]).toBe(rect.y);
    });

    it('Choreography: three burst clips that do not overlap, and the playhead on two live clips', () => {
        const c = draw('foundations-motion-choreography');
        const burst = [...c.querySelectorAll('[data-track="row"]')][1];
        const clips = [...burst.querySelectorAll('[data-clip]')].map((g) => {
            const r = g.querySelector('rect');
            return [+r.getAttribute('x'), +r.getAttribute('x') + +r.getAttribute('width')];
        });
        expect(clips).toHaveLength(3);
        clips.slice(1).forEach(([start], i) => expect(start).toBeGreaterThanOrEqual(clips[i][1]));
        expect(c.querySelectorAll('[data-clip="live"]')).toHaveLength(2);
        expect(c.querySelectorAll('line').length).toBeGreaterThan(30);
    });

    it('Principles is four scenes, one per card', () => {
        const c = draw('foundations-motion-principles');
        expect(c.querySelectorAll('[data-time-grid]')).toHaveLength(0);
        expect(c.querySelectorAll('foreignObject')).toHaveLength(4);
    });

    it('Playground draws one target line, the spring trail\'s own', () => {
        expect(draw('foundations-motion-playground').querySelectorAll('line[stroke-dasharray]')).toHaveLength(1);
    });
});

describe('SpringTrail options', () => {
    const trail = (props) =>
        render(<svg><SpringTrail x={0} y={0} w={100} h={80} n={5} accent {...props} /></svg>).container.querySelectorAll('[data-shape="spring-trail"] rect');
    const fills = (rects) => [...rects].map((r) => r.getAttribute('fill'));
    it('accents only the last still by default, every still with accentAll', () => {
        expect(fills(trail({})).filter((f) => f === ACCENT)).toHaveLength(1);
        expect(fills(trail({ accentAll: true })).filter((f) => f === ACCENT)).toHaveLength(5);
    });
    it('with advance, the first still starts at the left edge and each is `advance` further on', () => {
        const xs = [...trail({ advance: 10, still: 12 })].map((r) => +r.getAttribute('x'));
        expect(xs[0]).toBe(0);
        expect(xs.slice(1).map((x, i) => x - xs[i])).toEqual([10, 10, 10, 10]);
    });
    it('step sets the seconds between stills', () => {
        const ys = (step) => [...trail({ step })].map((r) => +r.getAttribute('y'));
        expect(ys(0.15)).not.toEqual(ys(0.05));
    });
});
