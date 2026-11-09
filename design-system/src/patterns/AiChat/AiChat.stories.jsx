import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Breadcrumb, Button, Modal, Sidebar } from '@/components';
import { AiChat, AI_CHAT_STORAGE_KEY, PANEL_STORAGE_KEY } from '@/patterns';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import DocsAiAgent from '@/storybook-docs/chrome/DocsAiAgent';
import { buildDocsEntries } from '@/storybook-docs/chrome/docsSearch';

/**
 * AI chat — a floating action button at the bottom right of the Page opens
 * chat as a popup; from there it moves to the Panel or to full screen.
 *
 * THE TEST SEAM IS THIS FILE. Each story drives the mode switches a person
 * makes, then reads what is on screen: the button, the popup, the Panel
 * landmark, the full-screen dialog and what the tab remembered.
 */

const HEIGHT = 900;
// Tall enough for the open popup (twice --height-2000) over the button and its pads, so it stays inside its canvas.
const DOCS_HEIGHT = 'calc(var(--height-2000) * 2 + var(--height-300) + var(--page-pad) * 3)';

const STARTERS = [
    { id: 'summarize', label: 'Summarize this page', text: 'Summarize this page for me.' },
    { id: 'next', label: 'What is next?', text: 'What should I do next?' },
];

const BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Dashboard' }];
const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

const respond = async (text) => `You asked: "${text}". Here is what I found on this page.`;

const ChatPage = ({ height = '100vh', withModal = false, ...args }) => {
    const [modal, setModal] = React.useState(false);
    return (
    <div style={{ height }}>
        <AiChat
            header={<Breadcrumb items={BREADCRUMBS} />}
            sidebar={<Sidebar user="tutor" activeTabId="home" account={ACCOUNT} />}
            respond={respond}
            starters={STARTERS}
            {...args}
        >
            {slotContent('Page content')}
            {withModal ? <div><Button text="Page settings" onClick={() => setModal(true)} /></div> : null}
            {withModal ? (
                <Modal
                    show={modal}
                    title="Page settings"
                    primaryButton={{ text: 'Done', onClick: () => setModal(false) }}
                    onClose={() => setModal(false)}
                >
                    Settings
                </Modal>
            ) : null}
        </AiChat>
    </div>
    );
};

export default {
    title: 'AI UI/Patterns for AI/AI chat',
    id: 'ai-ai-chat',
    component: AiChat,
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'fullscreen' },
    // Each story starts with nothing remembered for chat or the Panel.
    beforeEach: () => {
        window.sessionStorage.removeItem(AI_CHAT_STORAGE_KEY);
        window.sessionStorage.removeItem(PANEL_STORAGE_KEY);
    },
    render: (args) => <ChatPage {...args} />,
    argTypes: {
        variant: { control: 'select', options: ['app', 'storybook'], table: { category: 'Design' } },
        defaultMode: { control: 'select', options: ['popup', 'panel', 'fullscreen'], table: { category: 'Design' } },
        withModal: { table: { disable: true } },
        height: { table: { disable: true } },
        defaultOpen: { control: 'boolean', table: { category: 'Design' } },
        title: { control: 'text', table: { category: 'Design' } },
        respond: { table: { disable: true } },
        starters: { table: { disable: true } },
        children: { table: { disable: true } },
        storageKey: { control: false, table: { disable: true } },
        panelLabel: { control: false, table: { disable: true } },
        onModeChange: { control: false, table: { disable: true } },
        onFeedback: { control: false, table: { disable: true } },
    },
};

/* ------------------------------------------------------------- probes */

const parts = (canvasElement) => {
    const body = within(document.body);
    return {
        canvas: within(canvasElement),
        body,
        fab: () => body.queryByRole('button', { name: 'AI chat' }),
        popup: () => document.querySelector('.plus-popup.plus-ai-chat__popup'),
        panel: () => canvasElement.querySelector('.plus-frame__panel'),
        landmark: () => within(canvasElement).queryByRole('complementary', { name: 'AI chat' }),
        fullscreen: () => document.querySelector('.plus-ai-chat__fullscreen'),
        remembered: () => JSON.parse(window.sessionStorage.getItem(AI_CHAT_STORAGE_KEY)),
    };
};

const press = (scope, name) => userEvent.click(scope.getByRole('button', { name }));

/** Overview: chat closed, the button at the bottom right of the Page. */
export const Overview = {};

/** Docs: the popup, open, in an inline frame. Nothing is remembered. */
export const Popup = {
    args: { defaultOpen: true, storageKey: null, height: DOCS_HEIGHT },
    parameters: { layout: 'padded' },
};

/** Docs: chat in the Panel, open. */
export const PanelMode = {
    args: { defaultMode: 'panel', defaultOpen: true, storageKey: null, height: DOCS_HEIGHT },
    parameters: { layout: 'padded' },
};

/** Docs: chat full screen, open. */
export const Fullscreen = {
    args: { defaultMode: 'fullscreen', defaultOpen: true, storageKey: null, height: DOCS_HEIGHT },
};

/** Docs: the Storybook variant: clear, move to Panel and close, with nothing else. */
export const StorybookVariant = {
    args: { variant: 'storybook', defaultOpen: true, storageKey: null, height: DOCS_HEIGHT },
    parameters: { layout: 'padded' },
};

/** Docs: the playground. Chat starts open in the Panel, so every control works inline; nothing is remembered. */
export const Interactive = {
    args: { variant: 'app', defaultMode: 'panel', defaultOpen: true, title: 'AI chat', storageKey: null, height: DOCS_HEIGHT },
    parameters: { layout: 'padded' },
};

/** 1440: the button opens the popup; the popup moves to the Panel, to full screen and back, and closes. */
export const SwitchingModes = {
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await expect(p.fab(), 'the button is the one way in').not.toBeNull();
        await expect(p.popup(), 'closed to start').toBeNull();

        await userEvent.click(p.fab());
        await waitFor(() => expect(p.popup(), 'the button opens the popup').not.toBeNull());
        await expect(p.fab(), 'the button stays while the popup is open').not.toBeNull();
        await expect(p.panel()).toBeNull();

        await press(within(p.popup()), 'Move to Panel');
        await waitFor(() => expect(p.landmark(), 'the Panel opens').not.toBeNull());
        await expect(p.popup(), 'the popup is gone').toBeNull();
        await expect(p.fab(), 'the button hides while chat is in the Panel').toBeNull();
        await expect(p.remembered()).toEqual({ mode: 'panel', open: true });

        await press(within(p.panel()), 'Full screen');
        await waitFor(() => expect(p.fullscreen(), 'full screen opens').not.toBeNull());
        await expect(p.panel(), 'the Panel closes').toBeNull();
        await expect(p.fab(), 'the button hides in full screen').toBeNull();

        await press(within(p.fullscreen()), 'Exit full screen');
        await waitFor(() => expect(p.landmark(), 'back in the Panel').not.toBeNull());
        await expect(p.fullscreen()).toBeNull();

        await press(within(p.panel()), 'Move to popup');
        await waitFor(() => expect(p.popup(), 'back in the popup').not.toBeNull());
        await expect(p.panel()).toBeNull();
        await expect(p.fab(), 'the button is back').not.toBeNull();

        await press(within(p.popup()), 'Close chat');
        await waitFor(() => expect(p.popup(), 'Close closes it').toBeNull());
        await expect(p.fab(), 'the button stays').not.toBeNull();
        await expect(p.remembered(), 'a popup is never remembered open').toEqual({ mode: 'popup', open: false });
    }),
};

/** The conversation moves with the mode, and Clear chat empties it. */
export const ConversationFollowsTheMode = {
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.fab());
        await waitFor(() => expect(p.popup()).not.toBeNull());
        const input = within(p.popup()).getByRole('textbox', { name: 'Message to AI chat' });
        await userEvent.type(input, 'Hello there{Enter}');
        await waitFor(() => expect(within(p.popup()).getByText(/You asked: "Hello there"/)).toBeInTheDocument());

        await press(within(p.popup()), 'Move to Panel');
        await waitFor(() => expect(p.panel()).not.toBeNull());
        await expect(within(p.panel()).getByText('Hello there'), 'the message came along').toBeInTheDocument();

        await press(within(p.panel()), 'Clear chat');
        await waitFor(() => expect(within(p.panel()).queryByText('Hello there')).toBeNull());
        await expect(within(p.panel()).getByRole('button', { name: 'Clear chat' }), 'nothing left to clear').toBeDisabled();
    }),
};

/** A tab that remembered the Panel opens in it: the mode survives a reload. */
export const RemembersThePanel = {
    beforeEach: () => {
        window.sessionStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify({ mode: 'panel', open: true }));
    },
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await waitFor(() => expect(p.landmark(), 'opens in the remembered Panel').not.toBeNull());
        await expect(p.fab(), 'the button stays hidden').toBeNull();
        await press(within(p.panel()), 'Close chat');
        await waitFor(() => expect(p.panel()).toBeNull());
        await expect(p.fab(), 'closed, the button returns').not.toBeNull();
        await userEvent.click(p.fab());
        await waitFor(() => expect(p.landmark(), 'the button reopens in the remembered mode').not.toBeNull());
        await expect(p.popup(), 'not as a popup').toBeNull();
    }),
};

/** A remembered full screen mode comes back closed; the button opens it. */
export const RemembersFullscreenClosed = {
    beforeEach: () => {
        window.sessionStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify({ mode: 'fullscreen', open: true }));
    },
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await expect(p.fullscreen(), 'full screen is never remembered open').toBeNull();
        await userEvent.click(p.fab());
        await waitFor(() => expect(p.fullscreen(), 'the button opens it in the remembered mode').not.toBeNull());
    }),
};

/** Under 768 the popup is shown full screen, and needs no full screen control. */
export const PopupIsFullScreenUnder768 = {
    play: async ({ canvasElement }) => withTestViewport(767, HEIGHT, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.fab());
        await waitFor(() => expect(p.fullscreen(), 'the popup is full screen').not.toBeNull());
        await expect(p.popup()).toBeNull();
        const win = p.fullscreen().getBoundingClientRect();
        await expect(win.width).toBeCloseTo(window.innerWidth, 0);
        await expect(win.height).toBeCloseTo(window.innerHeight, 0);
        await expect(within(p.fullscreen()).queryByRole('button', { name: /full screen/i })).toBeNull();
        await press(within(p.fullscreen()), 'Close chat');
        await waitFor(() => expect(p.fullscreen(), 'Close closes it').toBeNull());
    }),
};

/** At 768 and up the popup stays a popup. */
export const PopupStaysAPopupAt768 = {
    play: async ({ canvasElement }) => withTestViewport(768, HEIGHT, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.fab());
        await waitFor(() => expect(p.popup()).not.toBeNull());
        await expect(p.fullscreen()).toBeNull();
    }),
};

/** The Storybook variant carries clear, move to Panel and close only. */
export const StorybookVariantControls = {
    args: { variant: 'storybook', defaultOpen: true },
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await waitFor(() => expect(p.popup()).not.toBeNull());
        const names = within(p.popup()).getAllByRole('button').map((b) => b.getAttribute('aria-label'))
            .filter((n) => ['Clear chat', 'Move to Panel', 'Move to popup', 'Full screen', 'More actions', 'Close chat'].includes(n));
        await expect(names).toEqual(['Clear chat', 'Move to Panel', 'Close chat']);
    }),
};

/** The app variant carries every header control. */
export const AppVariantControls = {
    args: { defaultOpen: true },
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await waitFor(() => expect(p.popup()).not.toBeNull());
        const names = within(p.popup()).getAllByRole('button').map((b) => b.getAttribute('aria-label'))
            .filter((n) => ['Clear chat', 'Move to Panel', 'Full screen', 'More actions', 'Close chat'].includes(n));
        await expect(names).toEqual(['Clear chat', 'Move to Panel', 'Full screen', 'More actions', 'Close chat']);
    }),
};

/** A Modal raised from the Page leaves the open popup where it is, and a press inside the Modal does not close it. */
export const ModalLeavesThePopupOpen = {
    args: { withModal: true, defaultOpen: true },
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await waitFor(() => expect(p.popup()).not.toBeNull());
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Page settings' }));
        const dialog = await within(document.body).findByRole('dialog', { name: 'Page settings' });
        await expect(p.popup(), 'the popup stays under the Modal').not.toBeNull();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
        await waitFor(() => expect(within(document.body).queryByRole('dialog', { name: 'Page settings' })).toBeNull());
        await expect(p.popup(), 'still open after the Modal').not.toBeNull();
    }),
};

/**
 * The trust marks: every answer carries the AI icon (once, from AiMessage),
 * and the fallibility line sits once under the prompt input, not per message.
 */
export const TrustMarks = {
    parameters: { docs: { height: DOCS_HEIGHT } },
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.fab());
        await waitFor(() => expect(p.popup()).not.toBeNull());
        const popup = within(p.popup());
        const line = popup.getByText('AI can make mistakes. Check important info.');
        const input = popup.getByRole('textbox', { name: 'Message to AI chat' });
        await expect(
            input.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING,
            'the line sits under the prompt input',
        ).toBeTruthy();
        await userEvent.type(input, 'Hello there{Enter}');
        await waitFor(() => expect(popup.getByText(/You asked: "Hello there"/)).toBeInTheDocument());
        const reply = popup.getByText(/You asked: "Hello there"/).closest('.plus-ai-chat__message');
        await expect(within(reply).getAllByRole('img', { name: 'AI' }), 'one AI icon per answer').toHaveLength(1);
        await expect(popup.getAllByText('AI can make mistakes. Check important info.'), 'said once').toHaveLength(1);
        const rating = within(reply).getByRole('group', { name: 'Rate this answer' });
        await userEvent.click(within(rating).getByRole('button', { name: 'Good answer' }));
        await expect(within(rating).getByRole('button', { name: 'Good answer' })).toHaveAttribute('aria-pressed', 'true');
        await expect(within(reply).getByRole('status')).toHaveTextContent('Thanks. Marked as a good answer.');
    }),
};

const SOURCES = [
    { title: 'Session notes, Oct 24', href: '#session-1024', type: 'Session' },
    { title: 'Ava Thompson', href: '#student-ava', type: 'Student' },
    { title: 'Attendance report', href: '#report-attendance', type: 'Report' },
    { title: 'Grade 7 · Math', href: '#class-g7', type: 'Class' },
];

/** A reply that drew on records lists them under the message. */
export const RepliesWithSources = {
    args: { respond: async (text) => ({ text: `About "${text}": Ava attended 12 of 14 sessions.`, sources: SOURCES }) },
    parameters: { docs: { height: DOCS_HEIGHT } },
    play: async ({ canvasElement }) => withTestViewport(1440, HEIGHT, async () => {
        const p = parts(canvasElement);
        await userEvent.click(p.fab());
        await waitFor(() => expect(p.popup()).not.toBeNull());
        const popup = within(p.popup());
        await userEvent.type(popup.getByRole('textbox', { name: 'Message to AI chat' }), 'Ava{Enter}');
        const list = await popup.findByRole('list', { name: 'Sources' });
        await expect(within(list).getAllByRole('link')).toHaveLength(3);
        await userEvent.click(popup.getByRole('button', { name: 'Show 1 more source' }));
        await expect(within(list).getAllByRole('link')).toHaveLength(4);
    }),
};

/* ------------------------------------------- the Storybook docs' agent */

const DOCS_ENTRIES = buildDocsEntries({
    entries: {
        'components-forms-and-inputs-button-button--docs': { id: 'components-forms-and-inputs-button-button--docs', title: 'Forms and inputs/Button', type: 'docs' },
        'modal--docs': { id: 'modal--docs', title: 'Overlays/Modal', type: 'docs' },
    },
}, ['Button', 'Modal']);

/** The docs-agent function, faked: an answer, or the status a failure answers with. */
const fakeAgent = (status = 200) => async (url, init) => ({
    ok: status < 400,
    status,
    json: async () => (status < 400 ? { text: `Button is in the context. (${JSON.parse(init.body).question})` } : {}),
});

const docsHrefFor = (id) => `/?path=/docs/${id}`;
const DOCS_STORAGE_KEY = `${AI_CHAT_STORAGE_KEY}-storybook`;
const DOCS_PANEL_KEY = 'plus-frame-panel-storybook';

/**
 * The docs' floating button with the AI agent it opens, answered by the
 * docs-agent function (faked here), with the search's pages as the answer's sources.
 * Open from the button, ask, follow the link, clear, move to the Panel and
 * back, close.
 */
export const DocsAgent = {
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    beforeEach: () => {
        window.sessionStorage.removeItem(DOCS_STORAGE_KEY);
        window.sessionStorage.removeItem(DOCS_PANEL_KEY);
    },
    render: () => <DocsAiAgent loadEntries={async () => DOCS_ENTRIES} hrefFor={docsHrefFor} fetchFn={fakeAgent()} />,
    play: async () => withTestViewport(1440, HEIGHT, async () => {
        const body = within(document.body);
        const root = () => document.querySelector('.plus-docs-ai');
        const popup = () => root().querySelector('.plus-ai-chat__floating');
        const panel = () => root().querySelector('.plus-frame__panel');

        await waitFor(() => expect(root()).not.toBeNull());
        // The layer covers the whole window over the docs, so every box in it
        // other than the button and the chat must paint nothing.
        const painted = [root(), ...root().querySelectorAll('.plus-frame, .plus-frame__row, .plus-frame__surface, .plus-frame__content')]
            .filter((el) => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)')
            .map((el) => el.className);
        await expect(painted, 'the docs show through the AI agent layer').toEqual([]);
        await userEvent.click(await within(root()).findByRole('button', { name: 'Prototype links' }));
        await userEvent.click(await body.findByRole('menuitem', { name: 'AI agent' }));
        await waitFor(() => expect(popup(), 'the AI agent opens the popup').not.toBeNull());

        const input = within(popup()).getByRole('textbox', { name: 'Message to AI agent' });
        await expect(input, 'focus lands in the input').toHaveFocus();
        await userEvent.type(input, 'Where is Button?{Enter}');
        const link = await within(popup()).findByRole('link', { name: 'Button' });
        await within(popup()).findByText(/Button is in the context/);
        await expect(link, 'the answer links the docs page').toHaveAttribute('href', '/?path=/docs/components-forms-and-inputs-button-button--docs');

        const names = within(popup()).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
        await expect(names, 'no full screen, no more menu').toEqual(expect.arrayContaining(['Clear chat', 'Move to Panel', 'Close chat']));
        await expect(names).not.toContain('Full screen');

        await press(within(popup()), 'Clear chat');
        await waitFor(() => expect(within(popup()).queryByRole('link', { name: 'Button' })).toBeNull());

        await press(within(popup()), 'Move to Panel');
        await waitFor(() => expect(panel(), 'the Panel opens').not.toBeNull());
        await expect(Math.round(panel().getBoundingClientRect().right), 'at the right edge').toBe(window.innerWidth);
        await expect(popup(), 'the popup is gone').toBeNull();
        await expect(JSON.parse(window.sessionStorage.getItem(DOCS_STORAGE_KEY))).toEqual({ mode: 'panel', open: true });

        await press(within(panel()), 'Move to popup');
        await waitFor(() => expect(popup(), 'back in the popup').not.toBeNull());

        await press(within(popup()), 'Close chat');
        await waitFor(() => expect(popup(), 'Close closes it').toBeNull());
    }),
};

/** A 429 from the function (Vertex quota or the rate limit): the chat searches the docs and says so. */
export const DocsAgentFallback = {
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
    beforeEach: () => {
        window.sessionStorage.removeItem(DOCS_STORAGE_KEY);
        window.sessionStorage.removeItem(DOCS_PANEL_KEY);
    },
    render: () => <DocsAiAgent loadEntries={async () => DOCS_ENTRIES} hrefFor={docsHrefFor} fetchFn={fakeAgent(429)} />,
    play: async () => withTestViewport(1440, HEIGHT, async () => {
        const body = within(document.body);
        const root = () => document.querySelector('.plus-docs-ai');
        const popup = () => root().querySelector('.plus-ai-chat__floating');
        await userEvent.click(await within(root()).findByRole('button', { name: 'Prototype links' }));
        await userEvent.click(await body.findByRole('menuitem', { name: 'AI agent' }));
        await waitFor(() => expect(popup()).not.toBeNull());
        await userEvent.type(within(popup()).getByRole('textbox', { name: 'Message to AI agent' }), 'Where is Button?{Enter}');
        await within(popup()).findByText(/unavailable right now, so this is a search/);
        await expect(await within(popup()).findByRole('link', { name: 'Button' })).toHaveAttribute('href', '/?path=/docs/components-forms-and-inputs-button-button--docs');
    }),
};
