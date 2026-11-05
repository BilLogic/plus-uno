import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useOwnWidth } from './useOwnWidth';

let boxWidth = 800;
const Probe = ({ onWidth }) => {
    const ref = useRef(null);
    onWidth(useOwnWidth(ref, 960));
    return <div ref={ref} />;
};

describe('useOwnWidth', () => {
    afterEach(() => vi.restoreAllMocks());

    it('reads the box and follows the window resize', () => {
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: boxWidth }));
        const seen = [];
        render(<Probe onWidth={(w) => seen.push(w)} />);
        expect(seen.at(-1)).toBe(800);
        boxWidth = 500;
        act(() => { window.dispatchEvent(new Event('resize')); });
        expect(seen.at(-1)).toBe(500);
    });

    it('keeps the last width when the box measures 0', () => {
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: boxWidth }));
        const seen = [];
        render(<Probe onWidth={(w) => seen.push(w)} />);
        boxWidth = 0;
        act(() => { window.dispatchEvent(new Event('resize')); });
        expect(seen.at(-1)).toBe(500);
    });
});
