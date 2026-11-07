// POST { question, history } -> { text }. Collaborators are injected, so the
// handler is tested without a network: the token source and the Vertex call.

const MAX_QUESTION = 2000;
const MAX_TURN_CHARS = 1000;
const MAX_TURNS = 6;
const MAX_OUTPUT_TOKENS = 700;
const DEFAULT_LIMIT = { max: 20, windowMs: 60_000 };

export const buildSystemPrompt = (grounding) => [
    'You are the PLUS design system docs assistant, answering inside the Storybook docs.',
    'Answer only from the context below. If the context does not cover the question, say so plainly and do not guess.',
    'Name real components, props and tokens exactly as the context spells them; never invent one.',
    'Say which Storybook page the answer comes from, by its title (for example "Forms and inputs/Button").',
    'Keep answers short and plain, in American English.',
    '',
    '--- CONTEXT ---',
    grounding,
].join('\n');

/** The last few valid turns, as Vertex `contents`, each bounded. */
export const trimHistory = (history) => {
    const turns = Array.isArray(history) ? history : [];
    return turns
        .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string' && t.text.trim())
        .slice(-MAX_TURNS)
        .map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text.slice(0, MAX_TURN_CHARS) }] }));
};

const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const clientIp = (req) => (req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();

export const createHandler = ({ getToken, callVertex, grounding, now = Date.now, rateLimit = DEFAULT_LIMIT }) => {
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
        if (!question || question.length > MAX_QUESTION) return reply(400, { error: 'question must be 1 to 2000 characters' });
        if (limited(clientIp(req))) return reply(429, { error: 'rate limited' });

        let token;
        try { token = await getToken(); } catch { return reply(502, { error: 'agent unavailable' }); }
        const result = await callVertex({
            token,
            system: buildSystemPrompt(grounding),
            contents: [...trimHistory(body.history), { role: 'user', parts: [{ text: question }] }],
            maxOutputTokens: MAX_OUTPUT_TOKENS,
        });
        if (result.ok && result.text) return reply(200, { text: result.text });
        return result.status === 429 ? reply(429, { error: 'quota' }) : reply(502, { error: 'agent unavailable' });
    };
};
