/**
 * `Logo` — the seven mark sizes, six appearances, the small-size drawing at 24
 * and below, and the lockup with its 24 minimum.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo, { LOGO_SIZES, LOGO_APPEARANCES, LOCKUP_MIN_SIZE } from './Logo';
import { WORDMARKS } from './logoArt';

const LOCKUP_SIZES = [24, 32, 48, 64, 96];
const WEIGHTS = { 96: 510, 64: 520, 48: 530, 32: 550, 24: 580 };

const plusArms = (container) => [...container.querySelectorAll('.plus-logo__plus rect')];
const vertical = (container) => parseFloat(plusArms(container)[1].getAttribute('height'));

describe('Logo', () => {
    it('defaults to the 32 mark, colored, with no wordmark', () => {
        const { container } = render(<Logo />);
        const root = container.firstChild;
        expect(root).toHaveClass('plus-logo--32', 'plus-logo--colored');
        expect(root.querySelector('.plus-logo__wordmark')).toBeNull();
    });

    it('offers the seven sizes and six appearances', () => {
        expect(LOGO_SIZES).toEqual([16, 20, 24, 32, 48, 64, 96]);
        expect(LOGO_APPEARANCES).toHaveLength(6);
    });

    it.each(LOGO_SIZES)('draws the %i mark at that height', (size) => {
        const { container } = render(<Logo size={size} />);
        const svg = container.querySelector('svg');
        expect(svg.getAttribute('height')).toBe(String(size));
        expect(svg.getAttribute('width')).toBe(String(size));
    });

    it.each(LOGO_APPEARANCES)('draws the %s appearance', (appearance) => {
        const { container } = render(<Logo appearance={appearance} />);
        expect(container.firstChild).toHaveClass(`plus-logo--${appearance}`);
        expect(container.querySelector('svg')).not.toBeNull();
    });

    it('swaps to the heavier small-size plus at 24 and below', () => {
        expect(vertical(render(<Logo size={24} />).container)).toBe(27);
        expect(vertical(render(<Logo size={16} />).container)).toBe(27);
        expect(vertical(render(<Logo size={32} />).container)).toBe(24);
    });

    it('shows the wordmark at 24 and up, one wordmark glyph per letter', () => {
        const { container } = render(<Logo size={24} wordmark />);
        expect(container.querySelectorAll('.plus-logo__wordmark path')).toHaveLength(4);
        expect(container.firstChild).toHaveClass('plus-logo--lockup');
    });

    it('keeps one outlined wordmark set per lockup size, at the weight tuned for it', () => {
        expect(Object.keys(WORDMARKS).map(Number).sort((a, b) => a - b)).toEqual(LOCKUP_SIZES);
        for (const size of LOCKUP_SIZES) {
            expect(WORDMARKS[size].weight).toBe(WEIGHTS[size]);
            expect(WORDMARKS[size].cap).toBe(716);
            expect(WORDMARKS[size].paths).toHaveLength(4);
        }
    });

    it.each(LOCKUP_SIZES)('draws the %i lockup from its own wordmark set', (size) => {
        const { container } = render(<Logo size={size} wordmark />);
        const group = container.querySelector('.plus-logo__wordmark');
        expect(group.getAttribute('data-weight')).toBe(String(WEIGHTS[size]));
        const drawn = [...group.querySelectorAll('path')].map((p) => p.getAttribute('d'));
        expect(drawn).toEqual(WORDMARKS[size].paths);
    });

    it.each(LOCKUP_SIZES)('sizes the %i lockup to the exported wordmark width', (size) => {
        const { container } = render(<Logo size={size} wordmark />);
        const set = WORDMARKS[size];
        const total = 96 + 24 + (set.width * 48) / set.cap;
        const svg = container.querySelector('svg');
        expect(parseFloat(svg.getAttribute('width'))).toBeCloseTo((size * total) / 96, 1);
        expect(svg.getAttribute('viewBox')).toBe(`0 0 ${+total.toFixed(2)} 96`);
    });

    it('makes the 96 wordmark 144.0 wide and the lockup 264.0', () => {
        const set = WORDMARKS[96];
        expect(((set.width * 48) / set.cap).toFixed(1)).toBe('144.0');
        const { container } = render(<Logo size={96} wordmark />);
        expect(parseFloat(container.querySelector('svg').getAttribute('width')).toFixed(1)).toBe('264.0');
    });

    it('draws only outlines, never text', () => {
        for (const size of LOCKUP_SIZES) {
            const { container } = render(<Logo size={size} wordmark />);
            expect(container.querySelectorAll('text, tspan')).toHaveLength(0);
        }
    });

    it('renders every appearance as a lockup', () => {
        for (const appearance of LOGO_APPEARANCES) {
            const { container } = render(<Logo appearance={appearance} size={48} wordmark />);
            expect(container.querySelectorAll('.plus-logo__wordmark path')).toHaveLength(4);
        }
    });

    it('falls back to the mark alone below the lockup minimum', () => {
        expect(LOCKUP_MIN_SIZE).toBe(24);
        const { container } = render(<Logo size={20} wordmark />);
        expect(container.querySelector('.plus-logo__wordmark')).toBeNull();
        expect(container.firstChild).not.toHaveClass('plus-logo--lockup');
    });

    it('draws both glow sets on the colored mark and one on colored-dark', () => {
        const colored = render(<Logo appearance="colored" />).container;
        expect(colored.querySelectorAll('.plus-logo__glows')).toHaveLength(2);
        const dark = render(<Logo appearance="colored-dark" />).container;
        expect(dark.querySelectorAll('.plus-logo__glows')).toHaveLength(1);
    });

    it('names itself PLUS and keeps ids unique between instances', () => {
        const { container } = render(<><Logo /><Logo /></>);
        const svgs = container.querySelectorAll('svg');
        expect(svgs[0].getAttribute('aria-label')).toBe('PLUS');
        const ids = [...container.querySelectorAll('clipPath')].map((n) => n.id);
        expect(new Set(ids).size).toBe(2);
    });

    it('does not pass a stray style string through to the DOM', () => {
        const { container } = render(<Logo appearance="filled" />);
        expect(container.firstChild.getAttribute('style')).toBeNull();
    });

    it('reads no --palette- primitives in any Logo stylesheet', () => {
        const stylesheets = readdirSync(__dirname).filter((file) => file.endsWith('.scss'));
        expect(stylesheets.length).toBeGreaterThan(0);
        for (const file of stylesheets) {
            const css = readFileSync(join(__dirname, file), 'utf8');
            expect(css, `${file} must read --ds-logo-* tokens rather than --palette-* primitives`).not.toMatch(/--palette-/);
        }
    });
});
