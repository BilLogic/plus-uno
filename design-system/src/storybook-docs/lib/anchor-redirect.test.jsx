import { describe, expect, it, vi } from 'vitest';
import { redirectMovedAnchor } from './anchor-redirect.jsx';

const windowAt = (hash) => {
    const replace = vi.fn();
    const win = { location: { hash, replace } };
    win.top = win;
    return { win, replace };
};

describe('redirectMovedAnchor', () => {
    it('sends a reader who opens the old anchor to the new page', () => {
        const { win, replace } = windowAt('#foundation-size-roles');
        const to = '?path=/docs/foundations-layout-dimensions--docs#foundation-size-roles';
        expect(redirectMovedAnchor('#foundation-size-roles', to, win)).toBe(true);
        expect(replace).toHaveBeenCalledWith(to);
    });

    it('leaves every other hash alone', () => {
        const { win, replace } = windowAt('#foundation-overview');
        expect(redirectMovedAnchor('#foundation-size-roles', '?path=/x', win)).toBe(false);
        expect(replace).not.toHaveBeenCalled();
    });
});
