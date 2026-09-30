// The hand-off a drift card's ✅ files, drafted spec-grade so a human or their
// agent can run it as it stands:
//
//   • the project lane — a Roadmap card from the PRD template
//     (`notion_create`, surface `prd`), for a Figma file;
//   • the maintain lane — a `harness-intake` GitHub issue
//     (`github_issue_create`), for code, Storybook or a repo file. The tool
//     adds the labels and the footer itself.
//
// SELECT VALUES ARE EXACT-MATCHED (hard rule 4, `docs/connectors/notion.md`).
// The only select the draft sets is the card's Product Pillar, and only to a
// value the Roadmap already offers: the candidates are the pillars of Roadmap
// cards the thread linked (and Universal for the design-system library), each
// matched against the options read from the Roadmap's schema that morning. A
// candidate that is not an option is left out and the card says so; nothing
// is ever invented, since Notion silently creates any option it is handed.
//
// WHAT LEAVES A PRIVATE PLACE. A finding from a private channel files no link
// back to it. One from a group DM files neither link nor the thread's words —
// only the file and that a conversation there settled something — so the
// intake names nobody and quotes nothing (#742 amendment 2).
//
// PURE: no `Env`, no fetch.

import type { ProposalOperation } from "../thread-state/index";
import type { FileDriftFinding, IntakeLane } from "./finding";

/** Characters of a drafted title. */
const TITLE_CHARS = 90;

/** The pillar the intake is filed under, or why it has none. */
export interface PillarChoice {
  pillar: string | null;
  /** Said on the card when a candidate was left out; null when nothing was. */
  note: string | null;
}

/**
 * The first candidate the Roadmap offers, in the Roadmap's own spelling.
 *
 * @param candidates - Pillars read off linked cards, in order
 * @param options - The Roadmap's Product Pillar options; null when unread
 */
export function matchPillar(candidates: readonly string[], options: readonly string[] | null): PillarChoice {
  const wanted = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  if (!wanted.length) return { pillar: null, note: null };
  if (!options) {
    return { pillar: null, note: "left unset — the Roadmap's options could not be read this morning" };
  }
  const byLower = new Map(options.map((o) => [o.toLowerCase(), o] as const));
  let pillar: string | null = null;
  const missing: string[] = [];
  for (const c of wanted) {
    const hit = options.includes(c) ? c : byLower.get(c.toLowerCase());
    if (!hit) missing.push(c);
    else pillar ??= hit;
  }
  const note = missing.length
    ? `${missing.map((m) => `“${m}”`).join(", ")} ${missing.length === 1 ? "is not an option" : "are not options"} on the Roadmap, so ${pillar ? "left out" : "left unset"}`
    : null;
  return { pillar, note };
}

/** The pillar candidates for an ask: its threads' linked cards, then
 *  Universal for the design-system library. */
export function pillarCandidates(findings: readonly FileDriftFinding[]): string[] {
  const out = findings.flatMap((f) => f.pillars);
  if (findings.some((f) => f.target.kind === "figma-library")) out.push("Universal");
  return [...new Set(out)];
}

/** What the draft is made from. */
export interface IntakeDraftInput {
  /** The ask's findings, the card's own thread first. */
  findings: readonly FileDriftFinding[];
  pillar: string | null;
  publisher: { handle: string; at: string } | null;
  /** Evidence permalinks, public threads only, by finding id. */
  permalinks: Readonly<Record<string, string>>;
}

/**
 * The one operation a drift card's ✅ runs.
 *
 * @param input - The ask's findings and what the morning read for them
 */
export function draftIntake(input: IntakeDraftInput): { operation: ProposalOperation; title: string; lane: IntakeLane } {
  const first = input.findings[0]!;
  const lane = first.lane;
  const title = draftTitle(first);
  const facts = factsOf(input);
  if (lane === "roadmap") {
    return {
      lane,
      title,
      operation: {
        toolName: "notion_create",
        input: {
          surface: "prd",
          title,
          summary: facts.summary,
          sections: [
            { heading: "What was settled", body: facts.settled },
            { heading: "The file", body: facts.file },
            ...(facts.where ? [{ heading: "Where it was decided", body: facts.where }] : []),
          ],
          acceptance_criteria: [
            facts.shows,
            "Whoever owns the file confirms the update in the thread that raised it",
          ],
          source_url: facts.sourceUrl,
          ...(input.pillar ? { properties: { product_pillar: input.pillar } } : {}),
        },
      },
    };
  }
  const body = [
    `<!-- uno-bot:file-drift:${first.fileKey} -->`,
    "",
    "## What was settled",
    "",
    facts.settled,
    "",
    "## The file",
    "",
    facts.file,
    ...(facts.where ? ["", "## Where it was decided", "", facts.where] : []),
    "",
    "## Done when",
    "",
    `- [ ] ${facts.shows}`,
    "- [ ] Storybook stories and docs match, where the change touches a component",
    "- [ ] Whoever owns the file confirms the update in the thread that raised it",
  ].join("\n");
  return { lane, title, operation: { toolName: "github_issue_create", input: { title, body } } };
}

function draftTitle(f: FileDriftFinding): string {
  const name = flat(f.target.title) || "the linked file";
  const where = f.lane === "roadmap" ? "in Figma" : "in code";
  const base = `Update ${name} ${where}`;
  if (f.evidence.channelKind === "group-dm") return cap(base, TITLE_CHARS);
  return cap(`${base}: ${flat(f.threadSays)}`, TITLE_CHARS);
}

function factsOf(input: IntakeDraftInput): {
  summary: string;
  settled: string;
  file: string;
  where: string | null;
  shows: string;
  sourceUrl: string;
} {
  const first = input.findings[0]!;
  const groupDm = first.evidence.channelKind === "group-dm";
  const said = flat(first.threadSays);
  const shows = flat(first.sourceSays);
  const settled = groupDm
    ? "A conversation uno-bot was part of settled a change this file may not show yet. Ask its owner which change."
    : `${said}${shows ? `\n\nThe file, as uno-bot read it: ${shows}` : ""}`;
  const publisher = input.publisher?.handle
    ? `\nLast published by ${flat(input.publisher.handle)}${input.publisher.at ? ` on ${input.publisher.at.slice(0, 10)}` : ""}.`
    : "";
  const links = input.findings
    .filter((f) => f.evidence.channelKind === "public")
    .map((f) => input.permalinks[f.id])
    .filter((l): l is string => !!l);
  return {
    summary: groupDm
      ? `A conversation settled a change ${first.target.url} may not show yet.`
      : `A Slack thread settled a change the file may not show yet: ${said}`,
    settled,
    file: `${first.target.url}${publisher}`,
    where: links.length ? links.map((l) => `- ${l}`).join("\n") : null,
    shows: groupDm ? "The file shows the change the conversation settled" : `The file shows: ${said}`,
    sourceUrl: links[0] ?? first.target.url,
  };
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cap(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
