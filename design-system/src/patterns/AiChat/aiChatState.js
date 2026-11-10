/**
 * AI chat's state, apart from any markup: which mode chat is in, whether it is
 * open, and what the tab remembers of it. One pure reducer, so every rule is
 * tested in one place.
 */

/** The three places chat can sit: a popup over the Page, the Frame's Panel, or the whole window. */
export const AI_CHAT_MODES = ['popup', 'panel', 'fullscreen'];

/** Under this window width a popup is shown full screen. */
export const AI_CHAT_FULLSCREEN_BELOW = 768;

/** The sessionStorage key the chat's mode (and an open Panel) are kept under, for this tab. */
export const AI_CHAT_STORAGE_KEY = 'plus-ai-chat';

const isMode = (mode) => AI_CHAT_MODES.includes(mode);

/**
 * `{ mode, open, from }`: `from` is the mode full screen returns to.
 *
 * @param {{ mode: string, open: boolean } | null} memory What the tab remembered, if anything.
 * @param {string} defaultMode The mode a tab with no memory starts in.
 * @param {boolean} defaultOpen Whether a tab with no memory starts open.
 */
export const initialAiChatState = (memory, defaultMode = 'popup', defaultOpen = false) => {
    const mode = isMode(memory?.mode) ? memory.mode : defaultMode;
    return {
        mode,
        open: memory ? Boolean(memory.open) : defaultOpen,
        from: mode === 'fullscreen' ? defaultMode : mode,
    };
};

/**
 * Actions: `open`, `close`, `setMode` (with `mode`; opens it), `switchMode`
 * (popup and Panel trade places; from full screen it goes to the Panel) and
 * `toggleFullscreen` (enters from the current mode, leaves back to it).
 */
export const aiChatReducer = (state, action) => {
    switch (action.type) {
        case 'open':
            return { ...state, open: true };
        case 'close':
            return { ...state, open: false };
        case 'setMode':
            if (!isMode(action.mode)) return state;
            return {
                mode: action.mode,
                open: true,
                from: action.mode === 'fullscreen' ? state.from : action.mode,
            };
        case 'switchMode':
            return aiChatReducer(state, { type: 'setMode', mode: state.mode === 'panel' ? 'popup' : 'panel' });
        case 'toggleFullscreen':
            if (state.mode === 'fullscreen') return aiChatReducer(state, { type: 'setMode', mode: state.from });
            return { mode: 'fullscreen', open: true, from: state.mode };
        default:
            return state;
    }
};

/** The floating button is the one way in, so it hides only while chat is open in the Panel or full screen. */
export const isFabHidden = (state) => state.open && state.mode !== 'popup';

/** The tab's remembered `{ mode, open }`, or null where there is none, it is unreadable, or there is no storage. */
export const readAiChatMemory = (key) => {
    if (!key || typeof window === 'undefined') return null;
    try {
        const parsed = JSON.parse(window.sessionStorage.getItem(key));
        if (!parsed || !isMode(parsed.mode)) return null;
        return { mode: parsed.mode, open: parsed.mode === 'panel' && parsed.open === true };
    } catch {
        return null;
    }
};

/** Remembers the mode, and an open Panel; a popup or full screen is never remembered open. */
export const writeAiChatMemory = (key, state) => {
    if (!key || typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(key, JSON.stringify({
            mode: state.mode,
            open: state.mode === 'panel' && state.open,
        }));
    } catch {
        // Storage full or blocked: chat still works, it just forgets.
    }
};

/** How many messages a tab keeps; older ones drop off the top. */
export const AI_CHAT_KEPT_MESSAGES = 50;

const isMessage = (m) => m && typeof m.id === 'string' && (m.role === 'user' || m.role === 'ai') && typeof m.text === 'string';

/** The conversation kept for the tab under `${key}-messages`, so a reload or a page change does not lose it. */
export const readAiChatMessages = (key) => {
    if (!key || typeof window === 'undefined') return [];
    try {
        const parsed = JSON.parse(window.sessionStorage.getItem(`${key}-messages`));
        return Array.isArray(parsed) ? parsed.filter(isMessage).slice(-AI_CHAT_KEPT_MESSAGES) : [];
    } catch {
        return [];
    }
};

/** Keeps the last `AI_CHAT_KEPT_MESSAGES` messages for the tab; an empty conversation clears the key. */
export const writeAiChatMessages = (key, messages) => {
    if (!key || typeof window === 'undefined') return;
    try {
        if (messages.length === 0) window.sessionStorage.removeItem(`${key}-messages`);
        else window.sessionStorage.setItem(`${key}-messages`, JSON.stringify(messages.slice(-AI_CHAT_KEPT_MESSAGES)));
    } catch {
        // Storage full or blocked: the conversation lasts as long as the page.
    }
};
