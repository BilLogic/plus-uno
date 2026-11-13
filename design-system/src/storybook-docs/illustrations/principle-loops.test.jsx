import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FrameworkStrip, PRINCIPLES, PrincipleReel } from './principle-loops.jsx';

/**
 * The Motion principles page: four principles in P-L-U-S order, each with the
 * line that sticks, and loops that run on motion tokens and stop when the
 * person asks for less motion.
 */
const STYLES = join(__dirname, '..', '..', 'styles');
const mdx = readFileSync(join(STYLES, 'MotionPrinciples.mdx'), 'utf8');
const css = readFileSync(join(__dirname, 'principle-loops.css'), 'utf8');

const ORDER = [
    ['Productivity', 'Always responsive', 'Keep up, never hold up.'],
    ['Learning', 'Build understanding', 'Show how, not just what.'],
    ['Uplift', 'Lead with empathy', 'Cheer the wins, cushion the misses.'],
    ['Simplicity', 'Cut the noise', 'One story at a time.'],
];

describe('Motion principles', () => {
    it('lists the principles in P-L-U-S order with their lines', () => {
        expect(PRINCIPLES.map((p) => [p.serves, p.name, p.sticky])).toEqual(ORDER);
    });

    it('renders each principle section in that order on the page, with its sticky line', () => {
        let at = -1;
        for (const [, name, sticky] of ORDER) {
            const heading = mdx.indexOf(`<FoundationSubsection title="${name}">`);
            expect(heading, name).toBeGreaterThan(at);
            const line = mdx.indexOf(sticky, heading);
            expect(line, sticky).toBeGreaterThan(heading);
            at = line;
        }
    });

    it('names none of the retired principles', () => {
        for (const old of ['Show what changed', 'Move like real things', 'Quiet by default']) expect(mdx).not.toContain(old);
    });

    it('puts one loop card per principle in the framework strip, loop first', () => {
        const { container } = render(<FrameworkStrip />);
        const cards = [...container.querySelectorAll('[data-principle-card]')];
        expect(cards.map((c) => c.querySelector('[data-framework]').textContent)).toEqual(ORDER.map((o) => o[0]));
        for (const card of cards) {
            expect(card.firstElementChild.hasAttribute('data-principle-loop')).toBe(true);
            expect(card.querySelector('[data-sticky]').textContent).toBe(ORDER[cards.indexOf(card)][2]);
        }
    });

    it('draws a PLUS moment reel of three frames for each principle', () => {
        for (const p of PRINCIPLES) {
            const { container } = render(<PrincipleReel id={p.id} />);
            expect(container.querySelectorAll('[data-reel-frame]')).toHaveLength(3);
            expect(container.querySelector('text')).toBeNull();
        }
    });

    it('stops every loop under reduced motion and runs on spring tokens, never a curve', () => {
        expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[^{]*\{[^}]*\[data-principle-loop\][^}]*animation:\s*none/);
        expect(css).not.toMatch(/cubic-bezier|ease-in|ease-out|ease\b/);
        expect(css).toMatch(/animation-timing-function:\s*var\(--ds-motion-/);
        expect(css).not.toMatch(/\d(ms|s)\b/);
    });
});
