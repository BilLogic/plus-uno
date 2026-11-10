/**
 * Moving between docs pages from the AI chat without reloading Storybook, so
 * the conversation stays open. The chat lives in the preview frame; the
 * manager owns the address bar. The preview asks the manager to select a
 * page over Storybook's channel (the event `linkTo` uses), and the manager
 * swaps the story in the same frame. Without a channel (a test, or the page
 * opened on its own), the link is followed as an ordinary link.
 */

/** Storybook's own event for "select this story or docs page", from the preview. */
export const SELECT_STORY = 'selectStory';

/** `{ storyId, viewMode }` for a Storybook address (`?path=/docs/<id>` or `/story/<id>`), else null. */
export const storybookTarget = (href, base = typeof window !== 'undefined' ? window.location.href : 'http://localhost/') => {
    if (!href) return null;
    let url;
    try { url = new URL(href, base); } catch { return null; }
    const path = url.searchParams.get('path') ?? '';
    const match = /^\/(docs|story)\/([^/?#]+)$/.exec(path);
    return match ? { storyId: match[2], viewMode: match[1] } : null;
};

/** The preview's channel to the manager, when there is one. */
const channelOf = (win) => win?.__STORYBOOK_ADDONS_CHANNEL__ ?? null;

/**
 * Opens a Storybook address in place. True when the manager was asked to
 * switch pages; false when `href` is not a Storybook page or there is no
 * channel, so the caller follows the link instead.
 */
export const navigateInPlace = (href, win = typeof window !== 'undefined' ? window : null) => {
    const target = storybookTarget(href, win?.location?.href);
    const channel = channelOf(win);
    if (!target || !channel?.emit) return false;
    channel.emit(SELECT_STORY, target);
    return true;
};

/**
 * A click handler for a container of links: a plain left click on a link to
 * a docs page switches pages in place; a modified click (a new tab) and any
 * other link behave as links.
 */
export const interceptDocsLinks = (navigate = navigateInPlace) => (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || (anchor.target && anchor.target !== '_top' && anchor.target !== '_self')) return;
    if (navigate(anchor.getAttribute('href'))) event.preventDefault();
};

/** Words that ask to be taken to a page rather than told about it. */
const GO_TO = /^\s*(?:please\s+)?(?:can you\s+|could you\s+)?(?:take me to|go to|open|navigate to|bring me to|jump to|show me the)\b\s*(?:the\s+)?(.+?)\s*(?:page|docs)?\s*[?.!]*\s*$/i;

/** The page name a "take me to …" question asks for, else null. */
export const goToTarget = (question) => {
    const match = GO_TO.exec(String(question ?? ''));
    return match ? match[1].replace(/\s+(page|docs)$/i, '').trim() || null : null;
};
