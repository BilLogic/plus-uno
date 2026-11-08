// The design-system facts, read in-process: what the system has, what it
// calls things, and what it does not have.
//
// The facts are the root facts module's (`scripts/lib/ds-facts.mjs`), baked
// at deploy (`scripts/generate-ds-facts.mjs`), and this lookup answers as that
// module does for the same name — `tests/ds-facts.test.ts` holds the two to
// each other. So "does PLUS have a card?" is `PatternCard` with its import in
// Slack as it is in the IDE, and answering it fetches nothing.
//
// Every answer carries a `status` — `exists`, `not-here`, `retired` or
// `unknown` — so a missing name is answered, never thrown on.
//
// PURE.

import { DS_FACTS } from "../generated/ds-facts";

/** A prop as baked: the facts module's, less its description. */
export interface BakedProp {
  name: string;
  type?: string;
  values?: string[];
  default?: string;
  required?: true;
  deprecated?: { replacement?: string };
}

/** A component, pattern or `PageLayout` as baked: the facts module's answer for it. */
export interface BakedComponent {
  name: string;
  kind?: string;
  import?: string;
  group?: string;
  source?: string;
  /** The component's generated doc, repo-relative; components only. */
  doc?: string;
  summary?: string;
  aliasOf?: string;
  props?: BakedProp[];
}

/** A hand-kept row of a name that is not here, and what to use instead. */
export interface BakedNotHere {
  not: string;
  use: string[];
  why?: string;
}

/** The whole bake. */
export interface BakedDsFacts {
  components: BakedComponent[];
  /** Every name each public barrel makes importable, by its specifier. */
  barrels: Record<string, string[]>;
  tokenGroups: string[];
  /** `[name, tier, index into tokenGroups, value, intent]`. */
  tokens: Array<[string, string, number, string, string | null]>;
  inventions: { components: BakedNotHere[]; props: BakedNotHere[]; tokens: BakedNotHere[] };
  /** Retired token name → its replacement. */
  retired: Array<[string, string]>;
}

export type DsStatus = "exists" | "not-here" | "retired" | "unknown";

export interface DsPropRecord {
  name: string;
  type: string | null;
  required: boolean;
  default: string | null;
  values: string[] | null;
  description: null;
  deprecated: { replacement?: string } | null;
}

/** A component, pattern or export answer: the facts module's shape. */
export interface DsAnswer {
  name: string;
  status: DsStatus;
  kind: string | null;
  import: string | null;
  group: string | null;
  source: string | null;
  summary: string | null;
  props: DsPropRecord[] | null;
  aliasOf: string | null;
  replacement: string[];
  why: string | null;
}

/** A prop answer (`Button.appearance`, `Button.appearance=primary`). */
export interface DsPropAnswer {
  name: string;
  status: DsStatus;
  kind: "prop";
  component: string;
  type: string | null;
  values: string[] | null;
  default: string | null;
  required: boolean | null;
  description: null;
  deprecated: { replacement?: string } | null;
  replacement: string[];
  why: string | null;
}

export interface DsToken {
  name: string;
  status: DsStatus;
  tier: string | null;
  group: string | null;
  value: string | null;
  intent: string | null;
  replacement: string[];
  why: string | null;
}

export interface DsNotHereRow {
  not: string;
  kind: "component" | "prop" | "token";
  use: string[];
  why: string | null;
}

/** What `find` hands the model: the answer, what to use instead, and near names on a miss. */
export interface DsFound {
  answer: DsAnswer | DsPropAnswer;
  /** The answer's replacements, each looked up, so a not-here name arrives with its import. */
  use: Array<DsAnswer | DsPropAnswer>;
  /** On a miss, known names that contain the query, components and patterns first: at most `NEAR_LIMIT`. */
  near: string[];
}

export interface DsFacts {
  lookup(name: string): DsAnswer | DsPropAnswer;
  find(query: string): DsFound;
  tokens(query: string): DsToken[];
  notHere(): DsNotHereRow[];
}

/** One entry of the component index, as the precedence check reads it. */
export interface IndexEntry {
  name: string;
  /** The component's generated doc, repo-relative. */
  docPath: string;
}

const COMPONENTS_BARREL = "@/components";
const NEAR_LIMIT = 10;

/** The facts module's `tokenMatchers`: `--radius-<n>`, `--color-surface-container*`. */
function tokenMatchers(not: string): RegExp[] {
  return [...not.matchAll(/--[\w<>*-]+/g)].map(([glob]) => {
    const source = glob
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/<n>/g, "\\d+")
      .replace(/\*/g, "[\\w-]*");
    return new RegExp(`^${source}$`);
  });
}

/** `Button variant`, `Button appearance="secondary"`, `Heading size="sm" / "lg"` → its parts. */
function parsePropRow(not: string): { component: string; prop: string; values: string[] } | null {
  const m = not.match(/^(\w+)\s+(\w+)(.*)$/);
  if (!m) return null;
  return { component: m[1]!, prop: m[2]!, values: [...m[3]!.matchAll(/"([^"]+)"/g)].map((v) => v[1]!) };
}

const importLine = (name: string, from: string) => `import { ${name} } from '${from}';`;

function propRecord(p: BakedProp): DsPropRecord {
  return {
    name: p.name,
    type: p.type ?? null,
    required: p.required === true,
    default: p.default ?? null,
    values: p.values ?? null,
    description: null,
    deprecated: p.deprecated ?? null,
  };
}

/**
 * The facts over a bake.
 *
 * @param baked - The bake; the default is the one deployed
 */
export function dsFacts(baked: BakedDsFacts = DS_FACTS): DsFacts {
  const records = new Map(baked.components.map((c) => [c.name, c]));
  const barrelNames = Object.entries(baked.barrels).map(([spec, names]) => [spec, new Set(names)] as const);
  const inventedComponents = new Map(baked.inventions.components.map((r) => [r.not, r]));
  const inventedProps = baked.inventions.props.flatMap((row) => {
    const parsed = parsePropRow(row.not);
    return parsed ? [{ row, ...parsed }] : [];
  });
  const inventedTokens = baked.inventions.tokens.map((row) => ({ row, matchers: tokenMatchers(row.not) }));
  const retired = new Map(baked.retired);
  const note = (row: BakedNotHere | undefined) => (row ? { replacement: [...row.use], why: row.why ?? null } : {});

  const answer = (name: string, status: DsStatus, fields: Partial<DsAnswer> = {}): DsAnswer => ({
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

  function lookupName(name: string): DsAnswer {
    const invented = inventedComponents.get(name);
    const record = records.get(name);
    if (record) {
      return answer(name, "exists", {
        kind: record.kind ?? "component",
        import: record.import ?? null,
        group: record.group ?? null,
        source: record.source ?? null,
        summary: record.summary ?? null,
        props: record.props ? record.props.map(propRecord) : null,
        aliasOf: record.aliasOf ?? null,
        ...note(invented),
      });
    }
    const from = barrelNames.find(([, names]) => names.has(name))?.[0];
    if (from) return answer(name, "exists", { kind: "export", import: importLine(name, from), ...note(invented) });
    if (invented) return answer(name, "not-here", note(invented));
    return answer(name, "unknown");
  }

  function lookupProp(name: string): DsPropAnswer {
    const [target = "", value = null] = name.split("=");
    const [component = "", propName = ""] = target.split(".");
    const owner = lookupName(component);
    const prop = owner.status === "exists" ? (owner.props ?? []).find((p) => p.name === propName) : undefined;
    const invented = inventedProps.find(
      (r) => r.component === component && r.prop === propName && (value === null ? r.values.length === 0 : r.values.includes(value)),
    );
    const base = {
      kind: "prop" as const,
      component,
      type: prop?.type ?? null,
      values: prop?.values ?? null,
      default: prop?.default ?? null,
      required: prop?.required ?? null,
      description: null,
      deprecated: prop?.deprecated ?? null,
      replacement: [] as string[],
      why: null as string | null,
    };
    const accepted = prop && (value === null || prop.values === null || prop.values.includes(value));
    if (accepted) {
      const replacement = prop.deprecated?.replacement;
      return { name, status: "exists", ...base, replacement: replacement ? [replacement.includes(".") ? replacement : `${component}.${replacement}`] : [] };
    }
    if (invented) return { name, status: "not-here", ...base, replacement: [...invented.row.use], why: invented.row.why ?? null };
    return { name, status: "unknown", ...base };
  }

  const lookup = (name: string) => (name.includes(".") ? lookupProp(name) : lookupName(name));

  /** Every name a lookup can answer `exists` or `not-here` for. */
  const known = (): string[] => [...new Set([...records.keys(), ...barrelNames.flatMap(([, names]) => [...names]), ...inventedComponents.keys()])];

  return {
    lookup,

    /**
     * A name as a person asks it: exact, then in any case (`card` → `Card`).
     * A not-here answer arrives with each replacement looked up, and a miss
     * with the known names that contain the query.
     */
    find(query) {
      const q = query.trim();
      let found = lookup(q);
      if (found.status === "unknown" && !q.includes(".")) {
        const lower = q.toLowerCase();
        const sameName = known()
          .filter((n) => n.toLowerCase() === lower)
          .sort((a, b) => Number(records.has(b)) - Number(records.has(a)))[0];
        if (sameName) found = lookup(sameName);
      }
      const use = found.replacement.map((r) => lookup(r));
      const lower = q.toLowerCase();
      const near =
        found.status === "unknown" && lower
          ? known()
              .filter((n) => n.toLowerCase().includes(lower))
              // Components and patterns before other exports, then the closest by length.
              .sort((a, b) => Number(records.has(b)) - Number(records.has(a)) || a.length - b.length || (a < b ? -1 : a > b ? 1 : 0))
              .slice(0, NEAR_LIMIT)
          : [];
      return { answer: found, use, near };
    },

    tokens(query) {
      const token = (t: BakedDsFacts["tokens"][number], extra: Partial<DsToken> = {}): DsToken => ({
        name: t[0],
        status: "exists",
        tier: t[1],
        group: baked.tokenGroups[t[2]] ?? null,
        value: t[3],
        intent: t[4] ?? null,
        replacement: [],
        why: null,
        ...extra,
      });
      if (query.startsWith("--")) {
        const invented = inventedTokens.find((r) => r.matchers.some((re) => re.test(query)))?.row;
        const record = baked.tokens.find((t) => t[0] === query);
        if (record) return [token(record, note(invented))];
        const empty = { name: query, tier: null, group: null, value: null, intent: null };
        if (retired.has(query)) return [{ ...empty, status: "retired", replacement: [retired.get(query)!], why: null }];
        if (invented) return [{ ...empty, status: "not-here", replacement: [...invented.use], why: invented.why ?? null }];
        return [];
      }
      const role = query.toLowerCase();
      return baked.tokens
        .filter((t) => t[0] === `--${role}` || t[0].startsWith(`--${role}-`) || (baked.tokenGroups[t[2]] ?? "").toLowerCase() === role)
        .map((t) => token(t));
    },

    notHere() {
      const rows: DsNotHereRow[] = [];
      for (const [section, kind] of [["components", "component"], ["props", "prop"], ["tokens", "token"]] as const) {
        for (const r of baked.inventions[section]) rows.push({ not: r.not, kind, use: [...r.use], why: r.why ?? null });
      }
      for (const [not, use] of retired) rows.push({ not, kind: "token", use: [use], why: null });
      return rows;
    },
  };
}

/**
 * The components the weekly precedence check compares with the Figma library:
 * each component with a generated doc, by name, in name order. An alias is
 * the same component under a second name, so it is left out; patterns have
 * their Storybook page and no generated doc, so they are not in it.
 *
 * @param baked - The bake; the default is the one deployed
 */
export function precedenceIndex(baked: BakedDsFacts = DS_FACTS): IndexEntry[] {
  const fromComponents = new Set(baked.barrels[COMPONENTS_BARREL] ?? []);
  return baked.components
    .filter((c) => (c.kind ?? "component") === "component" && c.doc && !c.aliasOf && fromComponents.has(c.name))
    .map((c) => ({ name: c.name, docPath: c.doc! }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
