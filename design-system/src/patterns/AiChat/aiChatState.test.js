import { beforeEach, describe, expect, it } from 'vitest';
import {
    AI_CHAT_FULLSCREEN_BELOW,
    AI_CHAT_MODES,
    AI_CHAT_STORAGE_KEY,
    aiChatReducer,
    initialAiChatState,
    isFabHidden,
    readAiChatMemory,
    writeAiChatMemory,
} from './aiChatState';

/**
 * AI chat's state: one pure reducer for which mode chat is in and whether it is
 * open, and the tab's memory of it. The rules are asserted here; what a person
 * sees of each mode is asserted in the `AI/AI chat` stories.
 */
const back = (mode) => (mode === 'fullscreen' ? 'popup' : mode);
const closed = (mode = 'popup', from = back(mode)) => ({ mode, open: false, from });
const opened = (mode = 'popup', from = back(mode)) => ({ mode, open: true, from });

describe('the modes', () => {
    it('are popup, panel and fullscreen, and a popup goes full screen under 768', () => {
        expect(AI_CHAT_MODES).toEqual(['popup', 'panel', 'fullscreen']);
        expect(AI_CHAT_FULLSCREEN_BELOW).toBe(768);
    });
});

describe('aiChatReducer', () => {
    it('opens and closes in the mode it is in', () => {
        expect(aiChatReducer(closed('panel'), { type: 'open' })).toEqual(opened('panel'));
        expect(aiChatReducer(opened('popup'), { type: 'close' })).toEqual(closed('popup'));
    });

    it('moves to a mode and opens it', () => {
        expect(aiChatReducer(opened('popup'), { type: 'setMode', mode: 'panel' }))
            .toEqual({ mode: 'panel', open: true, from: 'panel' });
        expect(aiChatReducer(closed('popup'), { type: 'setMode', mode: 'panel' }).open).toBe(true);
    });

    it('ignores a mode it does not have', () => {
        const state = opened('popup');
        expect(aiChatReducer(state, { type: 'setMode', mode: 'sidebar' })).toBe(state);
    });

    it('switches between popup and Panel, and from full screen goes to the Panel', () => {
        expect(aiChatReducer(opened('popup'), { type: 'switchMode' }).mode).toBe('panel');
        expect(aiChatReducer(opened('panel'), { type: 'switchMode' }).mode).toBe('popup');
        expect(aiChatReducer(opened('fullscreen', 'popup'), { type: 'switchMode' })).toEqual(opened('panel', 'panel'));
    });

    it('enters full screen from the mode it was in and returns there', () => {
        const full = aiChatReducer(opened('panel'), { type: 'toggleFullscreen' });
        expect(full).toEqual(opened('fullscreen', 'panel'));
        expect(aiChatReducer(full, { type: 'toggleFullscreen' })).toEqual(opened('panel', 'panel'));
    });

    it('closing from full screen keeps the mode to return to', () => {
        const state = aiChatReducer(opened('fullscreen', 'panel'), { type: 'close' });
        expect(state).toEqual(closed('fullscreen', 'panel'));
        expect(aiChatReducer(state, { type: 'open' }).mode).toBe('fullscreen');
    });
});

describe('isFabHidden', () => {
    it('hides the button while chat is open in the Panel or full screen, never in the popup or closed', () => {
        expect(isFabHidden(opened('panel'))).toBe(true);
        expect(isFabHidden(opened('fullscreen'))).toBe(true);
        expect(isFabHidden(opened('popup'))).toBe(false);
        expect(isFabHidden(closed('panel'))).toBe(false);
        expect(isFabHidden(closed('fullscreen'))).toBe(false);
    });
});

describe('the tab memory', () => {
    beforeEach(() => window.sessionStorage.clear());

    it('remembers the mode in sessionStorage and the Panel being open', () => {
        writeAiChatMemory(AI_CHAT_STORAGE_KEY, opened('panel'));
        expect(JSON.parse(window.sessionStorage.getItem(AI_CHAT_STORAGE_KEY))).toEqual({ mode: 'panel', open: true });
        expect(readAiChatMemory(AI_CHAT_STORAGE_KEY)).toEqual({ mode: 'panel', open: true });
    });

    it('never remembers a popup or full screen as open', () => {
        writeAiChatMemory(AI_CHAT_STORAGE_KEY, opened('popup'));
        expect(readAiChatMemory(AI_CHAT_STORAGE_KEY)).toEqual({ mode: 'popup', open: false });
        writeAiChatMemory(AI_CHAT_STORAGE_KEY, opened('fullscreen'));
        expect(readAiChatMemory(AI_CHAT_STORAGE_KEY)).toEqual({ mode: 'fullscreen', open: false });
    });

    it('reads nothing from a missing, broken or foreign entry', () => {
        expect(readAiChatMemory(AI_CHAT_STORAGE_KEY)).toBeNull();
        window.sessionStorage.setItem(AI_CHAT_STORAGE_KEY, '{nope');
        expect(readAiChatMemory(AI_CHAT_STORAGE_KEY)).toBeNull();
        window.sessionStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify({ mode: 'sidebar', open: true }));
        expect(readAiChatMemory(AI_CHAT_STORAGE_KEY)).toBeNull();
    });

    it('keeps nothing for a null key', () => {
        writeAiChatMemory(null, opened('panel'));
        expect(window.sessionStorage.length).toBe(0);
        expect(readAiChatMemory(null)).toBeNull();
    });

    it('starts from the memory, else the default mode, closed', () => {
        expect(initialAiChatState(null, 'popup')).toEqual(closed('popup'));
        expect(initialAiChatState({ mode: 'panel', open: true }, 'popup')).toEqual(opened('panel'));
        expect(initialAiChatState({ mode: 'fullscreen', open: false }, 'popup')).toEqual(closed('fullscreen', 'popup'));
    });

    it('opens a tab with no memory only when asked, and lets a memory of closed win', () => {
        expect(initialAiChatState(null, 'popup', true)).toEqual(opened('popup'));
        expect(initialAiChatState({ mode: 'popup', open: false }, 'panel', true)).toEqual(closed('popup'));
    });
});
