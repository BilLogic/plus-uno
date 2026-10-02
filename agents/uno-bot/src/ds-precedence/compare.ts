// The weekly DS precedence check's comparison: where code and the Figma
// library disagree about a component, and which side the rule says loses.
//
// THE RULE, not uno-bot, picks the side. AGENTS.md's DS precedence on
// conflict is Storybook and code, then the BS4 Foundation library, then the
// Figma spec pages; the losing artifact gets an intake. This first cut reads
// two of the three — code and the library — so code always wins and the
// library always loses. `losingSide` keeps the whole order so a third source
// slots in without a second rule.
//
// SCOPE: component existence and variant axes only. Token values are left
// out, because token names are Enterprise-gated on the Figma REST API.
//   • Code: the generated component index (the existence law) and each
//     component's props as `component-registry.json` carries them, beside the
//     registry's mapping to Figma sets (`variantProps`, `codeDefaults`,
//     `variantValueMap`).
//   • Figma: the DS file's published components, grouped by component set;
//     a set's variant axes are read off its variants' names ("size=small, …").
//
// Three kinds of disagreement, each with the library losing:
//   • missing-in-figma — a component the index lists that resolves to no
//     published set, by the registry's node ids or names or by its own name;
//   • prop-as-sets — an enum prop in code that Figma splits into separate sets
//     (#339's Button: one `fill` prop, a set per fill);
//   • axis-values / missing-axis — an enum prop whose values a Figma axis
//     lacks or adds, or which no axis carries at all.
// A Figma set nothing in code maps to is NOT reported: #339 found most are
// internal parts, documentation sets or archived, and the registry has no
// marker telling those from a real gap, so every week would repeat them.
//
// A component a library publish is still carrying — a card the library
// tracker follows, or a change set waiting for its morning post — is left out:
// after a deliberate publish code follows the library, so the precedence rule
// is not the one that applies (`inFlightComponents`).
//
// Pure: no `Env`, no fetch. tests/ds-precedence.test.ts drives it over
// fixtures drawn from #339.

import type { FigmaComponentsResponse } from "../figma/client";
import { figmaNodeUrl, type LibraryChangeSet } from "../figma-library/draft";
import { namesInWords } from "../slack/copy-words";

/** The three DS sources, in precedence order: the first wins. */
export type DsSource = "code" | "library" | "spec-pages";
export const PRECEDENCE: readonly DsSource[] = ["code", "library", "spec-pages"];

/** How each source is named where a person reads it. */
export const SOURCE_NAMES: Record<DsSource, string> = {
  code: "Storybook and code",
  library: "BS4 Foundation library",
  "spec-pages": "Figma spec pages",
};

/** The side the precedence rule says loses a disagreement between two sources. */
export function losingSide(a: DsSource, b: DsSource): DsSource {
  return PRECEDENCE.indexOf(a) > PRECEDENCE.indexOf(b) ? a : b;
}

export type DisagreementKind = "missing-in-figma" | "prop-as-sets" | "axis-values" | "missing-axis";

/** One disagreement, as the thread and the intake list it. */
export interface Disagreement {
  /** Stable across weeks: component, prop and kind. */
  key: string;
  component: string;
  kind: DisagreementKind;
  /** What disagrees, in #886 § 3.4's register — "code has `size="xs"`, the
   *  library doesn't" — and without the component's name, which the list's
   *  item line and the intake's table each lead with. Markdown-safe; props and
   *  values in backticks. */
  summary: string;
  codeUrl: string;
  figmaUrl: string;
  winner: DsSource;
  loser: DsSource;
}

/** One entry of the component index. */
export interface IndexEntry {
  name: string;
  /** The component's generated doc, repo-relative. */
  docPath: string;
}

/** The slice of component-registry.json the check reads. */
export interface PrecedenceRegistry {
  components: Record<
    string,
    {
      code?: {
        mdxPath?: string;
        props?: Record<string, { type?: string; values?: string[] }>;
      };
      figma?: {
        sets?: Array<{
          name?: string;
          componentSetNodeId?: string;
          url?: string;
          status?: string | null;
          isComponentSet?: boolean;
          codeDefaults?: Record<string, unknown>;
          variantProps?: Record<string, unknown>;
          variantValueMap?: Record<string, Record<string, unknown>>;
        }>;
      };
    }
  >;
}

type RegistrySet = NonNullable<NonNullable<PrecedenceRegistry["components"][string]["figma"]>["sets"]>[number];

/** A published component set (or a standalone component) and its axes. */
export interface LiveSet {
  name: string;
  nodeId: string;
  /** Axis name → its values, as Figma spells them. Empty for a standalone. */
  axes: Record<string, string[]>;
}

/** The library as the check reads it. */
export interface LiveLibrary {
  sets: LiveSet[];
  /** Every node id a registry entry could point at: sets, components, frames. */
  nodeIds: string[];
}

/** The folder the index sits in; its links are relative to it. */
const INDEX_DIR = "design-system/agent-views/components/";
const INDEX_ENTRY = /^- \[([^\]]+)\]\(([^)]+)\)(.*)$/;
/** Registry sets that are not a component's Figma counterpart. */
const NOT_A_COUNTERPART = new Set(["docs-page", "no-code-equivalent"]);

/**
 * The index's entries — its bullet links — with the doc path resolved against
 * the index's own folder. An alias ("— alias of `X`") is the same component
 * under a second name, so it is left out.
 *
 * @param markdown - design-system/agent-views/components/index.md
 */
export function parseComponentIndex(markdown: string): IndexEntry[] {
  const entries: IndexEntry[] = [];
  for (const line of markdown.split("\n")) {
    const m = INDEX_ENTRY.exec(line.trim());
    if (!m || /alias of/i.test(m[3]!)) continue;
    entries.push({ name: m[1]!.trim(), docPath: resolvePath(INDEX_DIR, m[2]!.trim()) });
  }
  return entries;
}

function resolvePath(base: string, relative: string): string {
  const parts = base.split("/").filter(Boolean);
  for (const seg of relative.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg && seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

/** Variant props out of a variant's name, or null when it is not one. */
function variantProps(name: string): Record<string, string> | null {
  const props: Record<string, string> = {};
  for (const part of name.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) return null;
    props[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return props;
}

/**
 * The library out of a /components response: variants grouped by their set,
 * standalone components as sets of their own. Internal parts (`_`-prefixed)
 * are left out, as the library poll leaves them out.
 */
export function liveLibraryFrom(result: FigmaComponentsResponse): LiveLibrary {
  const sets = new Map<string, LiveSet>();
  const nodeIds = new Set<string>();
  for (const c of result.meta?.components ?? []) {
    nodeIds.add(c.node_id);
    if (c.containing_frame?.nodeId) nodeIds.add(c.containing_frame.nodeId);
    const set = c.containing_frame?.containingComponentSet;
    const name = (set?.name ?? c.name).trim();
    const nodeId = set?.nodeId ?? c.node_id;
    nodeIds.add(nodeId);
    if (name.startsWith("_")) continue;
    let live = sets.get(nodeId);
    if (!live) {
      live = { name, nodeId, axes: {} };
      sets.set(nodeId, live);
    }
    if (!set) continue;
    for (const [axis, value] of Object.entries(variantProps(c.name) ?? {})) {
      const values = (live.axes[axis] ??= []);
      if (!values.includes(value)) values.push(value);
    }
  }
  return { sets: [...sets.values()], nodeIds: [...nodeIds] };
}

const norm = (s: string) => s.trim().toLowerCase();
/** A value as both sides compare it: Figma's "(default)" marker dropped. */
const normValue = (s: string) => norm(s.replace(/\(default\)/i, ""));
/** A name as the loose existence match reads it: letters and digits only. */
const loose = (s: string) => norm(s).replace(/[^a-z0-9]/g, "").replace(/s$/, "");

interface Resolved {
  registrySet: RegistrySet;
  /** The live set, or null when the registry points at a frame or a
   *  standalone node that exists but carries no axes. */
  live: LiveSet | null;
}

function resolveSets(sets: readonly RegistrySet[], library: LiveLibrary): Resolved[] {
  const resolved: Resolved[] = [];
  for (const s of sets) {
    if (NOT_A_COUNTERPART.has(s.status ?? "")) continue;
    const id = s.componentSetNodeId;
    const byId = id ? library.sets.find((l) => l.nodeId === id) : undefined;
    const byName = s.name ? library.sets.find((l) => norm(l.name) === norm(s.name!)) : undefined;
    const live = byId ?? byName;
    if (live) resolved.push({ registrySet: s, live });
    else if (id && library.nodeIds.includes(id) && !(s.name ?? "").startsWith("_")) {
      resolved.push({ registrySet: s, live: null });
    }
  }
  return resolved;
}

/** The code prop a Figma axis carries: the registry's mapping, else the same name. */
function propOfAxis(s: RegistrySet, axis: string, props: readonly string[]): string | null {
  const mapped = Object.entries(s.variantProps ?? {}).find(([figma]) => norm(figma) === norm(axis));
  if (mapped) return typeof mapped[1] === "string" && props.includes(mapped[1]) ? mapped[1] : null;
  return props.find((p) => norm(p) === norm(axis)) ?? null;
}

/** A Figma value in code's words: the registry's value map, when it names one. */
function codeValueOf(s: RegistrySet, axis: string, value: string): string {
  const map = Object.entries(s.variantValueMap ?? {}).find(([a]) => norm(a) === norm(axis))?.[1];
  const hit = map ? Object.entries(map).find(([v]) => norm(v) === norm(value) || normValue(v) === normValue(value)) : undefined;
  return typeof hit?.[1] === "string" ? normValue(hit[1]) : normValue(value);
}

/**
 * How many indexed components the library has at all — by the registry's
 * sets, or by the component's own name — the count the check's floor is held
 * to. Sets the index does not list (icons, documentation, parts) do not count,
 * so a library answering only those cannot pass for a real one.
 */
export function indexedInLibrary(index: readonly IndexEntry[], registry: PrecedenceRegistry, library: LiveLibrary): number {
  return index.filter(
    (entry) =>
      resolveSets(registry.components?.[entry.name]?.figma?.sets ?? [], library).length > 0 ||
      library.sets.some((l) => loose(l.name) === loose(entry.name)),
  ).length;
}

const ticked = (xs: readonly string[]) => xs.map((x) => `\`${x}\``).join(", ");
/** Values as props a person reads them: `size="xs"` and `size="xl"`. */
const propValues = (prop: string, values: readonly string[]) => namesInWords(values.map((v) => `\`${prop}="${v}"\``));

export interface CompareInput {
  index: readonly IndexEntry[];
  registry: PrecedenceRegistry;
  library: LiveLibrary;
  fileKey: string;
  repo: string;
  /** Components a library publish is still carrying; left out. */
  inFlight: ReadonlySet<string>;
}

/**
 * Every disagreement between code and the library, in index order.
 *
 * @param input - The index, the registry, the library and the context
 */
export function findDisagreements(input: CompareInput): Disagreement[] {
  const { index, registry, library, fileKey, repo, inFlight } = input;
  const found: Disagreement[] = [];
  const winner: DsSource = "code";
  const loser = losingSide("code", "library");
  for (const entry of index) {
    if (inFlight.has(entry.name)) continue;
    const reg = registry.components?.[entry.name];
    const resolved = resolveSets(reg?.figma?.sets ?? [], library);
    const codeUrl = `https://github.com/${repo}/blob/main/${entry.docPath}`;
    const setUrl = (r: Resolved) =>
      r.registrySet.url ?? figmaNodeUrl(fileKey, r.live?.nodeId ?? r.registrySet.componentSetNodeId ?? "0:1");
    const report = (kind: DisagreementKind, prop: string, summary: string, figmaUrl: string) =>
      found.push({ key: `${entry.name}:${prop}:${kind}`, component: entry.name, kind, summary, codeUrl, figmaUrl, winner, loser });

    if (!resolved.length) {
      const byName = library.sets.find((l) => loose(l.name) === loose(entry.name));
      if (!byName) {
        report(
          "missing-in-figma",
          "",
          "code has it, the library has no published component for it",
          `https://www.figma.com/design/${fileKey}`,
        );
      }
      continue;
    }

    const props = Object.entries(reg?.code?.props ?? {});
    const propNames = props.map(([p]) => p);
    const withAxes = resolved.filter((r) => r.live && Object.keys(r.live.axes).length);
    for (const [prop, def] of props) {
      if (def.type !== "enum" || !def.values?.length) continue;
      const codeValues = def.values.map(normValue);
      const figmaValues = new Set<string>();
      let carried = false;
      for (const r of withAxes) {
        for (const [axis, values] of Object.entries(r.live!.axes)) {
          if (propOfAxis(r.registrySet, axis, propNames) !== prop) continue;
          carried = true;
          for (const v of values) figmaValues.add(codeValueOf(r.registrySet, axis, v));
        }
      }
      const pinned = resolved.filter((r) => typeof r.registrySet.codeDefaults?.[prop] === "string");
      const pinnedValues = [...new Set(pinned.map((r) => normValue(String(r.registrySet.codeDefaults![prop]))))];
      const firstUrl = setUrl(pinned[0] ?? withAxes[0] ?? resolved[0]!);

      if (!carried && pinnedValues.length >= 2) {
        const uncovered = codeValues.filter((v) => !pinnedValues.includes(v));
        const sets = [...new Set(pinned.map((r) => r.live?.name ?? r.registrySet.name ?? "?"))];
        report(
          "prop-as-sets",
          prop,
          `code has one \`${prop}\` prop (${ticked(codeValues)}), the library splits it into ` +
            `${sets.length} components: ${namesInWords(sets)}` +
            (uncovered.length ? `; ${ticked(uncovered)} ${uncovered.length === 1 ? "has" : "have"} no component` : ""),
          firstUrl,
        );
        continue;
      }
      if (!carried && pinnedValues.length === 1) pinnedValues.forEach((v) => figmaValues.add(v));
      if (carried || pinnedValues.length === 1) {
        const lacks = codeValues.filter((v) => !figmaValues.has(v));
        const adds = [...figmaValues].filter((v) => !codeValues.includes(v));
        if (lacks.length || adds.length) {
          report(
            "axis-values",
            prop,
            [
              lacks.length ? `code has ${propValues(prop, lacks)}, the library doesn't` : "",
              adds.length ? `the library has ${propValues(prop, adds)}, code doesn't` : "",
            ]
              .filter(Boolean)
              .join("; "),
            firstUrl,
          );
        }
        continue;
      }
      if (withAxes.length) {
        report(
          "missing-axis",
          prop,
          `code has a \`${prop}\` prop (${ticked(codeValues)}), and no variant in the library carries it`,
          setUrl(withAxes[0]!),
        );
      }
    }
  }
  return found;
}

/**
 * The components a library publish is still carrying: those a tracked card
 * dispatched, and those a change set waiting for its morning post touches,
 * mapped through the registry by set node id or name.
 *
 * @param tracked - The library tracker's cards (`implement` is a name list)
 * @param findings - Change sets waiting for the morning post
 * @param registry - component-registry.json
 */
export function inFlightComponents(
  tracked: ReadonlyArray<{ implement: string | null }>,
  findings: ReadonlyArray<Pick<LibraryChangeSet, "created" | "modified" | "deleted">>,
  registry: PrecedenceRegistry,
): Set<string> {
  const names = new Set<string>();
  for (const t of tracked) {
    for (const name of (t.implement ?? "").split(",")) if (name.trim()) names.add(name.trim());
  }
  const entries = Object.entries(registry.components ?? {});
  for (const changeSet of findings) {
    for (const c of [...changeSet.created, ...changeSet.modified, ...changeSet.deleted]) {
      const hit = entries.find(([, e]) =>
        (e.figma?.sets ?? []).some(
          (s) => (c.setNodeId && s.componentSetNodeId === c.setNodeId) || norm(s.name ?? "") === norm(c.containingFrame),
        ),
      );
      if (hit) names.add(hit[0]);
    }
  }
  return names;
}
