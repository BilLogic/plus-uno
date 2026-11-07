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

let handler;
const get = () => {
    handler ??= (() => {
        const env = process.env;
        const getToken = createTokenSource({ env });
        return createHandler({
            getToken,
            callVertex: (args) => callVertex({ env, ...args }),
            grounding: loadGrounding(),
        });
    })();
    return handler;
};

export default async (req) => {
    try { return await get()(req); } catch (error) {
        console.error('docs-agent:', error?.message);
        return new Response(JSON.stringify({ error: 'agent unavailable' }), { status: 502, headers: { 'content-type': 'application/json' } }); }
};
