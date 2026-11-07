/**
 * The DS facts module: one home for what the design system has, what it calls
 * things, and what it does not have.
 *
 *   loadFacts(root)            the facts for a repo root or an installed package
 *     .lookup(name)            a component, pattern, export or prop, by name
 *     .barrels                 every name each public barrel makes importable
 *     .tokens(nameOrRole)      token records by exact name or by role
 *     .notHere()               invented and retired names, with replacements
 *     .scope                   the consumer-code roots
 *   readBarrel(root, spec)     what a barrel exports, for the generators that
 *                              write the manifests this module reads
 *   CONSUMER_ROOTS             the folders consumer code lives in
 *   BARRELS                    the public barrels: components, patterns, page templates
 *
 * Every reader of these facts is an adapter at this seam: `check:ds-usage`,
 * the component index generator and the manifest generator today. Each answer
 * carries a `status` (`exists`, `not-here`, `retired` or `unknown`) so a name
 * that is missing is answered, never thrown on.
 *
 * WHERE THE FACTS COME FROM. The generated manifests
 * (`agent-views/components.json`, `tokens.json`: components, patterns and
 * `PageLayout`, each with its kind, import, props and values), the hand-kept
 * lists (`_inventions.json`; `_patterns.json`, which adds only a pattern's group
 * and when to reach for it), the token plan's retired renames, and the public
 * barrels themselves. `root` is either a repo root (facts under
 * `design-system/`) or the design-system folder as a package ships it (facts at
 * its top).
 */

import fs from 'node:fs';
import path from 'node:path';

import { stripComments } from './js-comments.mjs';
import { retiredRenames } from './tokens/plan.mjs';

/** Where consumer code lives: what the usage checks read and hold to the system. */
export const CONSUMER_ROOTS = ['prototypes', 'src'];

const COMPONENTS_BARREL = '@/components';

/** The public barrels consumer code imports the design system from. */
export const BARRELS = [COMPONENTS_BARREL, '@/patterns', '@/specs/Universal/Pages'];

/** The design-system folder under `root`: `design-system/` in a repo, `root` itself in a package. */
function dsDir(root) {
  const nested = path.join(root, 'design-system');
  return fs.existsSync(nested) && fs.statSync(nested).isDirectory() ? nested : root;
}

/** Resolve an import specifier (`@/components/x`, `./x`) to a barrel file, or null. */
function resolveBarrel(spec, fromFile, ds) {
  const base = spec.startsWith('@/') ? path.join(ds, 'src', spec.slice(2)) : path.resolve(path.dirname(fromFile), spec);
  for (const candidate of [base, `${base}.js`, path.join(base, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** The component a specifier's file is named for: `./Sidebar` → Sidebar, `./Page/index` → Page. */
function namedFor(spec) {
  const parts = spec.replace(/\.[cm]?jsx?$/, '').split('/');
  const last = parts.pop();
  return last === 'index' ? parts.pop() : last;
}

/**
 * What a barrel exports, read the way the module system sees it: a
 * commented-out export line is not an export.
 *
 * - `components`: each `as` name of an `export { … }` list (the `default as X`
 *   of a component, whether alone or beside its constants and parts), in the
 *   barrel and any `export *` barrel inside its folder. A starred barrel outside
 *   it (`@/dataviz` from `@/components`) is a different section of the IA.
 * - `names`: every name the barrel makes importable: each specifier, each
 *   `export const|function|class`, across `export *` in any section.
 * - `aliases`: `export { default as Scale } from './RadioGroup'` → Scale names
 *   RadioGroup. An agent that takes an alias for a separate component writes
 *   code against props that belong to something else.
 *
 * The star form is not cosmetic: `components/index.js` once re-exported a whole
 * group that way, and a named-export-only regex dropped real components from an
 * index whose header says "If it's not listed, it DOES NOT EXIST."
 *
 * @param {string} root  a repo root or the design-system package root
 * @param {string} [spec]  the barrel's import specifier
 * @param {{onUnresolved?: (spec: string, from: string) => void}} [opts]
 * @returns {{components: string[], names: string[], aliases: Record<string, string>}}
 */
export function readBarrel(root, spec = COMPONENTS_BARREL, { onUnresolved } = {}) {
  const ds = dsDir(root);
  const top = resolveBarrel(spec, path.join(ds, 'src', 'index.js'), ds);
  const components = new Set();
  const names = new Set();
  const aliases = {};
  if (!top) return { components: [], names: [], aliases };
  const boundary = path.dirname(top);
  const inside = (file) => file === top || file.startsWith(`${boundary}${path.sep}`);
  const seen = new Set();

  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const within = inside(file);
    const content = stripComments(fs.readFileSync(file, 'utf8'));

    // One brace pair at a time. `[^}]` rather than `.` keeps a reformatted
    // multi-line list inside its own pair, and a plain `export { helper };`
    // cannot swallow the statement after it.
    for (const m of content.matchAll(/export\s+\{([^}]*)\}(?:\s*from\s*['"]([^'"]+)['"])?/g)) {
      const [, list, from] = m;
      for (const raw of list.split(',')) {
        const specifier = raw.trim().replace(/^type\s+/, '');
        if (!specifier) continue;
        const [local, exported] = specifier.split(/\s+as\s+/).map((s) => s.trim());
        const name = exported ?? local;
        if (name !== 'default') names.add(name);
        if (!within || !exported) continue;
        components.add(exported);
        if (local === 'default' && from) {
          const target = namedFor(from);
          if (target && /^[A-Z]/.test(target) && target !== exported) aliases[exported] = target;
        }
      }
    }
    for (const m of content.matchAll(/export\s+(?:const|let|var|function\*?|class|async\s+function)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
    for (const m of content.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
      const barrel = resolveBarrel(m[1], file, ds);
      if (!barrel) {
        if (within) onUnresolved?.(m[1], file);
        continue;
      }
      walk(barrel);
    }
  };

  walk(top);
  return { components: [...components].sort(), names: [...names].sort(), aliases };
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const importLine = (name, from) => `import { ${name} } from '${from}';`;

/** `Button variant`, `Button appearance="secondary"`, `Heading size="sm" / "lg"` → its parts. */
function parsePropRow(not) {
  const m = not.match(/^(\w+)\s+(\w+)(.*)$/);
  if (!m) return null;
  return { component: m[1], prop: m[2], values: [...m[3].matchAll(/"([^"]+)"/g)].map((v) => v[1]) };
}

/** `--space-025 (4px)`, `--radius-<n>`, `--size-element-*, --element-*` → name matchers. */
function tokenMatchers(not) {
  return [...not.matchAll(/--[\w<>*-]+/g)].map(([glob]) => {
    const source = glob
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/<n>/g, '\\d+')
      .replace(/\*/g, '[\\w-]*');
    return new RegExp(`^${source}$`);
  });
}

/**
 * The facts for one tree.
 *
 * @param {string} root  a repo root, or the design-system folder as a package ships it
 */
export function loadFacts(root) {
  const ds = dsDir(root);
  const views = path.join(ds, 'agent-views');
  const manifestFile = path.join(views, 'components.json');
  if (!fs.existsSync(manifestFile)) {
    throw new Error(`no design-system facts under ${root}: looked for design-system/agent-views/components.json and agent-views/components.json`);
  }
  const optional = (name, fallback) => (fs.existsSync(path.join(views, name)) ? readJson(path.join(views, name)) : fallback);

  const componentManifest = readJson(manifestFile);
  const tokenManifest = optional('tokens.json', { tokens: [] });
  const inventions = optional('_inventions.json', { components: [], props: [], tokens: [] });
  const patterns = optional('_patterns.json', { patterns: [] }).patterns;
  const barrel = readBarrel(root);
  const barrels = Object.fromEntries(BARRELS.map((spec) => [spec, new Set(spec === COMPONENTS_BARREL ? barrel.names : readBarrel(root, spec).names)]));
  const importable = barrels[COMPONENTS_BARREL];
  const retired = retiredRenames();

  const records = new Map(componentManifest.components.map((c) => [c.name, c]));
  const patternRows = new Map(patterns.map((r) => [r.name, r]));
  const tokenRecords = new Map(tokenManifest.tokens.map((t) => [t.name, t]));
  const inventedComponents = new Map(inventions.components.map((r) => [r.not, r]));
  const inventedProps = inventions.props.map((r) => ({ row: r, ...parsePropRow(r.not) })).filter((r) => r.component);
  const inventedTokens = inventions.tokens.map((r) => ({ row: r, matchers: tokenMatchers(r.not) }));

  const answer = (name, status, fields = {}) => ({
    name,
    status,
    kind: null,
    import: null,
    group: null,
    source: null,
    summary: null,
    props: null,
    aliasOf: null,
    replacement: [],
    why: null,
    ...fields,
  });
  const note = (row) => (row ? { replacement: [...row.use], why: row.why ?? null } : {});

  /**
   * A component, pattern or barrel export, by its exported name. A pattern's
   * group and summary are the hand-kept list's: the group it is filed under
   * and when to reach for it, which source cannot say.
   */
  function lookupName(name) {
    const invented = inventedComponents.get(name);
    const record = records.get(name);
    if (record) {
      const kind = record.kind ?? 'component';
      const aliasOf = kind === 'component' ? barrel.aliases[name] ?? null : null;
      const props = record.props ?? (aliasOf ? records.get(aliasOf)?.props ?? null : null);
      const row = kind === 'pattern' ? patternRows.get(name) : undefined;
      return answer(name, 'exists', {
        kind,
        import: record.import,
        group: row?.group ?? record.group,
        source: record.source,
        summary: row?.use ?? record.summary,
        props,
        aliasOf,
        ...note(invented),
      });
    }
    const from = BARRELS.find((spec) => barrels[spec].has(name));
    if (from) return answer(name, 'exists', { kind: 'export', import: importLine(name, from), ...note(invented) });
    if (invented) return answer(name, 'not-here', note(invented));
    return answer(name, 'unknown');
  }

  /** `Component.prop` or `Component.prop=value`. */
  function lookupProp(name) {
    const [target, value = null] = name.split('=');
    const [component, propName] = target.split('.');
    const owner = lookupName(component);
    const prop = owner.status === 'exists' ? (owner.props ?? []).find((p) => p.name === propName) : undefined;
    const invented = inventedProps.find(
      (r) => r.component === component && r.prop === propName && (value === null ? r.values.length === 0 : r.values.includes(value)),
    );
    const base = {
      kind: 'prop',
      component,
      type: prop?.type ?? null,
      values: prop?.values ?? null,
      default: prop?.default ?? null,
      required: prop?.required ?? null,
      description: prop?.description ?? null,
      deprecated: prop?.deprecated ?? null,
      replacement: [],
      why: null,
    };
    const accepted = prop && (value === null || prop.values === null || prop.values.includes(value));
    if (accepted) {
      const replacement = prop.deprecated?.replacement;
      return { name, status: 'exists', ...base, replacement: replacement ? [replacement.includes('.') ? replacement : `${component}.${replacement}`] : [] };
    }
    if (invented) return { name, status: 'not-here', ...base, replacement: [...invented.row.use], why: invented.row.why ?? null };
    return { name, status: 'unknown', ...base };
  }

  return {
    root,
    scope: CONSUMER_ROOTS,
    /** The manifests as generated, for adapters that index them their own way. */
    manifests: { components: componentManifest, tokens: tokenManifest },
    /** Every name the `@/components` barrel makes importable. */
    importable,
    /** Every name each public barrel makes importable, by its specifier. */
    barrels,
    /** Retired token name → its replacement. */
    retired,

    /**
     * A component, pattern or barrel export (`Button`), or a prop and value
     * (`Button.appearance`, `Button.appearance=primary`).
     */
    lookup(name) {
      return name.includes('.') ? lookupProp(name) : lookupName(name);
    },

    /**
     * Token records by exact name (`--stack-md`, which answers a retired or
     * invented name too) or by role (`stack` → every `--stack-*`), each with
     * its tier and intent.
     */
    tokens(query) {
      const token = (t, extra = {}) => ({ name: t.name, status: 'exists', tier: t.tier, group: t.group, value: t.value, intent: t.intent ?? null, replacement: [], why: null, ...extra });
      if (query.startsWith('--')) {
        const invented = inventedTokens.find((r) => r.matchers.some((re) => re.test(query)))?.row;
        const record = tokenRecords.get(query);
        if (record) return [token(record, note(invented))];
        const empty = { name: query, tier: null, group: null, value: null, intent: null };
        if (retired.has(query)) return [{ ...empty, status: 'retired', replacement: [retired.get(query)], why: null }];
        if (invented) return [{ ...empty, status: 'not-here', ...note(invented) }];
        return [];
      }
      const role = query.toLowerCase();
      return [...tokenRecords.values()]
        .filter((t) => t.name === `--${role}` || t.name.startsWith(`--${role}-`) || t.group.toLowerCase() === role)
        .map((t) => token(t));
    },

    /** Every name agents reach for that is not here: inventions, then retired tokens. */
    notHere() {
      const rows = [];
      for (const [section, kind] of [['components', 'component'], ['props', 'prop'], ['tokens', 'token']]) {
        for (const r of inventions[section]) rows.push({ not: r.not, kind, use: [...r.use], why: r.why ?? null });
      }
      for (const [not, use] of retired) rows.push({ not, kind: 'token', use: [use], why: null });
      return rows;
    },
  };
}
