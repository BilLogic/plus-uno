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
import { namesInWords, windowInWords } from "../slack/copy-words";

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
  /**
   * The components (by `componentIdOf`) that are new to the library as a
   * whole, and the ones gone from it — so a new variant on an existing
   * component reads as an update, not as a new component. Absent on a change
   * set kept from before the poll recorded them; the card then judges by the
   * variants alone.
   */
  newComponentIds?: string[];
  removedComponentIds?: string[];
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
  /** What happened to the component as a whole, as the card counts it. */
  change: "new" | "updated" | "removed";
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
  id: string;
  figmaName: string;
  setNodeId?: string;
  firstNodeId: string;
  created: string[];
  modified: string[];
  deleted: string[];
}

/**
 * Which component a variant belongs to: its set's node id, else its set or
 * frame name. The card's rows and the poll's new/removed ids both use it, so
 * they name the same thing.
 *
 * @param c - A variant (or a lone component)
 */
export function componentIdOf(c: LibraryComponent): string {
  return c.setNodeId ?? `name:${(c.containingFrame || c.name).toLowerCase()}`;
}

/** The change set by component set: variants of one set are one row. */
function groupsOf(changeSet: LibraryChangeSet): Group[] {
  const groups = new Map<string, Group>();
  const add = (c: LibraryComponent, kind: "created" | "modified" | "deleted") => {
    const figmaName = c.containingFrame || c.name;
    const id = componentIdOf(c);
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
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

/**
 * New, updated or removed, for the component as a whole. The poll's ids say
 * whether the component itself is new or gone; a change set kept from before
 * it recorded them is judged by its variants — every one created is new,
 * every one deleted is removed.
 */
function changeOf(group: Group, changeSet: LibraryChangeSet): IntakeRow["change"] {
  if (changeSet.newComponentIds || changeSet.removedComponentIds) {
    if (changeSet.newComponentIds?.includes(group.id)) return "new";
    if (changeSet.removedComponentIds?.includes(group.id)) return "removed";
    return "updated";
  }
  if (!group.modified.length && !group.deleted.length) return "new";
  if (!group.created.length && !group.modified.length) return "removed";
  return "updated";
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
      change: changeOf(group, changeSet),
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

// ── The #plus-universal messages (#886 § 3.1, approved 2026-09-30) ──────────
//
// The words are the approved copy's, and `docs/connectors/slack.md` § Figma
// messages holds the rules they follow; tests/figma-copy.test.ts pins both.
// Every Figma-sourced string is escaped.

/** #886's ceiling for one post: a longer list goes in the thread. */
export const CARD_CHARS = 1500;
/** What one overflow reply is packed to — under a single post's ~3,900. */
const REPLY_CHARS = 3500;

const HAS_CODE = "Has code";
const NO_CODE_YET = "No code mapping yet";

/** The library file itself, which an edited-not-published post links. */
function libraryUrl(fileKey: string): string {
  return `https://www.figma.com/design/${fileKey}`;
}

/** The card's two groups, every row's name in each, in row order. */
function codeGroups(intake: PublishIntake): Array<{ label: string; names: string[] }> {
  const groups = [
    { label: HAS_CODE, names: intake.rows.filter((r) => r.code).map((r) => escapeSlackText(r.figmaName)) },
    { label: NO_CODE_YET, names: intake.rows.filter((r) => !r.code).map((r) => escapeSlackText(r.figmaName)) },
  ];
  return groups.filter((g) => g.names.length);
}

/** "7 components changed: 2 new, 5 updated." — the count is the rows, and so
 *  is the list under it. */
function countLine(rows: readonly IntakeRow[]): string {
  if (!rows.length) return "No changed components found. The version has the details.";
  const parts = (["new", "updated", "removed"] as const)
    .map((change) => ({ change, n: rows.filter((r) => r.change === change).length }))
    .filter((p) => p.n)
    .map((p) => `${p.n} ${p.change}`);
  return `${rows.length} component${rows.length === 1 ? "" : "s"} changed: ${parts.join(", ")}.`;
}

/** A group's line, its names capped at `cap` with the rest counted. */
function groupLine(group: { label: string; names: string[] }, cap = Infinity): string {
  const shown = group.names.slice(0, cap);
  const rest = group.names.length - shown.length;
  return `• *${group.label}:* ${shown.join(", ")}${rest ? ` and ${rest} more` : ""}`;
}

/** The library card, as the parts its renderer and its post need. */
export interface PublishCardCopy {
  /** Who published what, the count, and every name under Has code and No
   *  code mapping yet — capped only when the card would pass `CARD_CHARS`. */
  lead: string;
  /** What ✅ and ⛔ each do, and who decides for how long. */
  footer: string;
  /** The complete list, for the card's thread, when the lead had to cap it. */
  overflow: string[];
}

/**
 * The library publish card's words.
 *
 * @param changeSet - What the poll found; it carries a published version
 * @param intake - Its drafted intake
 * @param ttlHours - How long the card stays open
 */
export function publishCard(changeSet: LibraryChangeSet, intake: PublishIntake, ttlHours: number): PublishCardCopy {
  const newest = changeSet.versions[0];
  const head: string[] = [];
  if (newest) {
    const label = escapeSlackText(newest.label || firstLine(newest.description) || "untitled");
    head.push(
      `*Library published: "${label}"* by ${escapeSlackText(newest.user)} · <${versionUrl(changeSet.fileKey, newest.id)}|view version>`,
    );
    if (newest.description) head.push(`> ${escapeSlackText(newest.description.slice(0, 300)).replace(/\n/g, "\n> ")}`);
  }
  head.push("", countLine(intake.rows));

  const implement = intake.implement.map(escapeSlackText);
  const footer = [
    implement.length
      ? `:white_check_mark: files the intake and drafts the code for ${namesInWords(implement)}. :no_entry: files the intake only.`
      : intake.rows.length
        ? ":white_check_mark: and :no_entry: both file the intake. Nothing here has code yet, so there's nothing to draft."
        : ":white_check_mark: and :no_entry: both file the intake. There's nothing to draft.",
    `Anyone in this channel can decide, for the next ${windowInWords(ttlHours)}.`,
  ].join("\n");

  const groups = codeGroups(intake);
  const fits = (lead: string) => lead.length + 2 + footer.length <= CARD_CHARS;
  const full = [...head, ...groups.map((g) => groupLine(g))].join("\n");
  if (fits(full)) return { lead: full, footer, overflow: [] };

  // Too long for one post: each group keeps as many names as fit, the rest
  // are counted, and the whole list goes in the thread.
  const most = Math.max(...groups.map((g) => g.names.length));
  let cap = Math.max(1, most - 1);
  let lead = [...head, ...groups.map((g) => groupLine(g, cap))].join("\n");
  while (cap > 1 && !fits(lead)) {
    cap -= 1;
    lead = [...head, ...groups.map((g) => groupLine(g, cap))].join("\n");
  }
  return { lead, footer, overflow: componentListMessages(intake) };
}

/**
 * The card's complete list, for its thread: every name in each group, packed
 * into as many replies as it takes.
 *
 * @param intake - The drafted intake
 */
export function componentListMessages(intake: PublishIntake): string[] {
  const messages: string[] = [];
  let current = `All ${intake.rows.length} components in this publish:`;
  for (const group of codeGroups(intake)) {
    let line = `• *${group.label}:* `;
    let first = true;
    for (const name of group.names) {
      const piece = first ? name : `, ${name}`;
      if (current.length + 1 + line.length + piece.length > REPLY_CHARS) {
        messages.push(`${current}\n${line}`);
        current = "";
        line = `• *${group.label}, continued:* ${name}`;
      } else {
        line += piece;
      }
      first = false;
    }
    current = current ? `${current}\n${line}` : line;
  }
  messages.push(current);
  return messages;
}

/**
 * What a change with no published version posts: no card, because there is
 * nothing to decide (#886 § 3.1 "Edited, not published").
 *
 * @param changeSet - What the poll found, with no version
 * @param intake - Its drafted intake, for the rows
 */
export function editedNotPublished(changeSet: LibraryChangeSet, intake: PublishIntake): string {
  const n = intake.rows.length;
  const library = `<${libraryUrl(changeSet.fileKey)}|library>`;
  const onlyEdits = intake.rows.every((r) => !r.created.length && !r.deleted.length);
  const what = onlyEdits
    ? `${n} ${n === 1 ? "component's name or description" : "components' names or descriptions"} changed`
    : `${n} component${n === 1 ? "" : "s"} changed`;
  return [
    `*Library edited, not published.* ${what} in the ${library}, with no new version.`,
    "Nothing to build yet. I'll post again when a version is published.",
  ].join("\n");
}
