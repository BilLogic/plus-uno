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

/** The largest request body served: a tool call is a few lines, so this is generous. */
export const MAX_BODY_BYTES = 256 * 1024;

/** The request body as text, or null when it is over `MAX_BODY_BYTES` (read as it arrives, not trusted from the header). */
async function readCapped(req) {
    if (Number(req.headers.get('content-length')) > MAX_BODY_BYTES) return null;
    if (!req.body) return '';
    const chunks = [];
    let size = 0;
    for await (const chunk of req.body) {
        size += chunk.byteLength;
        if (size > MAX_BODY_BYTES) return null;
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

/**
 * @param {{getKey: () => string | undefined, createServer: () => import('@modelcontextprotocol/sdk/server/index.js').Server}} deps
 *   getKey: the shared key, read on every request so a rotated key works at once. Unset or empty refuses every request.
 */
export function createHandler({ getKey, createServer }) {
    return async (req) => {
        // Auth first, before the method or the body: an unauthenticated caller learns nothing else.
        const key = getKey();
        if (!key || !sameKey(keyOf(req), key)) {
            return json(401, { error: 'unauthorized' }, { 'www-authenticate': 'Bearer' });
        }
        let parsedBody;
        if (req.method === 'POST') {
            const text = await readCapped(req);
            if (text === null) return json(413, { error: 'request too large' });
            try { parsedBody = JSON.parse(text); } catch {
                return json(400, { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null });
            }
        }
        const server = createServer();
        const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
        try {
            await server.connect(transport);
            return await transport.handleRequest(req, { parsedBody });
        } finally {
            await server.close().catch(() => {});
        }
    };
}
