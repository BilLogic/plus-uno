/**
 * The two adapters of the design-system lookup, each spawned as its user
 * starts it: the `ds` command from a shell, and the MCP server over stdio
 * through the SDK's own client. What they answer is `lib/ds-lookup.test.mjs`'s
 * subject; these hold the wiring.
 *
 * Run: npm run test:scripts
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { servedTools } from './ds-mcp.mjs';
import { REPO_ROOT } from './lib/corpus.mjs';

test('the ds command answers find with PatternCard and its import', () => {
  const out = execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts/ds.mjs'), 'find', 'card'], { encoding: 'utf8' });
  assert.match(out, /import \{ PatternCard \} from '@\/patterns';/);
  const json = JSON.parse(execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts/ds.mjs'), 'find', 'card', '--json'], { encoding: 'utf8' }));
  assert.equal(json.results[0].name, 'Card');
});

test('the MCP server lists exactly the five tools, in order, and answers ds_find', async () => {
  const client = new Client({ name: 'ds-test', version: '0.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(REPO_ROOT, 'scripts/ds-mcp.mjs')], cwd: REPO_ROOT, stderr: 'pipe' }));
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name), ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check']);
    assert.match(client.getInstructions(), /start.*ds_find.*ds_check/is);
    const result = await client.callTool({ name: 'ds_find', arguments: { query: 'card' } });
    assert.match(result.content[0].text, /PatternCard/);
  } finally {
    await client.close();
  }
});

test('the MCP server serves only the tools --tools names, and refuses an unknown one', async () => {
  const client = new Client({ name: 'ds-test', version: '0.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(REPO_ROOT, 'scripts/ds-mcp.mjs'), '--tools', 'find,get'], cwd: REPO_ROOT, stderr: 'pipe' }));
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name), ['ds_find', 'ds_get']);
    assert.match(client.getInstructions(), /npm run ds -- check/);
    const refused = await client.callTool({ name: 'ds_check', arguments: { code: '<div />' } });
    assert.equal(refused.isError, true);
  } finally {
    await client.close();
  }
  assert.deepEqual(servedTools([]).map((t) => t.name), ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check']);
  assert.throws(() => servedTools(['--tools', 'find,lint']), /unknown lint/);
});
