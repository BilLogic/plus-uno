/**
 * The ds-usage eval's Gemini builder: a `gemini -p` run on Vertex, reported in
 * the shape `claude -p --output-format stream-json` prints, so the eval scores,
 * reads and flags a Gemini run with the same code as a Claude one.
 *
 * A model whose name starts `gemini` runs here. Auth comes from the caller's
 * environment (`GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`,
 * `GOOGLE_CLOUD_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS`); each run gets
 * its own settings folder through `GEMINI_CLI_HOME`, so the operator's own
 * Gemini login and settings never reach it.
 *
 * Parity with the Claude builder: AGENTS.md is the context file; writes and
 * shell run in the macOS sandbox, which writes only inside the copy; Gemini's
 * file tools stay inside the workspace on their own, and a shell read past the
 * copy is caught afterwards by `reachedCheckout`, as on Claude. Claude's
 * project hooks and skills have no Gemini equivalent, so `hook-off` measures
 * the same harness as `current` here.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const isGemini = (model) => /^gemini/i.test(String(model ?? ''));

/** Global Vertex introductory rates, verified 2026-11-13; estimates, not invoices.
 * https://cloud.google.com/model-garden/pricing (through 2026-12-31).
 */
export const GEMINI_PRICE = { input: 0.75, cached: 0.075, output: 3.75, per: 1_000_000 };

/** One normalized usage receipt. Missing usage remains unknown, never free. */
export function estimateGeminiCost(usage) {
  if (usage?.input_tokens == null || usage?.output_tokens == null) return null;
  return Number(((usage.input_tokens * GEMINI_PRICE.input +
    (usage.cache_read_tokens ?? 0) * GEMINI_PRICE.cached +
    usage.output_tokens * GEMINI_PRICE.output) / GEMINI_PRICE.per).toFixed(8));
}

/** Ledger-based stop before another metered run; unknown usage holds the batch.
 * A $45 operating ceiling leaves $5 outside it for pre-study/incomplete receipts.
 * Each new run reserves $10 inside that ceiling, covering two in-flight runs.
 */
export function vertexBudget(rows, limit = 45, reserve = 10) {
  let spent = 0;
  let unknown = 0;
  for (const row of rows.filter((r) => r.model === 'gemini-3.8-flash')) {
    const build = estimateGeminiCost(row);
    const judge = row.judge_usage ? estimateGeminiCost(row.judge_usage) : 0;
    const amount = row.estimated_cost_usd ?? (build == null || judge == null ? null : build + judge);
    if (amount == null) unknown += 1;
    else spent += amount;
  }
  spent = Number(spent.toFixed(8));
  return { spent, remaining: Number((limit - spent).toFixed(8)), unknown, can_start: unknown === 0 && spent + reserve <= limit };
}

/** The Vertex variables a Gemini run needs; the names of the ones unset. */
export const VERTEX_ENV = ['GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS'];
export const vertexMissing = (env) => VERTEX_ENV.filter((name) => !env[name]);

/** Claude tool names to the Gemini tools they stand for. */
const GEMINI_TOOL = {
  WebFetch: ['web_fetch'],
  WebSearch: ['google_web_search'],
  Write: ['write_file'],
  Edit: ['replace'],
  NotebookEdit: [],
  Bash: ['run_shell_command'],
  Skill: ['activate_skill'],
  Agent: [],
  Task: [],
};

/**
 * Claude permission strings as Gemini `tools.exclude` entries: a bare tool
 * name, or `Bash(cmd:*)` as `run_shell_command(cmd)`. Read denials drop out:
 * Gemini's file tools never leave the workspace.
 */
export function excludesOf(disallowed = [], deny = []) {
  const out = disallowed.flatMap((name) => GEMINI_TOOL[name] ?? []);
  for (const rule of deny) {
    const shell = /^Bash\((.*?)(?::\*)?\)$/.exec(rule);
    if (shell) out.push(`run_shell_command(${shell[1]})`);
  }
  return [...new Set(out)];
}

/** The settings a run's `GEMINI_CLI_HOME` holds. */
export function geminiSettings({ mcpConfig = '{"mcpServers":{}}', exclude = [] } = {}) {
  const { mcpServers = {} } = JSON.parse(mcpConfig);
  const servers = Object.fromEntries(Object.entries(mcpServers).map(([name, s]) => [name, { command: s.command, args: s.args ?? [] }]));
  return {
    security: { auth: { selectedType: 'vertex-ai' }, folderTrust: { enabled: false } },
    context: { fileName: ['AGENTS.md'] },
    model: { maxSessionTurns: 80 },
    mcpServers: servers,
    tools: { exclude },
    telemetry: { enabled: false },
    privacy: { usageStatisticsEnabled: false },
  };
}

const abs = (p, cwd) => (p == null ? p : path.isAbsolute(p) ? p : path.join(cwd, p));

/** One Gemini tool call as the Claude `tool_use` part it corresponds to. */
export function claudeToolUse(name, input = {}, cwd) {
  switch (name) {
    case 'read_file':
      return [{ type: 'tool_use', name: 'Read', input: { file_path: abs(input.file_path ?? input.absolute_path, cwd) } }];
    case 'read_many_files':
      return (input.paths ?? input.include ?? []).map((p) => ({ type: 'tool_use', name: 'Read', input: { file_path: abs(p, cwd) } }));
    case 'search_file_content':
    case 'grep_search':
      return [{ type: 'tool_use', name: 'Grep', input: { pattern: input.pattern, ...(input.dir_path ?? input.path ? { path: abs(input.dir_path ?? input.path, cwd) } : {}) } }];
    case 'glob':
      return [{ type: 'tool_use', name: 'Glob', input: { pattern: input.pattern, ...(input.dir_path ?? input.path ? { path: abs(input.dir_path ?? input.path, cwd) } : {}) } }];
    case 'list_directory':
      return [{ type: 'tool_use', name: 'Glob', input: { pattern: '*', path: abs(input.dir_path ?? input.path ?? '.', cwd) } }];
    case 'run_shell_command':
      return [{ type: 'tool_use', name: 'Bash', input: { command: input.command } }];
    case 'write_file':
      return [{ type: 'tool_use', name: 'Write', input: { ...input, file_path: abs(input.file_path, cwd) } }];
    case 'replace':
      return [{ type: 'tool_use', name: 'Edit', input: { ...input, file_path: abs(input.file_path, cwd) } }];
    default: {
      // An MCP tool: Gemini names it bare (`ds_find`) or server-prefixed.
      const ds = /(?:^|__)(ds_[a-z]+)$/.exec(name);
      return [{ type: 'tool_use', name: ds ? `mcp__plus-ds__${ds[1]}` : name, input }];
    }
  }
}

/**
 * A `gemini --output-format stream-json` transcript as `claude` stream-json
 * lines: each tool call an assistant `tool_use`, and one `result` event with
 * the final text, the turns (model steps that ended in tool calls, plus the
 * last) and the token counts. Gemini reports no cost, so `total_cost_usd` is null.
 */
export function toClaudeStream(stdout, cwd) {
  const lines = [];
  let text = '';
  let turns = 0;
  let inTools = false; // the current model step has called a tool
  let afterTools = false; // a tool ran since the last assistant text
  let result = null;
  for (const raw of String(stdout ?? '').split('\n')) {
    let e;
    try {
      e = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!e || typeof e !== 'object') continue;
    if (e.type === 'tool_use') {
      if (!inTools) turns += 1;
      inTools = true;
      afterTools = true;
      lines.push({ type: 'assistant', message: { content: claudeToolUse(e.tool_name, e.parameters, cwd) } });
    } else if (e.type === 'tool_result') {
      inTools = false;
    } else if (e.type === 'message' && e.role === 'assistant') {
      if (afterTools) text = '';
      afterTools = false;
      inTools = false;
      text += e.content ?? '';
    } else if (e.type === 'result') result = e;
  }
  if (result) {
    const s = result.stats ?? {};
    lines.push({
      type: 'result',
      is_error: result.status !== 'success',
      result: result.status === 'success' ? text : `gemini ${result.status}: ${JSON.stringify(result.error ?? s).slice(0, 2000)}`,
      num_turns: turns + 1,
      usage: {
        input_tokens: s.input ?? (s.input_tokens != null ? s.input_tokens - (s.cached ?? 0) : null),
        output_tokens: s.total_tokens != null && s.input_tokens != null ? Math.max(s.output_tokens ?? 0, s.total_tokens - s.input_tokens) : s.output_tokens ?? null,
        cache_read_input_tokens: s.cached ?? null,
        cache_creation_input_tokens: 0,
      },
      total_cost_usd: null,
    });
  }
  return lines.map((l) => JSON.stringify(l)).join('\n');
}

/**
 * Spawn one Gemini run in `cwd`. `spawn` is `spawnSync`'s shape. Returns the
 * spawn result with `stdout` already in Claude's stream-json shape.
 */
export function runGemini({ cwd, prompt, model, readOnly, disallowed, deny, mcp, spawn, env = process.env }) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-eval-gemini-'));
  try {
    fs.mkdirSync(path.join(home, '.gemini'));
    const exclude = excludesOf(readOnly ? [...disallowed, 'Write', 'Edit', 'Bash'] : disallowed, deny);
    fs.writeFileSync(path.join(home, '.gemini/settings.json'), JSON.stringify(geminiSettings({ mcpConfig: mcp.mcpConfig, exclude }), null, 2));
    const args = ['-m', model, '--yolo', '--sandbox', '--output-format', 'stream-json', '-p', prompt];
    const out = spawn('gemini', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      timeout: 45 * 60 * 1000,
      input: '',
      env: { ...env, GEMINI_CLI_HOME: home, NO_BROWSER: 'true' },
    });
    return { ...out, stdout: toClaudeStream(out.stdout, cwd) };
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}
