import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SAVE_FAILED, useInlineEdit } from './index';

const key = (hook, name, extra = {}) => {
    const event = { key: name, preventDefault: vi.fn(), currentTarget: { blur: vi.fn() }, ...extra };
    act(() => hook.result.current.handlers.onKeyDown(event));
    return event;
};

describe('useInlineEdit through the field module', () => {
    it('is a pass-through when not enabled', () => {
        const { result } = renderHook(() => useInlineEdit({ enabled: false }));
        expect(result.current).toEqual({ enabled: false });
    });

    it('opens the editor once the draft differs from the saved value', () => {
        const hook = renderHook(() => useInlineEdit({ enabled: true, defaultValue: 'Ada' }));
        expect(hook.result.current.editing).toBe(false);
        act(() => hook.result.current.setDraft('Ada L'));
        expect(hook.result.current.editing).toBe(true);
    });

    it('single-line: Enter leaves the field, and leaving it commits the draft', async () => {
        const onSave = vi.fn().mockResolvedValue();
        const hook = renderHook(() => useInlineEdit({ enabled: true, defaultValue: 'Ada', onSave }));
        act(() => hook.result.current.setDraft('Grace'));
        const event = key(hook, 'Enter');
        expect(event.currentTarget.blur).toHaveBeenCalled();
        await act(async () => hook.result.current.handlers.onBlur());
        expect(onSave).toHaveBeenCalledWith('Grace');
        expect(hook.result.current.editing).toBe(false);
    });

    it('Escape cancels: the draft returns to the saved value and nothing is saved', async () => {
        const onSave = vi.fn();
        const hook = renderHook(() => useInlineEdit({ enabled: true, defaultValue: 'Ada', onSave }));
        act(() => hook.result.current.setDraft('Grace'));
        const event = key(hook, 'Escape');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(hook.result.current.draft).toBe('Ada');
        await act(async () => hook.result.current.handlers.onBlur());
        expect(onSave).not.toHaveBeenCalled();
    });

    it('multi-line: Enter alone adds a line, Cmd+Enter commits, blur keeps the field open', async () => {
        const onSave = vi.fn().mockResolvedValue();
        const hook = renderHook(() => useInlineEdit({ enabled: true, multiline: true, defaultValue: 'a', onSave }));
        act(() => hook.result.current.setDraft('b'));
        const plain = key(hook, 'Enter');
        expect(plain.preventDefault).not.toHaveBeenCalled();
        await act(async () => hook.result.current.handlers.onBlur());
        expect(onSave).not.toHaveBeenCalled();
        await act(async () => { key(hook, 'Enter', { metaKey: true }); });
        expect(onSave).toHaveBeenCalledWith('b');
    });

    it('a failed save keeps the draft, stays open and reports the error', async () => {
        const onSave = vi.fn().mockRejectedValue(new Error('Offline'));
        const hook = renderHook(() => useInlineEdit({ enabled: true, defaultValue: 'a', onSave }));
        act(() => hook.result.current.setDraft('b'));
        await act(async () => hook.result.current.handlers.onBlur());
        expect(hook.result.current.error).toBe('Offline');
        expect(hook.result.current.draft).toBe('b');
        expect(hook.result.current.editing).toBe(true);
    });

    it('falls back to the stated message when a failure carries none', async () => {
        const hook = renderHook(() => useInlineEdit({ enabled: true, defaultValue: 'a', onSave: () => Promise.reject() }));
        act(() => hook.result.current.setDraft('b'));
        await act(async () => hook.result.current.handlers.onBlur());
        expect(hook.result.current.error).toBe(SAVE_FAILED);
    });
});
