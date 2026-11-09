import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@base-ui/react/dialog';
import {
    AiIcon,
    AiMessage,
    ButtonItem,
    DropdownMenu,
    IconButton,
    Popup,
    PromptInput,
    PromptStarters,
    PanelBody,
    PanelContainer,
    PanelFooter,
    PanelHeader,
    PanelHostContext,
} from '@/components';
import Frame from '../Frame';
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
import './AiChat.scss';

const NARROW_QUERY = `(max-width: ${AI_CHAT_FULLSCREEN_BELOW - 0.02}px)`;

/** Whether the window is under 768, where a popup is shown full screen. */
const useNarrow = () => {
    const [narrow, setNarrow] = useState(() => (
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        && window.matchMedia(NARROW_QUERY).matches
    ));
    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return undefined;
        const query = window.matchMedia(NARROW_QUERY);
        const update = () => setNarrow(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return narrow;
};

/** The one fallibility line, under the prompt input. */
export const AI_CHAT_DISCLAIMER = 'AI can make mistakes. Check important info.';

const AiChatContext = createContext(null);

/** The chat's state and actions, for anything inside an `AiChat`. Null outside one. */
export const useAiChat = () => useContext(AiChatContext);

const textOf = (m) => (m.sources?.length ? `${m.text}\n${m.sources.map((s) => `${s.title}: ${s.href}`).join('\n')}` : m.text);

const transcriptOf = (messages) => messages
    .map((m) => `${m.role === 'user' ? 'You' : 'AI'}: ${textOf(m)}`)
    .join('\n\n');

/**
 * One chat surface for every mode: the Panel parts (header, body, footer)
 * holding the conversation and a prompt input. `presentation` only changes
 * which controls the header carries.
 */
const ChatSurface = ({ presentation }) => {
    const chat = useAiChat();
    const {
        title, placeholder, messages, loading, draft, setDraft, starters, dispatch, clear, send, stop, narrow, linkTarget, rate,
    } = chat;
    const listRef = useRef(null);

    useEffect(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [messages, loading]);

    const copy = () => {
        window.navigator?.clipboard?.writeText(transcriptOf(messages));
    };

    const inPanel = presentation === 'panel';
    const actions = (
        <>
            <IconButton icon="eraser" label="Clear chat" spacing="compact" appearance="subtle" isDisabled={messages.length === 0} onClick={clear} />
            <IconButton
                icon={inPanel ? 'window-restore' : 'table-columns'}
                label={inPanel ? 'Move to popup' : 'Move to Panel'}
                spacing="compact"
                appearance="subtle"
                onClick={() => dispatch({ type: 'switchMode' })}
            />
            {narrow ? null : (
                <IconButton
                    icon={presentation === 'fullscreen' ? 'compress' : 'expand'}
                    label={presentation === 'fullscreen' ? 'Exit full screen' : 'Full screen'}
                    spacing="compact"
                    appearance="subtle"
                    onClick={() => dispatch({ type: 'toggleFullscreen' })}
                />
            )}
            <DropdownMenu
                placement="bottom-end"
                trigger={<IconButton icon="ellipsis" label="More actions" spacing="compact" appearance="subtle" />}
            >
                <ButtonItem isDisabled={messages.length === 0} onClick={copy}>Copy conversation</ButtonItem>
            </DropdownMenu>
            <IconButton icon="xmark" label="Close chat" spacing="compact" appearance="subtle" onClick={() => dispatch({ type: 'close' })} />
        </>
    );

    const surface = (
        <PanelContainer className={`plus-ai-chat plus-ai-chat--${presentation}`} data-ai-chat-presentation={presentation}>
            <PanelHeader titleIcon={<AiIcon name="ask" />} title={title} actions={actions} />
            <PanelBody className="plus-ai-chat__body">
                <div ref={listRef} className="plus-ai-chat__messages" role="log" aria-label="Conversation" aria-live="polite">
                    {messages.length === 0 ? (
                        <p className="plus-ai-chat__empty">Ask about what you are working on.</p>
                    ) : messages.map((m) => (
                        <div key={m.id} className={`plus-ai-chat__message plus-ai-chat__message--${m.role}`}>
                            {m.role === 'ai'
                                ? (
                                    <AiMessage
                                        className="plus-ai-chat__text"
                                        text={m.text}
                                        sources={m.sources}
                                        linkTarget={linkTarget}
                                        feedback={m.feedback ?? null}
                                        onFeedback={(feedback) => rate(m, feedback)}
                                    />
                                )
                                : <p className="plus-ai-chat__text">{m.text}</p>}
                        </div>
                    ))}
                    {loading ? (
                        <div className="plus-ai-chat__message plus-ai-chat__message--ai">
                            <AiMessage className="plus-ai-chat__text" status="thinking" />
                        </div>
                    ) : null}
                </div>
            </PanelBody>
            <PanelFooter className="plus-ai-chat__footer">
                <div className="plus-ai-chat__compose">
                    {messages.length === 0 && starters?.length ? (
                        <PromptStarters label="Suggested prompts" starters={starters} onSelect={(s) => setDraft(s.text ?? s.label)} />
                    ) : null}
                    <PromptInput
                        label={`Message to ${title}`}
                        placeholder={placeholder}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onSubmit={(text) => { setDraft(''); send(text); }}
                        isLoading={loading}
                        onStop={stop}
                    />
                </div>
                {/* Fallibility, said once under the input, never per message. */}
                <p className="plus-ai-chat__disclaimer">{AI_CHAT_DISCLAIMER}</p>
            </PanelFooter>
        </PanelContainer>
    );

    // The Panel area already hosts its content; a popup and full screen host their own, so the surface fills them.
    return inPanel ? surface : <PanelHostContext.Provider value>{surface}</PanelHostContext.Provider>;
};

ChatSurface.propTypes = { presentation: PropTypes.oneOf(['popup', 'panel', 'fullscreen']).isRequired };

/** The popup without a button to anchor to: it takes focus on open, as a popup does, and Escape closes it. */
const FloatingChat = () => {
    const { title, dispatch } = useAiChat();
    const ref = useRef(null);
    useEffect(() => { ref.current?.querySelector('textarea')?.focus(); }, []);
    return (
        <div
            ref={ref}
            className="plus-ai-chat__floating"
            role="dialog"
            aria-label={title}
            onKeyDown={(event) => { if (event.key === 'Escape' && !event.defaultPrevented) dispatch({ type: 'close' }); }}
        >
            <ChatSurface presentation="popup" />
        </div>
    );
};

/** The one entry point: a floating action button at the bottom right of the Page, with the popup anchored to it. */
const Launcher = () => {
    const { state, dispatch, title, narrow, launcher } = useAiChat();
    const fabHidden = isFabHidden(state);
    // Under 768 a popup is shown full screen, the same layer as full screen mode.
    const fullscreenShown = state.open && (state.mode === 'fullscreen' || (state.mode === 'popup' && narrow));
    const popupShown = state.open && state.mode === 'popup' && !narrow;

    const handleFullscreenChange = (next) => {
        if (next) return;
        dispatch({ type: state.mode === 'fullscreen' ? 'toggleFullscreen' : 'close' });
    };

    return (
        <>
            {!launcher && popupShown ? <FloatingChat /> : null}
            {!launcher || fabHidden || fullscreenShown ? null : (
                <Popup
                    triggerType="manual"
                    placement="top-end"
                    width="md"
                    className="plus-ai-chat__popup"
                    label={title}
                    show={popupShown}
                    onToggle={(next) => dispatch({ type: next ? 'open' : 'close' })}
                    offset={[12]}
                    trigger={(
                        <IconButton
                            icon={<AiIcon name="ask" size={24} />}
                            label={title}
                            appearance="primary"
                            shape="circle"
                            className="plus-ai-chat__fab"
                        />
                    )}
                >
                    <ChatSurface presentation="popup" />
                </Popup>
            )}
            <Dialog.Root open={fullscreenShown} onOpenChange={handleFullscreenChange}>
                <Dialog.Portal>
                    <Dialog.Popup
                        className="plus-ai-chat__fullscreen"
                        aria-label={title}
                        initialFocus={() => document.querySelector('.plus-ai-chat__fullscreen textarea')}
                    >
                        <ChatSurface presentation="fullscreen" />
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
};

/**
 * AI chat on a Frame: a floating action button at the bottom right of the
 * Page opens chat as a popup; from there it moves to the Frame's Panel or to
 * full screen. It takes the Frame's props and adds the chat.
 *
 * - The button is the one way in. It hides while chat is open in the Panel or
 *   full screen.
 * - The mode is remembered for the tab in sessionStorage (and an open Panel).
 * - Under 768 the popup is shown full screen.
 * - `variant="storybook"` is the Storybook docs' chat: the same chat, with
 *   its mode remembered under its own key.
 * - The conversation is kept in memory and moves with the mode. There is no
 *   history, and no backend: `respond(text, history)` returns the reply, `history` being the turns before it as `{ role, text }`.
 *   A reply is text, or `{ text, sources }`: the pages or records it drew on list under it.
 */
const AiChat = ({
    variant = 'app',
    defaultMode = 'popup',
    defaultOpen = false,
    storageKey = variant === 'storybook' ? `${AI_CHAT_STORAGE_KEY}-storybook` : AI_CHAT_STORAGE_KEY,
    launcher = true,
    linkTarget,
    onModeChange,
    respond,
    onFeedback,
    starters,
    title = 'AI chat',
    placeholder = 'Ask anything',
    panelLabel,
    children,
    ...frameProps
}) => {
    const [state, dispatch] = useReducer(
        aiChatReducer,
        undefined,
        () => initialAiChatState(readAiChatMemory(storageKey), defaultMode, defaultOpen),
    );
    const [messages, setMessages] = useState([]);
    const messagesRef = useRef(messages);
    messagesRef.current = messages;
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const narrow = useNarrow();
    const pending = useRef(0);

    useEffect(() => { writeAiChatMemory(storageKey, state); }, [storageKey, state]);

    const lastMode = useRef(state.mode);
    useEffect(() => {
        if (lastMode.current === state.mode) return;
        lastMode.current = state.mode;
        onModeChange?.(state.mode);
    }, [state.mode, onModeChange]);

    const clear = useCallback(() => {
        pending.current += 1;
        setMessages([]);
        setLoading(false);
    }, []);

    const stop = useCallback(() => {
        pending.current += 1;
        setLoading(false);
    }, []);

    const send = useCallback(async (text) => {
        const ticket = pending.current + 1;
        pending.current = ticket;
        const history = messagesRef.current.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', text: m.text }));
        setMessages((prev) => [...prev, { id: `u${prev.length}-${ticket}`, role: 'user', text }]);
        if (!respond) return;
        setLoading(true);
        let reply;
        try {
            reply = await respond(text, history);
        } catch {
            reply = null;
        }
        // A clear or a stop in the meantime owns the conversation now.
        if (pending.current !== ticket) return;
        setLoading(false);
        if (reply == null) return;
        // A reply is its text, or `{ text, sources }`; sources are what it drew on.
        const { text: replyText, sources } = typeof reply === 'string' ? { text: reply } : reply;
        setMessages((prev) => [...prev, { id: `a${prev.length}-${ticket}`, role: 'ai', text: replyText, sources }]);
    }, [respond]);

    // Every answer takes a rating; it stays on the message as chat moves between modes.
    const rate = useCallback((message, feedback) => {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, feedback: feedback.rating } : m)));
        onFeedback?.(message, feedback);
    }, [onFeedback]);

    const value = useMemo(() => ({
        variant, title, placeholder, messages, loading, draft, setDraft, starters, state, dispatch, clear, send, stop, narrow, launcher, linkTarget, rate,
    }), [variant, launcher, linkTarget, title, placeholder, messages, loading, draft, starters, state, clear, send, stop, narrow, rate]);

    return (
        <AiChatContext.Provider value={value}>
            <Frame
                panel={<ChatSurface presentation="panel" />}
                panelLabel={panelLabel ?? title}
                panelOpen={state.open && state.mode === 'panel'}
                onPanelOpenChange={(next) => dispatch({ type: next ? 'open' : 'close' })}
                {...frameProps}
            >
                {children}
                <Launcher />
            </Frame>
        </AiChatContext.Provider>
    );
};

AiChat.propTypes = {
    /** `storybook` is the docs' chat, which remembers its mode under its own key; the controls are the same. */
    variant: PropTypes.oneOf(['app', 'storybook']),
    /** The mode a tab with nothing remembered starts in. */
    defaultMode: PropTypes.oneOf(AI_CHAT_MODES),
    /** Whether chat starts open when the tab has nothing remembered. */
    defaultOpen: PropTypes.bool,
    /** The sessionStorage key the mode is kept under (the Storybook variant has its own); null keeps nothing. */
    storageKey: PropTypes.string,
    /** `false` leaves out the floating button: the popup then floats above the bottom right corner, and the host opens chat with `useAiChat().dispatch({ type: 'open' })`. */
    launcher: PropTypes.bool,
    /** Where a reply's source links open, such as `_top` from inside a frame. */
    linkTarget: PropTypes.string,
    /** Called with the new mode whenever chat moves between popup, Panel and full screen. */
    onModeChange: PropTypes.func,
    /** Returns the reply (or a promise of it) to a sent message: a string, or `{ text, sources: [{ title, href, type }] }`. Without it nothing answers. */
    respond: PropTypes.func,
    /** Called with the answer and `{ rating }` (or `{ rating: 'down', comment }`) when a person rates it. Every answer offers thumbs. */
    onFeedback: PropTypes.func,
        /** `{ id, label, text }` prompts offered while the conversation is empty. */
    starters: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        text: PropTypes.string,
    })),
    /** The chat's name: the header title, the button's label and the Panel landmark. */
    title: PropTypes.string,
    /** The prompt input's placeholder: what this chat can be asked about. */
    placeholder: PropTypes.string,
    /** Overrides the Panel landmark's name; defaults to `title`. */
    panelLabel: PropTypes.string,
    /** The Page content. */
    children: PropTypes.node,
};

export default AiChat;
