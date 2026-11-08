#!/usr/bin/env node
/**
 * The local design-system MCP server, over stdio: the five lookup tools,
 * registered in `.mcp.json` as `plus-ds` so Claude Code and Cursor start it
 * on demand from the checkout. The tools and the server are
 * `scripts/lib/ds-mcp-server.mjs`, which the hosted function mounts too; this
 * file only connects them to stdio. `docs/connectors/ds-mcp.md` is the
 * reader's account.
 *
 *   node scripts/ds-mcp.mjs
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { REPO_ROOT } from './lib/corpus.mjs';
import { createServer } from './lib/ds-mcp-server.mjs';
import { isEntry } from './lib/findings.mjs';

export { INSTRUCTIONS, TOOLS, createServer } from './lib/ds-mcp-server.mjs';

if (isEntry(import.meta.url)) await createServer(REPO_ROOT).connect(new StdioServerTransport());
