/**
 * `Logo` — the seven mark sizes, six appearances, the small-size drawing at 24
 * and below, and the lockup with its 24 minimum.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo, { LOGO_SIZES, LOGO_APPEARANCES, LOCKUP_MIN_SIZE } from './Logo';

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
        expect(parseFloat(container.querySelector('svg').getAttribute('width'))).toBeCloseTo(24 * 2.81, 0);
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
});
