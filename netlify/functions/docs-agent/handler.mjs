// POST { question, history } -> { text, open? }, `open` being a page title the model asked to open. Collaborators are injected, so the
// handler is tested without a network: the token source and the Vertex call.

const MAX_QUESTION = 2000;
const MAX_TURN_CHARS = 1000;
const MAX_TURNS = 6;
// Thinking tokens count against the cap, so it leaves room for a short answer after low thinking.
const MAX_OUTPUT_TOKENS = 1500;
const DEFAULT_LIMIT = { max: 20, windowMs: 60_000 };

export const buildSystemPrompt = (grounding, pageTitles = []) => [
    'You are the PLUS design system docs assistant, inside the Storybook docs. Designers and engineers ask you where things are and how to use them.',
    'Answer only from the context below. If the context does not cover the question, say so plainly and do not guess.',
    'Name real components, props and tokens exactly as the context spells them; never invent one.',
    'Lead with the answer in a sentence or two. Use a short list only for steps or options. Add a code sample only when asked how to write the code.',
    'Write Markdown. Link every Storybook page you name, inline, as [Button](page:Components/Forms and inputs/Button/Button): `page:` then the page title from the PAGES list.',
    'Never cite files, paths or "Source:" lines; the chat lists its sources itself.',
    'When the person asks to go to, open or be taken to a page, call open_page with that page title, and say in one short sentence what is there.',
    'Keep answers short and plain, in American English.',
    '',
    ...(pageTitles.length ? ['--- PAGES ---', ...pageTitles, ''] : []),
    '--- CONTEXT ---',
    grounding,
].join('\n');

/** The one tool: opening a docs page in place, by its title. */
export const OPEN_PAGE_TOOL = {
    functionDeclarations: [{
        name: 'open_page',
        description: 'Open a Storybook docs page for the person, in place. Use when they ask to go to, open or be taken to a page.',
        parameters: {
            type: 'OBJECT',
            properties: { title: { type: 'STRING', description: 'The page title, from the PAGES list.' } },
            required: ['title'],
        },
    }],
};

/** The last few valid turns, as Vertex `contents`, each bounded. */
export const trimHistory = (history) => {
    const turns = Array.isArray(history) ? history : [];
    return turns
        .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string' && t.text.trim())
        .slice(-MAX_TURNS)
        .map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text.slice(0, MAX_TURN_CHARS) }] }));
};

const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const clientIp = (req) => req.headers.get('x-nf-client-connection-ip') ?? 'unknown';

export const createHandler = ({
    getToken, callVertex, grounding, pageTitles = async () => [], now = Date.now, rateLimit = DEFAULT_LIMIT,
}) => {
    const hits = new Map(); // ip -> timestamps in the window (per warm instance)
    const limited = (ip) => {
        const t = now();
        const recent = (hits.get(ip) ?? []).filter((at) => t - at < rateLimit.windowMs);
        if (recent.length >= rateLimit.max) { hits.set(ip, recent); return true; }
        recent.push(t);
        hits.set(ip, recent);
        if (hits.size > 500) for (const [key, list] of hits) if (list.every((at) => t - at >= rateLimit.windowMs)) hits.delete(key);
        return false;
    };

    return async (req) => {
        if (req.method !== 'POST') return reply(405, { error: 'method not allowed' });
        let body;
        try { body = await req.json(); } catch { return reply(400, { error: 'invalid JSON' }); }
        const question = typeof body?.question === 'string' ? body.question.trim() : '';
        if (!question || question.length > MAX_QUESTION) return reply(400, { error: `question must be 1 to ${MAX_QUESTION} characters` });
        if (limited(clientIp(req))) return reply(429, { error: 'rate limited' });

        let token;
        try { token = await getToken(); } catch (error) { console.error('docs-agent token:', error?.message); return reply(502, { error: 'agent unavailable' }); }
        const titles = await pageTitles(req).catch(() => []);
        const result = await callVertex({
            token,
            system: buildSystemPrompt(grounding, titles),
            contents: [...trimHistory(body.history), { role: 'user', parts: [{ text: question }] }],
            tools: [OPEN_PAGE_TOOL],
            maxOutputTokens: MAX_OUTPUT_TOKENS,
        });
        const open = result.calls?.find((c) => c.name === 'open_page' && typeof c.args?.title === 'string')?.args.title;
        if (result.ok && (result.text || open)) return reply(200, open ? { text: result.text ?? '', open } : { text: result.text });
        console.error('docs-agent vertex:', result.status ?? '', result.error ?? 'empty reply');
        return result.status === 429 ? reply(429, { error: 'quota' }) : reply(502, { error: 'agent unavailable' });
    };
};
