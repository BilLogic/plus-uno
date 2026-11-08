/**
 * The machine-readable agent views: `agent-views/components.json` and
 * `agent-views/tokens.json`.
 *
 * The markdown views answer a reader; these answer a program. `check:ds-usage`,
 * the design-system usage eval and the lookup CLI all read them, so each fact
 * an agent can be held to (a component exists, a prop accepts these values, a
 * token sits on this tier) has one machine copy, derived from the same parse
 * that writes the markdown.
 *
 * Pure: the generators parse source and hand plain records in; nothing here
 * touches the disk.
 */

export const TIERS = ['primitive', 'semantic', 'pattern', 'component'];

const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/**
 * Read a deprecation out of a prop's description. Two markers count: the
 * JSDoc `@deprecated` tag, and a description that opens with "Deprecated:".
 * Prose that only mentions the word elsewhere is not a marker.
 *
 * @param {string} description
 * @returns {{replacement: string|null} | null}
 */
export function deprecationOf(description) {
  if (!description) return null;
  const marked = /@deprecated\b/.test(description) || /^\s*Deprecated:/.test(description);
  if (!marked) return null;
  const named = description.match(/\buse\s+`([^`]+)`/i);
  return { replacement: named ? named[1] : null };
}

/**
 * One record per barrel export, each with its `kind`: a `component` from
 * `@/components`, or a `pattern` from `@/patterns` or the page templates
 * (`PageLayout`). A component the barrel does not export is not part of the
 * public surface and is left out; an export with no parsed component (a hook,
 * a constant) is still listed, with `props: null`, so the manifest and the
 * existence index agree name for name.
 *
 * @param {{
 *   exports: string[],
 *   components: ParsedComponent[],
 *   patterns?: {name: string, from: string}[],
 *   parsedPatterns?: ParsedComponent[],
 *   version: string,
 * }} input
 *
 * @typedef {{name: string, group: string, source: string, summary?: string,
 *   props: {name: string, type: string, description: string, enumValues: string[]|null}[],
 *   defaults?: Record<string,string>, descriptions?: Record<string,string>}} ParsedComponent
 */
export function buildComponentsManifest({ exports, components, patterns = [], parsedPatterns = [], version }) {
  const componentNames = new Set(exports);
  for (const { name, from } of patterns) {
    if (componentNames.has(name)) throw new Error(`${name} is exported from both @/components and ${from}: one name, one record`);
  }
  const parsedComponents = new Map(components.map((c) => [c.name, c]));
  const parsedPattern = new Map(parsedPatterns.map((c) => [c.name, c]));
  const records = [
    ...[...componentNames].map((name) => recordOf(name, parsedComponents.get(name), 'component', '@/components')),
    ...patterns.map(({ name, from }) => recordOf(name, parsedPattern.get(name), 'pattern', from)),
  ];
  return { version, components: records.sort(byName) };
}

function recordOf(name, c, kind, from) {
  const line = `import { ${name} } from '${from}';`;
  if (!c) return { name, kind, import: line, group: null, source: null, summary: null, props: null };
  return {
    name,
    kind,
    import: line,
    group: c.group,
    source: c.source,
    summary: c.summary || null,
    props: c.props.map((p) => {
      const description = (c.descriptions && c.descriptions[p.name]) || p.description || '';
      const required = /\(required\)$/.test(p.type);
      return {
        name: p.name,
        type: p.type.replace(/\s*\(required\)$/, ''),
        required,
        default: (c.defaults && c.defaults[p.name]) || null,
        values: p.enumValues && p.enumValues.length ? [...p.enumValues] : null,
        description: description.replace(/@deprecated\b\s*/g, '').trim() || null,
        deprecated: deprecationOf(p.description) || deprecationOf(description),
      };
    }),
  };
}

/**
 * One record per token name. Sections arrive in the order the token view lists
 * them; a name that appears in two sections keeps its first.
 *
 * `intent` is present only where a plan gives one (`token-intent.mjs`): a
 * primitive never carries the field, and neither does a token no plan defines.
 *
 * @param {{group: string, tier: string, tokens: {name: string, value: string}[]}[]} sections
 * @param {Map<string, string>} [intents]  token name -> intent
 */
export function buildTokensManifest(sections, intents = new Map()) {
  const seen = new Map();
  for (const { group, tier, tokens } of sections) {
    if (!TIERS.includes(tier)) {
      throw new Error(`token section "${group}" has tier "${tier}"; expected one of ${TIERS.join(', ')}`);
    }
    for (const { name, value } of tokens) {
      if (seen.has(name)) continue;
      const record = { name, tier, group, value: value.trim() };
      const intent = tier === 'primitive' ? null : intents.get(name);
      if (intent) record.intent = intent;
      seen.set(name, record);
    }
  }
  return { tokens: [...seen.values()].sort(byName) };
}

/**
 * Stable JSON with the generated marker as its first key, so a reader opening
 * the file sees how to change it before anything else.
 */
export function serializeManifest(manifest, command) {
  const withHeader = {
    $generated: `DO NOT EDIT BY HAND. Generated by ${command} from design-system source; change the source and regenerate.`,
    ...manifest,
  };
  return `${JSON.stringify(withHeader, null, 2)}\n`;
}
