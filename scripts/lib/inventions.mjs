/**
 * The index header's "Not here → use instead" table and the self-check that
 * closes the index, from `design-system/agent-views/_inventions.json`.
 *
 * The data is hand-kept; the rendering is generated, and `checkInventions`
 * holds every target to the manifests so a row can never point at a name
 * that does not exist.
 *
 * The table is the one source of retired component names. A row marked
 * `retired` is a name this library once had, and `check:ads-language` bans it
 * (`retiredComponents`); `inProse` also bans it from component doc prose, for a
 * rename with no alias (`renamedInProse`). Retiring a component is one row.
 * Retired token names are the token plan's (ADR-038): the facts module lists
 * them beside these rows, and `tokenRowConflicts` holds a hand-kept token row
 * to what the plan maps the names it covers to.
 */

/** A target as written: `Name`, `Name.prop`, `Name.prop=value`, or `--token`. */
function parse(target) {
  if (target.startsWith('--')) return { kind: 'token', name: target };
  const [path, value] = target.split('=');
  const [component, prop] = path.split('.');
  return { kind: 'component', component, prop: prop ?? null, value: value ?? null };
}

/**
 * Every target that names nothing real, as messages.
 * @param {{components: object[], props: object[], tokens: object[]}} inventions
 * @param {{components: {name: string, props: {name: string, values: string[]|null}[]|null}[]}} components
 * @param {{tokens: {name: string}[]}} tokens
 * @param {string[]} [patterns]  pattern names (`_patterns.json`), valid as a whole-name target
 */
export function checkInventions(inventions, components, tokens, patterns = []) {
  const byName = new Map(components.components.map((c) => [c.name, c]));
  const patternNames = new Set(patterns);
  const tokenNames = new Set(tokens.tokens.map((t) => t.name));
  const problems = [];
  for (const row of [...inventions.components, ...inventions.props, ...inventions.tokens]) {
    for (const target of row.use) {
      const t = parse(target);
      if (t.kind === 'token') {
        if (!tokenNames.has(t.name)) problems.push(`${row.not}: ${target} is not in tokens.json`);
        continue;
      }
      if (!t.prop && patternNames.has(t.component)) continue;
      const record = byName.get(t.component);
      if (!record) {
        problems.push(`${row.not}: ${t.component} is not in components.json`);
        continue;
      }
      if (!t.prop) continue;
      const prop = record.props?.find((p) => p.name === t.prop);
      if (!prop) problems.push(`${row.not}: ${t.component} has no prop ${t.prop}`);
      else if (t.value && !(prop.values ?? []).includes(t.value)) problems.push(`${row.not}: ${t.component}.${t.prop} does not accept ${t.value}`);
    }
  }
  return problems;
}

/** The component names `check:ads-language` bans: the rows marked retired, in table order. */
export function retiredComponents(inventions) {
  return inventions.components.filter((r) => r.retired).map((r) => r.not);
}

/** Old name → new, for a rename with no alias: the old name may not survive in doc prose either. */
export function renamedInProse(inventions) {
  return Object.fromEntries(inventions.components.filter((r) => r.retired && r.inProse).map((r) => [r.not, r.use[0]]));
}

/** `--space-025 (4px)`, `--radius-<n>`, `--size-element-*, --element-*` → name matchers. */
export function tokenMatchers(not) {
  return [...not.matchAll(/--[\w<>*-]+/g)].map(([glob]) => {
    const source = glob
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/<n>/g, '\\d+')
      .replace(/\*/g, '[\\w-]*');
    return new RegExp(`^${source}$`);
  });
}

/**
 * Hand-kept token rows that disagree with the plan, as messages: a row that
 * covers a retired name may offer only what the plan maps a covered name to.
 *
 * @param {{tokens: {not: string, use: string[]}[]}} inventions
 * @param {Map<string, string>} retired  the plan's retired name → replacement
 */
export function tokenRowConflicts(inventions, retired) {
  const problems = [];
  for (const row of inventions.tokens) {
    const matchers = tokenMatchers(row.not);
    const covered = [...retired].filter(([old]) => matchers.some((re) => re.test(old)));
    if (!covered.length) continue;
    const mapped = new Set(covered.map(([, replacement]) => replacement));
    for (const target of row.use) {
      if (!mapped.has(target)) problems.push(`${row.not}: ${target} is not what the plan maps any name it covers to`);
    }
  }
  return problems;
}

const show = (target) => {
  const t = parse(target);
  if (t.kind === 'token') return `\`${t.name}\``;
  if (t.value) return `\`${t.component} ${t.prop}="${t.value}"\``;
  return t.prop ? `\`${t.component} ${t.prop}\`` : `\`${t.component}\``;
};

/** The header table: what agents reach for, and what to write instead. */
export function renderInventions(inventions) {
  const row = (r) => `| ${r.not.startsWith('--') || /^[A-Z]/.test(r.not) ? `\`${r.not}\`` : r.not} | ${r.use.map(show).join(', ')}${r.why ? ` (${r.why})` : ''} |`;
  const table = (title, rows) => (rows.length ? `**${title}**\n\n| Not here | Use instead |\n|---|---|\n${rows.map(row).join('\n')}\n\n` : '');
  return (
    `## Not here → use instead\n\n` +
    `Names agents reach for that this system does not have, or has retired. Write the right-hand name.\n\n` +
    table('Components', inventions.components) +
    table('Props', inventions.props) +
    table('Tokens', inventions.tokens)
  );
}

/** The paragraph the index closes on: what to re-check before finishing. */
export function renderSelfCheck() {
  return (
    `## Before you finish\n\n` +
    `Re-read what you wrote, then fix each of these:\n\n` +
    `1. Every component and pattern comes from these lists, imported from its barrel (\`@/components\` or \`@/patterns\`); a deep path becomes the barrel import.\n` +
    `2. Every prop and value is in the component's generated doc (or \`components.json\`).\n` +
    `3. Every color, size, radius and font is a token from \`../tokens/tokens.md\`, read at the ladder step for its role, in place of a raw value or a \`--space-*\`, \`--radius-<n>\` or \`--palette-*\` primitive.\n` +
    `4. Every name in the tables above is replaced by its right-hand name.\n` +
    `5. A page or card starts from its pattern: a full page sits in a template (\`Frame\` with the PLUS \`Sidebar\`), and a section, card, table or overlay is its pattern from the Patterns table, before any \`div\` with its own flex or grid.\n\n` +
    `Then run \`npm run check:ds-usage -- <your files>\` and fix what it reports; its rules are \`docs/engineering/ds-usage-rules.md\`.\n`
  );
}
