import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from '../../../scripts/lib/corpus.mjs';
import { createLookup } from '../../../scripts/lib/ds-lookup.mjs';
import { HOSTED_PATHS_REFUSAL, createServer } from '../../../scripts/lib/ds-mcp-server.mjs';
import { createHandler } from './handler.mjs';

const KEY = 'test-key-123';
const URL_ = 'https://x.test/mcp/ds';
const lookup = createLookup(REPO_ROOT);
const make = (...args) => createHandler({ key: args.length ? args[0] : KEY, createServer: () => createServer(REPO_ROOT, { hosted: true, lookup }) });

const rpc = (method, params, headers = { authorization: `Bearer ${KEY}` }, id = 1) =>
  new Request(URL_, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
const result = async (res) => {
  assert.equal(res.status, 200);
  return (await res.json()).result;
};

test('a request with no key, a wrong key or a key of another length is refused 401', async () => {
  const handler = make();
  for (const headers of [{}, { authorization: 'Bearer nope' }, { authorization: `Bearer ${KEY}x` }, { 'x-ds-mcp-key': 'nope' }, { authorization: KEY }]) {
    const res = await handler(rpc('tools/list', {}, headers));
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('www-authenticate'), 'Bearer');
  }
});

test('with the key variable unset or empty every request is refused, even one with no key', async () => {
  for (const key of [undefined, '']) {
    const handler = make(key);
    assert.equal((await handler(rpc('tools/list', {}, {}))).status, 401);
    assert.equal((await handler(rpc('tools/list', {}, { authorization: 'Bearer ' }))).status, 401);
    assert.equal((await handler(rpc('tools/list', {}, { 'x-ds-mcp-key': '' }))).status, 401);
    assert.equal((await handler(rpc('tools/list', {}, { authorization: `Bearer ${KEY}` }))).status, 401);
  }
});

test('the key is accepted as a bearer token or as x-ds-mcp-key', async () => {
  const handler = make();
  assert.equal((await handler(rpc('tools/list', {}, { authorization: `Bearer ${KEY}` }))).status, 200);
  assert.equal((await handler(rpc('tools/list', {}, { 'x-ds-mcp-key': KEY }))).status, 200);
});

test('tools/list returns the five tools in order, and ds_check does not offer paths', async () => {
  const { tools } = await result(await make()(rpc('tools/list', {})));
  assert.deepEqual(tools.map((t) => t.name), ['ds_find', 'ds_get', 'ds_tokens', 'ds_guide', 'ds_check']);
  const check = tools.find((t) => t.name === 'ds_check');
  assert.deepEqual(Object.keys(check.inputSchema.properties), ['code', 'path']);
  assert.match(check.description, /code only/i);
});

test('initialize carries the same instructions as the local server', async () => {
  const init = await result(await make()(rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '0' } })));
  assert.equal(init.serverInfo.name, 'plus-ds');
  assert.match(init.instructions, /ds_find.*ds_check/s);
});

test('tools/call ds_find card answers with PatternCard', async () => {
  const out = await result(await make()(rpc('tools/call', { name: 'ds_find', arguments: { query: 'card' } })));
  assert.match(out.content[0].text, /PatternCard/);
});

test('ds_check with code runs the checker in memory', async () => {
  const out = await result(await make()(rpc('tools/call', { name: 'ds_check', arguments: { code: "import { Nope } from '@/components';\n<Nope />", path: 'prototypes/x.jsx' } })));
  assert.notEqual(out.isError, true);
  assert.match(out.content[0].text, /ds\//);
});

test('ds_check with paths is refused, and says why', async () => {
  const out = await result(await make()(rpc('tools/call', { name: 'ds_check', arguments: { paths: ['package.json'] } })));
  assert.equal(out.isError, true);
  assert.equal(out.content[0].text, HOSTED_PATHS_REFUSAL);
  assert.match(out.content[0].text, /code only/i);
});

test('stateless: no session id is issued and a second request needs no session', async () => {
  const handler = make();
  const first = await handler(rpc('tools/list', {}));
  assert.equal(first.headers.get('mcp-session-id'), null);
  assert.equal((await handler(rpc('tools/list', {}, undefined, 2))).status, 200);
});

// ── the bundle ────────────────────────────────────────────────────────────

/** The included_files of the function, read from netlify.toml. */
function includedFiles(name = 'ds-mcp') {
  const toml = fs.readFileSync(path.join(REPO_ROOT, 'netlify.toml'), 'utf8');
  const block = toml.split(/^\[functions\."/m).find((b) => b.startsWith(`${name}"]`));
  assert.ok(block, `netlify.toml has no [functions."${name}"]`);
  const list = /included_files\s*=\s*\[([^\]]*)\]/.exec(block)?.[1] ?? '';
  return [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

test('included_files in netlify.toml covers every file the five tools open', () => {
  const globs = includedFiles();
  const bundled = new Set(globs.flatMap((g) => fs.globSync(g, { cwd: REPO_ROOT })).map((f) => f.split(path.sep).join('/')));
  assert.ok(bundled.size > 100, 'the bundle globs match almost nothing');

  // Trace every file read while all five tools are used widely: every guideline topic and rule, every component and token role.
  const read = new Set();
  const real = { readFileSync: fs.readFileSync, readdirSync: fs.readdirSync };
  fs.readFileSync = (file, ...rest) => {
    if (typeof file === 'string' && path.isAbsolute(file) && file.startsWith(REPO_ROOT)) read.add(path.relative(REPO_ROOT, file).split(path.sep).join('/'));
    return real.readFileSync(file, ...rest);
  };
  try {
    // A fresh root-keyed lookup, so the traced reads are the cold ones; contextOf is keyed by root and may be warm, so name a copy of the root's string.
    const traced = createLookup(`${REPO_ROOT}${path.sep}.`.replace(/\.$/, ''));
    const guide = traced.guide();
    assert.ok(guide.text);
    const list = traced.guide('no-such-topic');
    for (const topic of list.topics) traced.guide(topic);
    for (const rule of list.rules) traced.guide(rule);
    const found = traced.find('a table of students');
    const names = traced.find('card').results.map((r) => r.name);
    traced.get([...new Set([...found.results.map((r) => r.name), ...names, 'Button', 'PatternCard', 'PatternTable', 'Button.appearance', '--ds-text'])]);
    for (const role of traced.tokens('nothing').roles) traced.tokens(role);
    traced.check({ code: "import { Button } from '@/components';\nexport default () => <Button appearance=\"x\" />;", path: 'prototypes/a.jsx' });
  } finally {
    Object.assign(fs, real);
  }

  assert.ok(read.size > 100, 'the trace caught almost no reads');
  const missing = [...read].filter((f) => !bundled.has(f) && !/^scripts\/|^netlify\//.test(f));
  assert.deepEqual(missing, [], `files the lookup opens that included_files in netlify.toml does not bundle:\n${missing.join('\n')}`);
});
