#!/usr/bin/env node
/**
 * `npm run ds -- <find|get|tokens|guide|check> …`: the design-system lookup
 * from a shell, the same five answers the local MCP server gives
 * (`scripts/ds-mcp.mjs`), both made by `scripts/lib/ds-lookup.mjs`.
 *
 *   ds find <query…>                 what exists for a task, name or alias
 *   ds get <Name…> [--section s]     props · usage · examples · a11y · figma
 *   ds tokens <role>                 the steps for a role, with intent
 *   ds guide [topic | rule id]       a guideline, a rule, or the orientation
 *   ds add <item…> [--dir d] [--overwrite] [--no-install]   copy registry items into your project (the packaged one)
 *   ds check [paths…]                check:ds-usage on those paths (the packaged one: your project, `.` by default)
 *   ds check --code '<jsx>' [--path f.jsx]
 *   --json                           the answer as data
 *
 * Exit 1 when check finds a fail-level escape or the subcommand is unknown; 2 when it has nothing to check (a missing path, or no files).
 */
import { REPO_ROOT } from './lib/corpus.mjs';
import { apply, plan, registryDir, renderAdd } from './lib/ds-add.mjs';
import { createLookup, render } from './lib/ds-lookup.mjs';
import { isEntry } from './lib/findings.mjs';

const USAGE = `usage: ds <find|get|tokens|guide|add|check> …
  find <query…>               start here: what exists for a task, name or alias
  get <Name…> [--section s]   props | usage | examples | a11y | figma
  tokens <role>               the steps for a role, with intent
  guide [topic | rule id]     no argument: the orientation
  add <item…> [--dir d] [--overwrite] [--no-install]
                              copy registry items into your project; find names the item
  check [paths…] | --code '<jsx>' [--path f.jsx]
  --json                      the answer as data`;

/** `--name value` out of argv; the rest stay positional. */
function parse(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') flags.json = true;
    else if (a === '--overwrite') flags.overwrite = true;
    else if (a === '--no-install') flags.noInstall = true;
    else if (['--section', '--code', '--path', '--dir'].includes(a)) flags[a.slice(2)] = argv[(i += 1)];
    else rest.push(a);
  }
  return { flags, rest };
}

/** `consumerRoot`: where `check` reads files from when that is not `root` (the package checks the caller's project). */
export function cli(argv, root = REPO_ROOT, { consumerRoot = root } = {}) {
  const [op, ...args] = argv;
  const { flags, rest } = parse(args);
  const lookup = createLookup(root, { consumerRoot });
  if (op === 'add') return add(root, consumerRoot, rest, flags);
  const calls = {
    find: () => lookup.find(rest.join(' ')),
    get: () => lookup.get(rest, flags.section),
    tokens: () => lookup.tokens(rest[0]),
    guide: () => lookup.guide(rest.join(' ')),
    check: () => lookup.check(flags.code !== undefined ? { code: flags.code, path: flags.path } : { paths: rest }),
  };
  if (!calls[op]) {
    console.error(USAGE);
    return 1;
  }
  let result;
  try {
    result = calls[op]();
  } catch (e) {
    // A path that does not exist is a usage error, told apart from findings (1) for CI.
    console.error(e.message);
    return 2;
  }
  if (op === 'check' && result.checked === 0) {
    console.error('ds check: no files to check here (a .jsx .js .mjs .tsx .ts .scss .css .html file outside node_modules); run it from the project root or name the paths.');
    return 2;
  }
  console.log(flags.json ? JSON.stringify(result, null, 2) : render(op, result));
  return op === 'check' && result.failing ? 1 : 0;
}

/** `ds add`: only the packaged `ds` installs, into the caller's project; the repo's own `ds` has no project to write to. */
function add(root, consumerRoot, names, flags) {
  if (consumerRoot === root) { console.error('ds add installs into your project: run the packaged `ds` in your project (npx ds add Button).'); return 2; }
  const dir = registryDir(root);
  if (!dir || !names.length) { console.error(dir ? 'ds add: name an item (ds find <task> names it), or `foundation` for the tokens and styles alone.' : 'ds add: this build carries no registry.'); return 2; }
  try {
    const p = plan(dir, names);
    const r = apply(p, { projectRoot: consumerRoot, dir: flags.dir, overwrite: flags.overwrite, install: !flags.noInstall });
    console.log(flags.json ? JSON.stringify({ items: p.items, ...r }, null, 2) : renderAdd(p, r, consumerRoot));
    return r.conflicts.length || r.installFailed ? 1 : 0;
  } catch (e) {
    console.error(e.message);
    return 2;
  }
}

if (isEntry(import.meta.url)) process.exitCode = cli(process.argv.slice(2));
