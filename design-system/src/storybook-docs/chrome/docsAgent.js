/**
 * The docs AI chat's answerer: asks the Netlify function (Gemini on Vertex,
 * credentials server-side) and, on an error, a 429 (quota or the per-IP rate
 * limit) or an empty reply, falls back to the docs search and says so.
 *
 * The model links the pages it names as `[label](page:<title>)`; those become
 * docs addresses here, against the pages Storybook lists, so a link always
 * lands on a real page. When the model asks to open a page (its `open_page`
 * call), or a search answers "take me to …", the chat switches to that page
 * in place. The sources under an answer come from the search, so they are
 * real pages too.
 */

import { findPage, resolvePageLinks } from './docsSearch';
import { goToTarget } from './docsNavigate';

export const AGENT_ENDPOINT = '/.netlify/functions/docs-agent';
const FALLBACK_NOTE = 'AI chat is unavailable right now, so this is a search of the docs instead.';

/**
 * - `search(text) => { text, sources }`, the docs search.
 * - `pages() => entries`, the pages Storybook lists (`buildDocsEntries`).
 * - `href(id, type)`, a page's address.
 * - `navigate(href)`, opens a page in place.
 *
 * The returned `(text, history)` takes the conversation before the question as `[{ role, text }]`.
 */
export const createAgentResponder = ({
    fetchFn = (...args) => fetch(...args),
    search,
    pages = async () => [],
    href = (id) => id,
    navigate = () => false,
}) => async (text, history = []) => {
    const open = (entry) => {
        const address = href(entry.id, entry.type);
        // After the reply is on screen, so the answer is in the conversation when the page changes.
        setTimeout(() => navigate(address), 0);
        return address;
    };

    try {
        const res = await fetchFn(AGENT_ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ question: text, history }),
        });
        const data = res.ok ? await res.json() : null;
        if (data?.text || data?.open) {
            const entries = await pages().catch(() => []);
            const found = await search(text).catch(() => ({ sources: [] }));
            let reply = resolvePageLinks(data.text ?? '', entries, href);
            const target = data.open ? findPage(data.open, entries) : null;
            if (target) {
                const address = open(target);
                if (!reply.trim()) reply = `Opening [${target.name}](${address}).`;
            } else if (data.open && !reply.trim()) {
                reply = `I could not find a page called "${data.open}".`;
            }
            return { text: reply, sources: found.sources ?? [] };
        }
    } catch { /* fall through to the search */ }

    const wanted = goToTarget(text);
    if (wanted) {
        const entries = await pages().catch(() => []);
        const target = findPage(wanted, entries);
        if (target) return { text: `Opening [${target.name}](${open(target)}).`, sources: [] };
    }
    // A search answer is its pages, so they are linked in the text rather than folded away as sources.
    const found = await search(text);
    const links = (found.sources ?? []).map((s) => `- [${s.title}](${s.href})`).join('\n');
    return { text: [`${FALLBACK_NOTE} ${found.text}`, links].filter(Boolean).join('\n\n'), sources: [] };
};
