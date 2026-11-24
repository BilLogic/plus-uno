import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePageView } from './PageView';

const pressEscape = (handled) => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    if (handled) event.preventDefault();
    act(() => {
        document.body.dispatchEvent(event);
    });
};

describe('usePageView, Escape in full screen', () => {
    it('stays in full screen when a control already handled the key', () => {
        const { result } = renderHook(() => usePageView());
        act(() => result.current.setFullScreen(true));
        pressEscape(true);
        expect(result.current.fullScreen).toBe(true);
    });

    it('leaves full screen when nothing else handled the key', () => {
        const { result } = renderHook(() => usePageView());
        act(() => result.current.setFullScreen(true));
        pressEscape(false);
        expect(result.current.fullScreen).toBe(false);
    });
});
