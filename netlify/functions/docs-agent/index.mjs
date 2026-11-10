// Netlify function: the Storybook docs' AI agent. Gemini on Vertex, service
// account only; the credentials are Netlify environment variables and never
// reach the browser. Grounding files are bundled via netlify.toml included_files.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHandler } from './handler.mjs';
import { callVertex, createTokenSource } from './vertex.mjs';

export const GROUNDING_FILES = [
    'design-system/guidelines/overview.md',
    'design-system/agent-views/components/index.md',
    'design-system/agent-views/tokens/tokens.md',
];

export const loadGrounding = (root = process.env.LAMBDA_TASK_ROOT ?? process.cwd()) => GROUNDING_FILES
    .map((file) => `## ${file}\n\n${readFileSync(resolve(root, file), 'utf8')}`)
    .join('\n\n');

const PAGES_TTL_MS = 10 * 60_000;
let pagesCache = null; // { at, titles }

/** The docs page titles Storybook lists, read from the site's own index.json and kept ten minutes. */
export const createPageTitles = ({ fetch = globalThis.fetch, now = Date.now } = {}) => async (req) => {
    if (pagesCache && now() - pagesCache.at < PAGES_TTL_MS) return pagesCache.titles;
    const url = new URL('/storybook/index.json', req.url);
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return pagesCache?.titles ?? [];
    const index = await res.json();
    const titles = [...new Set(Object.values(index?.entries ?? {}).filter((e) => e?.type === 'docs' && e.title).map((e) => e.title))].sort();
    pagesCache = { at: now(), titles };
    return titles;
};

let handler;
const get = () => {
    handler ??= (() => {
        const env = process.env;
        const getToken = createTokenSource({ env });
        return createHandler({
            getToken,
            callVertex: (args) => callVertex({ env, ...args }),
            grounding: loadGrounding(),
            pageTitles: createPageTitles(),
        });
    })();
    return handler;
};

export default async (req) => {
    try { return await get()(req); } catch (error) {
        console.error('docs-agent:', error?.message);
        return new Response(JSON.stringify({ error: 'agent unavailable' }), { status: 502, headers: { 'content-type': 'application/json' } }); }
};
