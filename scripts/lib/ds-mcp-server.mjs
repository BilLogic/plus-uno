/**
 * The design-system MCP server, transport-free: the five lookup tools and the
 * server that serves them. Two adapters mount it, so they cannot disagree:
 * `scripts/ds-mcp.mjs` over stdio (registered in `.mcp.json` as `plus-ds`) and
 * `netlify/functions/ds-mcp` over Streamable HTTP. Every answer comes from
 * `scripts/lib/ds-lookup.mjs`; this file only maps tool calls onto it.
 * `docs/connectors/ds-mcp.md` is the reader's account.
 *
 * Built on the SDK's low-level `Server` with plain JSON schemas, so the only
 * package it needs is `@modelcontextprotocol/sdk`.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { REPO_ROOT } from './corpus.mjs';
import { ORIENTATION, PATHS_REFUSAL, PathsRefused, createLookup, render } from './ds-lookup.mjs';

export const INSTRUCTIONS = `${ORIENTATION}

Every PLUS UI task starts with ds_find and finishes with ds_check at zero failing findings. A miss names the tool to call instead.`;

const str = (description) => ({ type: 'string', description });

/** The five tools, in the order an agent calls them. */
export const TOOLS = [
  {
    name: 'ds_find',
    op: 'find',
    description:
      'Step 1 of 5, the entry point: what PLUS has for a task, a name or an alias. Returns short ranked matches across patterns, components, tokens and Font Awesome Free icons; Figma component names resolve to their code name; a not-here name (Alert, Card, a Pro icon) comes back with its replacement. Next: ds_get for the names you will use.',
    inputSchema: { type: 'object', properties: { query: str('A task in words ("a table of students"), a name ("PatternCard"), a Figma name or an icon.') }, required: ['query'] },
    call: (l, a) => l.find(a.query),
  },
  {
    name: 'ds_get',
    op: 'get',
    description:
      'Step 2 of 5: full records for names ds_find returned: import line, props with allowed values, usage, do and don\'t examples, accessibility notes and the Figma mapping. Pass section to load one part. A retired or not-here name returns its replacement. Next: ds_tokens for styling.',
    inputSchema: {
      type: 'object',
      properties: {
        names: { type: 'array', items: { type: 'string' }, description: 'Component, pattern, prop (Button.appearance) or token names.' },
        section: { type: 'string', enum: ['props', 'usage', 'examples', 'a11y', 'figma'], description: 'One part only; leave out for all.' },
      },
      required: ['names'],
    },
    call: (l, a) => l.get(a.names, a.section),
  },
  {
    name: 'ds_tokens',
    op: 'tokens',
    description:
      'Step 3 of 5: the token steps for a styling role (stack, inline, pad, card, ds-text…), each with its intent, so you pick by role rather than by value. Primitives are left out: consumer code reads these steps. Next: ds_guide for layout and content, then write.',
    inputSchema: { type: 'object', properties: { role: str('A role ("stack", "card", "ds-background") or an exact token name ("--stack-md").') }, required: ['role'] },
    call: (l, a) => l.tokens(a.role),
  },
  {
    name: 'ds_guide',
    op: 'guide',
    description:
      'Step 4 of 5: a guideline (layout formulas, grid, content, accessibility, color…) or why a ds_check rule fired, with what to write instead. With no argument, the orientation: what the system is, the barrels, the tool order and the hard rules. Next: write the code, then ds_check.',
    inputSchema: { type: 'object', properties: { topic: str('A guideline topic ("layout") or a rule id ("ds/no-raw-literal"); leave out for the orientation.') } },
    call: (l, a) => l.guide(a.topic),
  },
  {
    name: 'ds_check',
    op: 'check',
    description:
      'Step 5 of 5, the finish: runs check:ds-usage on code or paths and returns each escape with its rule id, line and fix. Done is zero failing findings. ds_guide(rule id) explains a rule.',
    inputSchema: {
      type: 'object',
      properties: {
        code: str('Source to check.'),
        path: str('The file name the code would have, for its language and page rules (default prototypes/snippet.jsx).'),
        paths: { type: 'array', items: { type: 'string' }, description: 'Repo-relative files or folders to check instead of code.' },
      },
    },
    call: (l, a) => l.check({ code: a.code, path: a.path, paths: a.paths }),
  },
];

/** What the hosted server says when `ds_check` is given `paths` (the lookup's refusal). */
export const HOSTED_PATHS_REFUSAL = PATHS_REFUSAL;

/** The tool as a hosted client sees it: `paths` is not offered, and the description says so. */
function hostedTool({ name, description, inputSchema }) {
  if (name !== 'ds_check') return { name, description, inputSchema };
  const { paths, ...properties } = inputSchema.properties;
  return {
    name,
    description: `${description.replace(' on code or paths', ' on code')} Hosted: code only, no paths.`,
    inputSchema: { ...inputSchema, properties },
  };
}

/**
 * @param {string} [root]  the repo root the facts are read from
 * @param {{hosted?: boolean, lookup?: () => object}} [options]
 *   hosted: read-only for callers who are not in the checkout; the tools it offers and the lookup it makes
 *     leave `ds_check` code only, never paths.
 *   lookup: a factory for a lookup owned by the caller and shared across servers (the facts load once).
 *     Left out, this server makes its own on the first call.
 */
export function createServer(root = REPO_ROOT, { hosted = false, lookup: getLookup } = {}) {
  let own;
  const lookupFor = getLookup ?? (() => (own ??= createLookup(root, { readPaths: !hosted })));
  const server = new Server({ name: 'plus-ds', version: '1.0.0' }, { capabilities: { tools: {} }, instructions: INSTRUCTIONS });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((tool) => (hosted ? hostedTool(tool) : { name: tool.name, description: tool.description, inputSchema: tool.inputSchema })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const tool = TOOLS.find((t) => t.name === params.name);
    if (!tool) return { isError: true, content: [{ type: 'text', text: `No tool ${params.name}. Tools: ${TOOLS.map((t) => t.name).join(', ')}.` }] };
    try {
      return { content: [{ type: 'text', text: render(tool.op, tool.call(lookupFor(), params.arguments ?? {})) }] };
    } catch (err) {
      if (err instanceof PathsRefused) return { isError: true, content: [{ type: 'text', text: err.message }] };
      return { isError: true, content: [{ type: 'text', text: `${params.name} failed: ${err.message}` }] };
    }
  });
  return server;
}

