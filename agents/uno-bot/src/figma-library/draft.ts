// A Figma library publish, drafted: the one `harness-intake` issue it becomes,
// and the summary the #plus-universal card leads with.
//
// The intake is the spec — the Notion PRD the poll used to file is gone — so it
// is written to be run by a human or an agent as it stands: per changed
// component, its Figma link, the code it maps to, and the proposed change. The
// mapping comes from `design-system/figma/component-registry.json` and from
// nowhere else. A component the registry does not map is listed as "no code
// mapping" and nothing is drafted for it: a guessed path is worse than a gap,
// because someone would follow it.
//
// Pure: no `Env`, no fetch. The registry arrives as data (the post job reads it
// from GitHub), so tests/figma-library.test.ts drafts from a recorded diff.

import { escapeSlackText } from "../slack/mrkdwn";

/** A component as the poll keeps it in its snapshot. */
export interface LibraryComponent {
  key: string;
  name: string;
  description: string;
  nodeId: string;
  /** The component set's name for a variant, else the containing frame's. */
  containingFrame: string;
  /** The component set's node id, when Figma named one. */
  setNodeId?: string;
}

/** A published version: a publish, not an autosave. */
export interface PublishedVersion {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  /** The publisher's Figma handle. */
  user: string;
}

/** What one poll found changed since the last one. */
export interface LibraryChangeSet {
  detectedAt: string;
  fileKey: string;
  /** New published versions, newest first. */
  versions: PublishedVersion[];
  created: LibraryComponent[];
  /** Each as it now reads. */
  modified: LibraryComponent[];
  deleted: LibraryComponent[];
}

/** The slice of component-registry.json the draft reads. */
export interface ComponentRegistry {
  components: Record<
    string,
    {
      code?: { mdxPath?: string };
      figma?: { sets?: Array<{ name?: string; componentSetNodeId?: string; url?: string }> };
    }
  >;
}

/** One changed component (a set, with its variants), as the intake lists it. */
export interface IntakeRow {
  /** The Figma set or component name. */
  figmaName: string;
  figmaUrl: string;
  /** The registry's component and its directory; null is "no code mapping". */
  code: { name: string; dir: string } | null;
  created: string[];
  modified: string[];
  deleted: string[];
  /** The proposed change, or the plain statement that none is drafted. */
  proposal: string;
}

/** The drafted intake. */
export interface PublishIntake {
  /** The publish's identity: the newest version id, else the detection time. */
  key: string;
  /** The Figma version a dispatch carries; absent when no version was
   *  published (a metadata change), and then nothing is dispatched. */
  versionId?: string;
  /** A hidden line in the body that finds this issue again. */
  marker: string;
  title: string;
  body: string;
  rows: IntakeRow[];
  /** The registry names a ✅ implements, sorted — every mapped row. */
  implement: string[];
  /** Figma names with no code mapping. */
  unmapped: string[];
}

const LIST_CAP = 6;
const NO_MAPPING = "no code mapping";

/** The hidden marker the tracker finds an intake by. */
export function publishMarker(key: string): string {
  return `<!-- uno-bot:figma-publish:${key} -->`;
}

/** Who published: the newest version's author, or null for a metadata change. */
export function publisherOf(changeSet: LibraryChangeSet): string | null {
  return changeSet.versions[0]?.user ?? null;
}

/** A node link in the DS file. */
export function figmaNodeUrl(fileKey: string, nodeId: string): string {
  return `https://www.figma.com/design/${fileKey}?node-id=${nodeId.replace(/:/g, "-")}`;
}

function versionUrl(fileKey: string, versionId: string): string {
  return `https://www.figma.com/design/${fileKey}?version-id=${versionId}`;
}

/** Names, capped: "A, B, C (+4 more)". */
function listed(names: readonly string[]): string {
  const unique = [...new Set(names)];
  return unique.length > LIST_CAP
    ? `${unique.slice(0, LIST_CAP).join(", ")} (+${unique.length - LIST_CAP} more)`
    : unique.join(", ");
}

interface Group {
  figmaName: string;
  setNodeId?: string;
  firstNodeId: string;
  created: string[];
  modified: string[];
  deleted: string[];
}

/** The change set by component set: variants of one set are one row. */
function groupsOf(changeSet: LibraryChangeSet): Group[] {
  const groups = new Map<string, Group>();
  const add = (c: LibraryComponent, kind: "created" | "modified" | "deleted") => {
    const figmaName = c.containingFrame || c.name;
    const id = c.setNodeId ?? `name:${figmaName.toLowerCase()}`;
    let group = groups.get(id);
    if (!group) {
      group = {
        figmaName,
        ...(c.setNodeId ? { setNodeId: c.setNodeId } : {}),
        firstNodeId: c.nodeId,
        created: [],
        modified: [],
        deleted: [],
      };
      groups.set(id, group);
    }
    group[kind].push(c.name);
  };
  for (const c of changeSet.created) add(c, "created");
  for (const c of changeSet.modified) add(c, "modified");
  for (const c of changeSet.deleted) add(c, "deleted");
  return [...groups.values()].sort((a, b) => a.figmaName.localeCompare(b.figmaName));
}

/**
 * The registry entry a group maps to: by the set's node id, then by the set's
 * name against a registry set's name or the registry's own component name —
 * case-insensitive, and nothing looser. No match is null.
 */
function mappingOf(
  group: Group,
  registry: ComponentRegistry,
): { name: string; dir: string; url?: string } | null {
  const entries = Object.entries(registry.components ?? {});
  const wanted = group.figmaName.trim().toLowerCase();
  const hit =
    (group.setNodeId
      ? entries.find(([, e]) => (e.figma?.sets ?? []).some((s) => s.componentSetNodeId === group.setNodeId))
      : undefined) ??
    entries.find(
      ([name, e]) =>
        name.toLowerCase() === wanted ||
        (e.figma?.sets ?? []).some((s) => (s.name ?? "").trim().toLowerCase() === wanted),
    );
  if (!hit) return null;
  const [name, entry] = hit;
  const mdxPath = entry.code?.mdxPath;
  if (!mdxPath) return null;
  const dir = mdxPath.slice(0, mdxPath.lastIndexOf("/") + 1);
  const set = (entry.figma?.sets ?? []).find(
    (s) => s.componentSetNodeId === group.setNodeId || (s.name ?? "").trim().toLowerCase() === wanted,
  );
  return { name, dir, ...(set?.url ? { url: set.url } : {}) };
}

function proposalFor(group: Group, code: { name: string; dir: string } | null): string {
  if (!code) {
    return (
      `${NO_MAPPING}: \`component-registry.json\` maps no code to this component, so no change is drafted. ` +
      "Map it (the component MDX's `figmaMeta`) or confirm it is Figma-only."
    );
  }
  const where = `\`${code.name}\` (\`${code.dir}\`)`;
  const parts: string[] = [];
  if (group.created.length) parts.push(`add the new variant(s) ${listed(group.created)} to ${where}`);
  if (group.modified.length) parts.push(`update ${where} to match the published ${listed(group.modified)}`);
  if (group.deleted.length) parts.push(`remove or deprecate ${listed(group.deleted)} in ${where}, deleted from Figma`);
  const sentence = parts.join("; ");
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

function changeCell(row: Pick<IntakeRow, "created" | "modified" | "deleted">): string {
  const cells: string[] = [];
  const n = (xs: string[]) => `${xs.length} variant${xs.length === 1 ? "" : "s"}`;
  if (row.created.length) cells.push(`new: ${n(row.created)}`);
  if (row.modified.length) cells.push(`modified: ${n(row.modified)}`);
  if (row.deleted.length) cells.push(`deleted: ${n(row.deleted)}`);
  return cells.join(", ");
}

/** A Markdown table cell: pipes and newlines would break the row. */
function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

/**
 * The one intake a publish becomes.
 *
 * @param changeSet - What the poll found
 * @param registry - component-registry.json, as read at posting time
 */
export function draftPublishIntake(changeSet: LibraryChangeSet, registry: ComponentRegistry): PublishIntake {
  const newest = changeSet.versions[0];
  const key = newest?.id ?? `meta-${changeSet.detectedAt}`;
  const marker = publishMarker(key);
  const rows: IntakeRow[] = groupsOf(changeSet).map((group) => {
    const mapped = mappingOf(group, registry);
    const code = mapped ? { name: mapped.name, dir: mapped.dir } : null;
    return {
      figmaName: group.figmaName,
      figmaUrl: mapped?.url ?? figmaNodeUrl(changeSet.fileKey, group.setNodeId ?? group.firstNodeId),
      code,
      created: group.created,
      modified: group.modified,
      deleted: group.deleted,
      proposal: proposalFor(group, code),
    };
  });
  const implement = [...new Set(rows.flatMap((r) => (r.code ? [r.code.name] : [])))].sort();
  const unmapped = rows.filter((r) => !r.code).map((r) => r.figmaName);

  const what = newest ? newest.label || firstLine(newest.description) || "untitled publish" : "component metadata change";
  const title = `Figma library publish: ${what} — ${rows.length} component${rows.length === 1 ? "" : "s"}`;

  const lines: string[] = [marker, "", "## What was published", ""];
  for (const v of changeSet.versions) {
    lines.push(`- **Version:** [${v.label || "untitled"}](${versionUrl(changeSet.fileKey, v.id)}) by **${v.user}**, ${v.createdAt.slice(0, 10)}`);
    if (v.description) lines.push(`  > ${v.description.replace(/\n/g, "\n  > ")}`);
  }
  if (!changeSet.versions.length) lines.push("- No published version: the component metadata changed without one.");
  lines.push(`- Found by uno-bot's end-of-day library poll on ${changeSet.detectedAt.slice(0, 10)}.`, "");

  lines.push("## Changed components", "");
  if (rows.length) {
    lines.push("| Component | Figma | Code | Change |", "|---|---|---|---|");
    for (const r of rows) {
      lines.push(
        `| ${cell(r.code?.name ?? r.figmaName)} | [${cell(r.figmaName)}](${r.figmaUrl}) | ${r.code ? `\`${r.code.dir}\`` : NO_MAPPING} | ${changeCell(r)} |`,
      );
    }
  } else {
    lines.push("No component metadata changed and no visual baseline could be compared, so nothing is itemised. Check the version in Figma.");
  }
  lines.push("");

  lines.push("## Proposed code change", "");
  rows.forEach((r, i) => lines.push(`${i + 1}. **${r.code?.name ?? r.figmaName}** — ${r.proposal}`));
  if (!rows.length) lines.push("None drafted.");
  lines.push("");

  lines.push(
    "## Done when",
    "",
    "- [ ] Each mapped component's code matches the published Figma variants",
    "- [ ] Storybook stories updated, and visual parity checked against Figma",
    "- [ ] Token changes run through `npm run sync:tokens && npm run generate:tokens`",
    ...(unmapped.length ? ["- [ ] Each \"no code mapping\" row is mapped in its MDX `figmaMeta`, or confirmed Figma-only"] : []),
    "",
    implement.length && newest
      ? `A ✅ on the #plus-universal card dispatches \`figma-implement.yml\` for: ${implement.join(", ")}.`
      : "Nothing here is dispatched: no changed component has a code mapping, or no version was published.",
  );

  return {
    key,
    ...(newest ? { versionId: newest.id } : {}),
    marker,
    title,
    body: lines.join("\n"),
    rows,
    implement: newest ? implement : [],
    unmapped,
  };
}

function firstLine(text: string): string {
  return text.split("\n")[0]!.trim().slice(0, 80);
}

/**
 * The summary the card leads with: who published what, the change by kind,
 * the code mapping, and what each decision does — in Slack mrkdwn, every
 * Figma-sourced string escaped.
 *
 * @param changeSet - What the poll found
 * @param intake - Its drafted intake
 * @param ttlHours - How long the card stays live, as the card states it
 */
export function publishSummary(changeSet: LibraryChangeSet, intake: PublishIntake, ttlHours: number): string {
  const newest = changeSet.versions[0];
  const lines: string[] = [];
  if (newest) {
    const label = escapeSlackText(newest.label || firstLine(newest.description) || "untitled publish");
    lines.push(
      `:art: *Figma library publish* — *${label}*, published by *${escapeSlackText(newest.user)}* · ` +
        `<${versionUrl(changeSet.fileKey, newest.id)}|view this version>`,
    );
    if (newest.description) lines.push(`> ${escapeSlackText(newest.description.slice(0, 300)).replace(/\n/g, "\n> ")}`);
  } else {
    lines.push(":art: *Figma library change* — component metadata changed without a published version.");
  }
  const byKind = (kind: "created" | "modified" | "deleted") =>
    listed(intake.rows.filter((r) => r[kind].length).map((r) => escapeSlackText(r.figmaName)));
  if (changeSet.created.length) lines.push(`• :package: *New:* ${byKind("created")}`);
  if (changeSet.modified.length) lines.push(`• :pencil2: *Modified:* ${byKind("modified")}`);
  if (changeSet.deleted.length) lines.push(`• :wastebasket: *Deleted:* ${byKind("deleted")}`);
  const code = [
    intake.implement.length ? `maps to ${intake.implement.join(", ")}` : "",
    intake.unmapped.length ? `${NO_MAPPING}: ${listed(intake.unmapped.map(escapeSlackText))}` : "",
  ].filter(Boolean);
  if (code.length) lines.push(`*Code:* ${code.join(" · ")}`);
  lines.push(
    intake.implement.length
      ? `:white_check_mark: files the intake and runs \`figma-implement\` for *${intake.implement.join(", ")}* · ` +
          `:no_entry: files the intake only.`
      : ":white_check_mark: or :no_entry: files the intake — there is nothing to implement from it.",
    `Any #plus-universal member can decide, for ${ttlHours} hours.`,
  );
  return lines.join("\n");
}
