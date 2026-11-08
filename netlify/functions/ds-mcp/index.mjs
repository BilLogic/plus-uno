// Netlify function: the hosted, read-only design-system MCP. The same five
// tools as the local plus-ds server, over Streamable HTTP, behind a shared key
// (DS_MCP_KEY, a Netlify environment variable, read on every request). The
// facts are the repo files bundled through netlify.toml included_files, so
// they are the same build the Storybook in that deploy is made from. Served at
// /mcp/ds by a redirect there.

import { createLookup } from '../../../scripts/lib/ds-lookup.mjs';
import { createServer } from '../../../scripts/lib/ds-mcp-server.mjs';
import { createHandler } from './handler.mjs';

const root = () => process.env.LAMBDA_TASK_ROOT ?? process.cwd();

let lookup;
const sharedLookup = () => (lookup ??= createLookup(root(), { readPaths: false }));

const handler = createHandler({
    getKey: () => process.env.DS_MCP_KEY,
    createServer: () => createServer(root(), { hosted: true, lookup: sharedLookup }),
});

export default async (req) => {
    try { return await handler(req); } catch (error) {
        console.error('ds-mcp:', error?.message);
        return new Response(JSON.stringify({ error: 'ds-mcp unavailable' }), { status: 502, headers: { 'content-type': 'application/json' } });
    }
};
