// The hand-off a drift card's Approve files, one per file, drafted spec-grade
// so a human or their agent can run it as it stands:
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
// WHAT LEAVES A PRIVATE PLACE. The repo is public, the Roadmap is the team's
// own workspace:
//   • a GitHub issue from a private channel, a group DM or a DM carries no
//     thread words and no link — only the file and one neutral line written
//     from the file's side. The tool's footer links nothing from such a place
//     either (`isPrivateConversation`);
//   • a Roadmap card from a private channel carries the thread's words, after
//     an Approve from someone in the channel, and no link back to it; one
//     from a group DM carries neither words nor link (#742 amendment 2).
// Any paraphrase that reaches GitHub has its `@handle`s set in code, so an
// issue body pings no GitHub user.
//
// PURE: no `Env`, no fetch.

import type { ProposalOperation } from "../thread-state/index";
import type { FileDriftFinding, IntakeLane } from "./finding";

/** Characters of a drafted title. */
const TITLE_CHARS = 90;

/** The line a GitHub issue from a private place says instead of the thread's words. */
export const NEUTRAL_SETTLED =
  "A team conversation settled a change this file may not show yet. Ask the file's owner which change.";

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

/** The pillar candidates for a file: its threads' linked cards, then
 *  Universal for the design-system library. */
export function pillarCandidates(findings: readonly FileDriftFinding[]): string[] {
  const out = findings.flatMap((f) => f.pillars);
  if (findings.some((f) => f.target.kind === "figma-library")) out.push("Universal");
  return [...new Set(out)];
}

/**
 * Text bound for GitHub with every `@handle` set in code, so it notifies
 * nobody. An email address is left as it is.
 *
 * @param text - A paraphrase, a title
 */
export function githubInert(text: string): string {
  return text.replace(/(^|[^\w`@.])@([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))(?![\w@`])/g, "$1`@$2`");
}

/** What one file's draft is made from. */
export interface IntakeDraftInput {
  /** The file's findings, its card's own thread first. */
  findings: readonly FileDriftFinding[];
  pillar: string | null;
  publisher: { handle: string; at: string } | null;
  /** Evidence permalinks, public threads only, by finding id. */
  permalinks: Readonly<Record<string, string>>;
}

/**
 * The one operation a drift card's Approve runs for a file.
 *
 * @param input - The file's findings and what the morning read for them
 */
export function draftIntake(input: IntakeDraftInput): { operation: ProposalOperation; title: string; lane: IntakeLane } {
  const first = input.findings[0]!;
  const lane = first.lane;
  const wordless = withheldWords(first);
  const facts = factsOf(input, wordless);
  if (lane === "roadmap") {
    const title = draftTitle(first, wordless);
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
            { heading: FILE_HEADING, body: facts.file },
            ...(facts.where ? [{ heading: "Where it was decided", body: facts.where }] : []),
          ],
          acceptance_criteria: [facts.shows, "Whoever owns the file confirms the update in the thread that raised it"],
          source_url: facts.sourceUrl,
          ...(input.pillar ? { properties: { product_pillar: input.pillar } } : {}),
        },
      },
    };
  }
  const title = githubInert(draftTitle(first, wordless));
  const body = [
    fileMarker(first.fileKey),
    "",
    "## What was settled",
    "",
    githubInert(facts.settled),
    "",
    `## ${FILE_HEADING}`,
    "",
    githubInert(facts.file),
    ...(facts.where ? ["", "## Where it was decided", "", facts.where] : []),
    "",
    "## Done when",
    "",
    `- [ ] ${githubInert(facts.shows)}`,
    "- [ ] Storybook stories and docs match, where the change touches a component",
    "- [ ] Whoever owns the file confirms the update in the thread that raised it",
  ].join("\n");
  return { lane, title, operation: { toolName: "github_issue_create", input: { title, body } } };
}

const FILE_HEADING = "The file";

function fileMarker(fileKey: string): string {
  return `<!-- uno-bot:file-drift:${fileKey} -->`;
}

/** Whether the thread's words stay out of the intake: always for a group DM
 *  or a DM, and for a private channel on the public GitHub lane. */
function withheldWords(f: FileDriftFinding): boolean {
  const kind = f.evidence.channelKind;
  if (kind === "group-dm" || kind === "dm") return true;
  return kind === "private" && f.lane === "maintain";
}

function draftTitle(f: FileDriftFinding, wordless: boolean): string {
  const name = flat(f.target.title) || "the linked file";
  const base = `Update ${name} ${f.lane === "roadmap" ? "in Figma" : "in code"}`;
  return cap(wordless ? base : `${base}: ${flat(f.threadSays)}`, TITLE_CHARS);
}

function factsOf(
  input: IntakeDraftInput,
  wordless: boolean,
): { summary: string; settled: string; file: string; where: string | null; shows: string; sourceUrl: string } {
  const first = input.findings[0]!;
  const said = flat(first.threadSays);
  const shows = flat(first.sourceSays);
  const publisher = input.publisher?.handle
    ? `\nLast published by ${flat(input.publisher.handle)}${input.publisher.at ? ` on ${input.publisher.at.slice(0, 10)}` : ""}.`
    : "";
  const links = input.findings
    .filter((f) => f.evidence.channelKind === "public")
    .map((f) => input.permalinks[f.id])
    .filter((l): l is string => !!l);
  return {
    summary: wordless ? NEUTRAL_SETTLED : `A Slack thread settled a change the file may not show yet: ${said}`,
    settled: wordless ? NEUTRAL_SETTLED : `${said}${shows ? `\n\nThe file, as uno-bot read it: ${shows}` : ""}`,
    file: `${first.target.url}${publisher}`,
    where: links.length ? links.map((l) => `- ${l}`).join("\n") : null,
    shows: wordless ? "The file shows the change its owner confirms was settled" : `The file shows: ${said}`,
    sourceUrl: links[0] ?? first.target.url,
  };
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cap(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
