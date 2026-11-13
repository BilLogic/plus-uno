import { test } from 'node:test';
import assert from 'node:assert/strict';

import { claudeToolUse, estimateGeminiCost, excludesOf, geminiSettings, isGemini, runGemini, toClaudeStream, vertexBudget, vertexMissing } from './gemini-agent.mjs';

const line = (o) => JSON.stringify(o);

test('a gemini model name picks the Gemini builder', () => {
  assert.equal(isGemini('gemini-3.8-flash'), true);
  assert.equal(isGemini('sonnet'), false);
});

test('a Gemini run needs the Vertex variables', () => {
  assert.deepEqual(vertexMissing({ GOOGLE_GENAI_USE_VERTEXAI: 'true' }), ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS']);
});

test('Claude denials become Gemini excludes; read denials drop out', () => {
  assert.deepEqual(excludesOf(['Skill', 'Agent', 'WebFetch', 'WebSearch', 'Write', 'Bash'], ['Read(/x/**)', 'Bash(npm run check:ds-usage:*)']), [
    'activate_skill',
    'web_fetch',
    'google_web_search',
    'write_file',
    'run_shell_command',
    'run_shell_command(npm run check:ds-usage)',
  ]);
});

test('settings load AGENTS.md, skip folder trust, and carry the lookup server', () => {
  const s = geminiSettings({ mcpConfig: JSON.stringify({ mcpServers: { 'plus-ds': { type: 'stdio', command: 'node', args: ['/c/scripts/ds-mcp.mjs'] } } }), exclude: ['web_fetch'] });
  assert.deepEqual(s.context.fileName, ['AGENTS.md']);
  assert.equal(s.security.auth.selectedType, 'vertex-ai');
  assert.equal(s.security.folderTrust.enabled, false);
  assert.deepEqual(s.mcpServers, { 'plus-ds': { command: 'node', args: ['/c/scripts/ds-mcp.mjs'] } });
  assert.deepEqual(s.tools.exclude, ['web_fetch']);
});

test('Gemini tools map to the Claude tools the read set and reach checks know', () => {
  assert.deepEqual(claudeToolUse('read_file', { file_path: 'a/b.md' }, '/copy'), [{ type: 'tool_use', name: 'Read', input: { file_path: '/copy/a/b.md' } }]);
  assert.equal(claudeToolUse('run_shell_command', { command: 'ls' }, '/copy')[0].name, 'Bash');
  assert.equal(claudeToolUse('ds_find', { query: 'x' }, '/copy')[0].name, 'mcp__plus-ds__ds_find');
  assert.equal(claudeToolUse('plus-ds__ds_get', {}, '/copy')[0].name, 'mcp__plus-ds__ds_get');
});

test('a Gemini transcript becomes Claude stream-json with turns, final text and tokens', () => {
  const stdout = [
    line({ type: 'init', model: 'gemini-3.8-flash' }),
    line({ type: 'message', role: 'assistant', content: 'Looking.', delta: true }),
    line({ type: 'tool_use', tool_name: 'read_file', parameters: { file_path: 'a.txt' } }),
    line({ type: 'tool_use', tool_name: 'glob', parameters: { pattern: '*.jsx' } }),
    line({ type: 'tool_result', status: 'success' }),
    line({ type: 'tool_use', tool_name: 'write_file', parameters: { file_path: 'b.txt', content: 'x' } }),
    line({ type: 'message', role: 'assistant', content: '{"gap_named":', delta: true }),
    line({ type: 'message', role: 'assistant', content: ' true}', delta: true }),
    line({ type: 'result', status: 'success', stats: { input_tokens: 100, input: 60, cached: 40, output_tokens: 7 } }),
  ].join('\n');
  const events = toClaudeStream(stdout, '/copy').split('\n').map((l) => JSON.parse(l));
  assert.equal(events.filter((e) => e.type === 'assistant').length, 3);
  const result = events.at(-1);
  assert.equal(result.type, 'result');
  assert.equal(result.is_error, false);
  assert.equal(result.result, '{"gap_named": true}');
  assert.equal(result.num_turns, 3);
  assert.deepEqual(result.usage, { input_tokens: 60, output_tokens: 7, cache_read_input_tokens: 40, cache_creation_input_tokens: 0 });
  assert.equal(result.total_cost_usd, null);
});

test('a failed Gemini run is an error result', () => {
  const events = toClaudeStream(line({ type: 'result', status: 'error', error: { message: 'quota' } }), '/c').split('\n').map((l) => JSON.parse(l));
  assert.equal(events[0].is_error, true);
  assert.match(events[0].result, /quota/);
});

test('runGemini isolates settings in GEMINI_CLI_HOME and normalizes the output', () => {
  let seen;
  const spawn = (cmd, args, opts) => {
    seen = { cmd, args, home: opts.env.GEMINI_CLI_HOME };
    return { status: 0, stdout: line({ type: 'result', status: 'success', stats: {} }), stderr: '' };
  };
  const out = runGemini({ cwd: '/copy', prompt: 'go', model: 'gemini-3.8-flash', readOnly: true, disallowed: ['WebFetch'], deny: [], mcp: { mcpConfig: '{"mcpServers":{}}' }, spawn, env: {} });
  assert.equal(seen.cmd, 'gemini');
  assert.ok(seen.args.includes('--sandbox'));
  assert.notEqual(seen.home, undefined);
  assert.equal(JSON.parse(out.stdout).type, 'result');
});

test('Vertex output includes reasoning tokens omitted by the CLI candidate count', () => {
  const result = JSON.parse(toClaudeStream(line({ type: 'result', status: 'success', stats: { input_tokens: 100, input: 60, cached: 40, output_tokens: 7, total_tokens: 132 } }), '/c'));
  assert.equal(result.usage.output_tokens, 32);
});

test('Vertex estimates use separate uncached, cached and billable output counts', () => {
  assert.equal(estimateGeminiCost({ input_tokens: 1_000_000, cache_read_tokens: 2_000_000, output_tokens: 100_000 }), 1.275);
  assert.equal(estimateGeminiCost({ input_tokens: 0, cache_read_tokens: 0, output_tokens: 0 }), 0);
  assert.equal(estimateGeminiCost({ input_tokens: null, output_tokens: null }), null);
});

test('Vertex budget reserves the next run and stops on missing usage', () => {
  const rows = [{ model: 'sonnet', cost_usd: 100 }, { model: 'gemini-3.8-flash', estimated_cost_usd: 34.5 }];
  assert.equal(vertexBudget(rows).can_start, true);
  assert.equal(vertexBudget([...rows, { model: 'gemini-3.8-flash', estimated_cost_usd: 1 }]).can_start, false);
  assert.equal(vertexBudget([{ model: 'gemini-3.8-flash', input_tokens: null, output_tokens: null }]).can_start, false);
  assert.equal(vertexBudget(rows).spent, 34.5);
});
