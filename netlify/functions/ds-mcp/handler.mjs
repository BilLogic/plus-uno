// The hosted design-system MCP: a request handler over the same server the
// local `plus-ds` runs (scripts/lib/ds-mcp-server.mjs), on the SDK's
// fetch-style Streamable HTTP transport. Stateless: each request gets its own
// server and transport, nothing is kept between requests but the facts, which
// the caller loads once. Collaborators are injected so the tests run with no
// network and no deploy.

import { createHash, timingSafeEqual } from 'node:crypto';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

const json = (status, body, headers = {}) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

/** The key a request carries: `Authorization: Bearer <key>` or `x-ds-mcp-key`. */
export const keyOf = (req) => {
    const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') ?? '');
    return bearer ? bearer[1].trim() : (req.headers.get('x-ds-mcp-key') ?? '').trim();
};

/** Equal keys, compared in constant time: both are hashed to one length first. */
export const sameKey = (given, expected) => {
    const a = createHash('sha256').update(given).digest();
    const b = createHash('sha256').update(expected).digest();
    return timingSafeEqual(a, b);
};

/**
 * @param {{key?: string, createServer: () => import('@modelcontextprotocol/sdk/server/index.js').Server}} deps
 *   key: the shared key. Unset or empty refuses every request.
 */
export function createHandler({ key, createServer }) {
    return async (req) => {
        // Auth first, before the method or the body: an unauthenticated caller learns nothing else.
        if (!key || !sameKey(keyOf(req), key)) {
            return json(401, { error: 'unauthorized' }, { 'www-authenticate': 'Bearer' });
        }
        const server = createServer();
        const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
        try {
            await server.connect(transport);
            return await transport.handleRequest(req);
        } finally {
            await server.close().catch(() => {});
        }
    };
}
