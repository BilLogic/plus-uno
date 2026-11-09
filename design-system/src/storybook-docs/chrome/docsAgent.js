/**
 * The docs AI agent's answerer: asks the Netlify function (Gemini on Vertex,
 * credentials server-side) and, on an error, a 429 (quota or the per-IP rate
 * limit) or an empty reply, falls back to the docs search and says so. The
 * sources under a model answer come from the search, so they are real pages.
 */

export const AGENT_ENDPOINT = '/.netlify/functions/docs-agent';
const FALLBACK_NOTE = 'AI chat is unavailable right now, so this is a search of the docs instead.';

/**
 * `search(text) => { text, sources }`. The returned `(text, history)` takes the
 * conversation before the question as `[{ role, text }]`.
 */
export const createAgentResponder = ({ fetchFn = (...args) => fetch(...args), search }) => async (text, history = []) => {
    try {
        const res = await fetchFn(AGENT_ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ question: text, history }),
        });
        const data = res.ok ? await res.json() : null;
        if (data?.text) {
            const found = await search(text);
            return { text: data.text, sources: found.sources ?? [] };
        }
    } catch { /* fall through to the search */ }
    const found = await search(text);
    return { ...found, text: `${FALLBACK_NOTE} ${found.text}` };
};
