import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast, ToastContainer, FLAG_AUTO_CLOSE_MS } from './Toast';

/**
 * How long a flag stays. Success and info close themselves after 8 seconds;
 * warning and error stay until the person dismisses them, because they ask
 * for something to be done.
 */
describe('Toast timing', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('waits 8 seconds', () => {
        expect(FLAG_AUTO_CLOSE_MS).toBe(8000);
    });

    it.each(['success', 'info'])('closes a %s flag after 8 seconds, not before', (style) => {
        const onClose = vi.fn();
        render(<Toast style={style} title="Saved" show onClose={onClose}>Done.</Toast>);
        act(() => { vi.advanceTimersByTime(FLAG_AUTO_CLOSE_MS - 1); });
        expect(onClose).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each(['warning', 'danger'])('keeps a %s flag open until it is dismissed', (style) => {
        const onClose = vi.fn();
        render(<Toast style={style} title="Upload failed" show onClose={onClose}>Try again.</Toast>);
        act(() => { vi.advanceTimersByTime(60000); });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('lets a caller override the timing', () => {
        const onClose = vi.fn();
        render(<Toast style="danger" title="Gone" show onClose={onClose} autohide delay={3000}>x</Toast>);
        act(() => { vi.advanceTimersByTime(3000); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe('ToastContainer', () => {
    it('sits bottom-left by default', () => {
        render(<ToastContainer data-testid="flags"><span>flag</span></ToastContainer>);
        const container = screen.getByTestId('flags');
        expect(container).toHaveClass('bottom-0', 'start-0');
    });
});
