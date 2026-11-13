#!/usr/bin/env node
// `ds`: the design-system lookup over the snapshot baked into dist/ at build time.
import { fileURLToPath } from 'node:url';

import { cli } from '../dist/scripts/ds.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const argv = process.argv.slice(2);

if (argv[0] === 'mcp') {
  // The stdio MCP server over the baked snapshot. `hosted` leaves `ds_check` code-only: the snapshot is not the caller's tree.
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const { createServer } = await import('../dist/scripts/lib/ds-mcp-server.mjs');
  await createServer(root, { hosted: true }).connect(new StdioServerTransport());
} else if (argv[0] === 'check' || argv[0] === 'add') {
  // The facts come from the baked snapshot; the files come from the caller's working directory, so it runs in their CI; `add` writes the registry items there.
  process.exitCode = cli(argv, root, { consumerRoot: process.cwd() });
} else {
  process.exitCode = cli(argv, root);
}
