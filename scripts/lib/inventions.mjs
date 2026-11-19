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
 * @param {{components: object[], props: object[], tokens: object[], words?: object[], spellings?: object[], outside?: object[], concepts?: string[]}} inventions
 *   a words, spellings or outside row may also point at a named concept (`concepts`, e.g. Blanket) that is no component
 * @param {{components: {name: string, props: {name: string, values: string[]|null}[]|null}[]}} components
 * @param {{tokens: {name: string}[]}} tokens
 * @param {string[]} [templates]  template names (`_templates.json`), valid as a whole-name target
 */
export function checkInventions(inventions, components, tokens, templates = []) {
  const byName = new Map(components.components.map((c) => [c.name, c]));
  const templateNames = new Set(templates);
  const tokenNames = new Set(tokens.tokens.map((t) => t.name));
  const problems = [];
  const concepts = new Set(inventions.concepts ?? []);
  const rows = [...inventions.components, ...inventions.props, ...inventions.tokens, ...(inventions.words ?? []), ...(inventions.spellings ?? []), ...(inventions.outside ?? [])];
  for (const row of rows) {
    for (const target of row.use) {
      if (concepts.has(target)) continue;
      const t = parse(target);
      if (t.kind === 'token') {
        if (!tokenNames.has(t.name)) problems.push(`${row.not}: ${target} is not in tokens.json`);
        continue;
      }
      if (!t.prop && templateNames.has(t.component)) continue;
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

/** A target as shown; `own` is the component a props row is about, whose name a same-component target leaves off. */
const show = (target, own = null) => {
  const t = parse(target);
  if (t.kind === 'token') return `\`${t.name}\``;
  const name = t.prop && t.component === own ? '' : `${t.component} `;
  if (t.value) return `\`${name}${t.prop}="${t.value}"\``;
  return t.prop ? `\`${name}${t.prop}\`` : `\`${t.component}\``;
};

/** The header table: what agents reach for, and what to write instead. */
export function renderInventions(inventions) {
  const row = (r, own) => `| ${r.not.startsWith('--') || /^[A-Z]/.test(r.not) ? `\`${r.not}\`` : r.not} | ${r.use.map((u) => show(u, own ? r.not.split(' ')[0] : null)).join(', ')}${r.why ? ` (${r.why})` : ''} |`;
  const table = (title, rows, own = false) => (rows.length ? `**${title}**\n\n| Not here | Use instead |\n|---|---|\n${rows.map((r) => row(r, own)).join('\n')}\n\n` : '');
  return (
    `## Not here → use instead\n\n` +
    `Names agents reach for that this system does not have, or has retired. Write the right-hand name.\n\n` +
    table('Components', inventions.components) +
    table('Props (same component)', inventions.props, true) +
    table('Tokens', inventions.tokens)
  );
}

/** The paragraph the index closes on: what to re-check before finishing. */
export function renderSelfCheck() {
  return (
    `## Before you finish\n\n` +
    `Re-read what you wrote for template and pattern fit: a full page sits in a template (\`Frame\` with the PLUS \`Sidebar\` and \`Page\`), each section, card, table or overlay uses its template from the Templates table above, and each situation (filtering, search, forms, common actions, notifications, empty, loading, errors) follows its governing pattern.\n\n` +
    `Then run \`npm run check:ds-usage -- <your files>\` and fix what it reports; its rules are \`docs/engineering/ds-usage-rules.md\`.\n`
  );
}
