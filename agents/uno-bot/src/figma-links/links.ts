// Which Dev Mode links each registry component should carry, and which of
// them a node still lacks (#891 § C).
//
// THE TARGETS come from `design-system/figma/component-registry.json` alone,
// so nothing is guessed: a component it maps, on each of its library
// components the registry marks verified (or leaves unmarked) — never a docs
// page, a set with no code equivalent, or one not yet published. Its Code link
// opens the source file the registry names, on GitHub; its Storybook link the
// docs page whose id the registry carries, as Storybook derives it from the
// stories file's title.
//
// THE NAMES are plain — `Code: Button`, `Storybook: Button`, `PR #123: Button`
// — with no bot marker (Bill, 2026-10-11): only uno-bot writes these links.
//
// THE PLAN is what a node still lacks: a link whose URL or name the node
// already carries is left out, and a node takes 10 links at most, so what
// would cross that is held back and named. The same plan runs when a card is
// drawn and again when Approve writes, so a re-run never adds a duplicate.
//
// PURE.

import type { FigmaDevResource } from "../figma/client";

/** Figma's limit: Dev Mode links on one node. */
export const MAX_LINKS_PER_NODE = 10;

/** Where the live Storybook's docs pages are opened. */
export const STORYBOOK_BASE = "https://plus-uno.netlify.app/storybook/";

/** The slice of component-registry.json the links read. */
export interface DevLinkRegistry {
  components: Record<
    string,
    {
      code?: { source?: string; storybookId?: string };
      figma?: {
        fileKey?: string;
        sets?: ReadonlyArray<{ componentSetNodeId?: string; status?: string | null; url?: string }>;
      };
    }
  >;
}

/** A set's statuses that are not a library component with code to link. */
const NOT_LINKED = new Set(["docs-page", "no-code-equivalent", "unpublished"]);

/** One component as the links see it. */
export interface DevLinkTarget {
  component: string;
  fileKey: string;
  /** Its library components, each once. */
  nodeIds: string[];
  /** Where the card's Open goes: its first library component. */
  figmaUrl: string;
  code: string | null;
  storybook: string | null;
}

/** A link to write, as Figma's API takes it. */
export interface DevLink {
  file_key: string;
  node_id: string;
  name: string;
  url: string;
}

/** A Figma link to one node of a file. */
export function figmaNodeUrl(fileKey: string, nodeId: string): string {
  return `https://www.figma.com/design/${encodeURIComponent(fileKey)}?node-id=${encodeURIComponent(nodeId.replace(":", "-"))}`;
}

/**
 * Each registry component with somewhere to put links, by name.
 *
 * @param registry - component-registry.json
 * @param repo - `owner/name`: the repo the source files are in
 */
export function devLinkTargets(registry: DevLinkRegistry, repo: string): Map<string, DevLinkTarget> {
  const targets = new Map<string, DevLinkTarget>();
  for (const [component, entry] of Object.entries(registry.components ?? {})) {
    const fileKey = entry.figma?.fileKey;
    const sets = (entry.figma?.sets ?? []).filter((s) => s.componentSetNodeId && !NOT_LINKED.has(s.status ?? ""));
    const nodeIds = [...new Set(sets.map((s) => s.componentSetNodeId!))];
    if (!fileKey || !nodeIds.length) continue;
    const source = entry.code?.source;
    const storybookId = entry.code?.storybookId;
    targets.set(component, {
      component,
      fileKey,
      nodeIds,
      figmaUrl: sets[0]!.url ?? figmaNodeUrl(fileKey, nodeIds[0]!),
      code: source ? `https://github.com/${repo}/blob/main/${source.split("/").map(encodeURIComponent).join("/")}` : null,
      storybook: storybookId ? `${STORYBOOK_BASE}?path=/docs/${storybookId}` : null,
    });
  }
  return targets;
}

/** What a link is: the component's source, its docs page, or a merged PR. */
export type DevLinkKind = { kind: "code" } | { kind: "storybook" } | { kind: "pr"; number: number; url: string };

/** A link's name, plain. */
export function devLinkName(component: string, link: DevLinkKind): string {
  switch (link.kind) {
    case "code":
      return `Code: ${component}`;
    case "storybook":
      return `Storybook: ${component}`;
    case "pr":
      return `PR #${link.number}: ${component}`;
  }
}

/**
 * The links a component wants on each of its library components.
 *
 * @param target - The component
 * @param kinds - Which links
 */
export function wantedLinks(target: DevLinkTarget, kinds: readonly DevLinkKind[]): DevLink[] {
  return target.nodeIds.flatMap((node) =>
    kinds.flatMap((k) => {
      const url = k.kind === "code" ? target.code : k.kind === "storybook" ? target.storybook : k.url;
      return url ? [{ file_key: target.fileKey, node_id: node, name: devLinkName(target.component, k), url }] : [];
    }),
  );
}

/** What a node still lacks, and what its 10 hold back. */
export interface DevLinkPlan {
  add: DevLink[];
  /** Links left out because the node already has them, by URL or name. */
  present: DevLink[];
  /** Links held back because their node would pass 10. */
  full: DevLink[];
}

/**
 * The links to add, given what the nodes already carry.
 *
 * @param wanted - The links asked for
 * @param existing - The Dev Mode links already on those nodes
 */
export function planDevLinks(wanted: readonly DevLink[], existing: readonly FigmaDevResource[]): DevLinkPlan {
  const on = new Map<string, Array<{ name: string; url: string }>>();
  const key = (l: { file_key: string; node_id: string }) => `${l.file_key}|${l.node_id}`;
  for (const r of existing) on.set(key(r), [...(on.get(key(r)) ?? []), { name: r.name, url: r.url }]);
  const plan: DevLinkPlan = { add: [], present: [], full: [] };
  for (const link of wanted) {
    const node = on.get(key(link)) ?? [];
    if (node.some((r) => r.url === link.url || r.name === link.name)) plan.present.push(link);
    else if (node.length >= MAX_LINKS_PER_NODE) plan.full.push(link);
    else {
      plan.add.push(link);
      on.set(key(link), [...node, { name: link.name, url: link.url }]);
    }
  }
  return plan;
}

/**
 * Whether a component has had its links before: any node of its carries its
 * Code or Storybook link. The first time it has not, Approve leaves a comment.
 */
export function linkedBefore(component: string, existing: readonly FigmaDevResource[], nodeIds: readonly string[]): boolean {
  const names = new Set([devLinkName(component, { kind: "code" }), devLinkName(component, { kind: "storybook" })]);
  return existing.some((r) => nodeIds.includes(r.node_id) && names.has(r.name));
}
