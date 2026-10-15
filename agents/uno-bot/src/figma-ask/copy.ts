// What uno-bot says when asked in a Figma comment (#903).
//
// THE REPLY is plain text: Figma shows a comment as typed, so Slack's markup
// would arrive as asterisks and angle brackets. It leads with the label, says
// the answer in at most three lines, and ends with one source line, its name
// and link — one the answer itself cites, and that a public thread may carry.
// An answer with no such link is not posted as an answer: the reply says it
// could not find this, and points at #plus-design, so uno-bot never guesses in
// a file.
//
// A CHANGE is never made from Figma. The reply says so, names what uno-bot
// would do, and sends a teammate to le goat in Slack, where a change is
// drafted for a teammate to approve.
//
// PURE.

import { toPlainText } from "../slack/mrkdwn";
import { OVERLOADED_LEAD, OVERLOADED_NEXT } from "../slack/failure-message";
import { labelled } from "./trigger";

/** Lines of answer a reply carries, at most. */
export const MAX_ANSWER_LINES = 3;
/** Characters in one line of answer, at most. */
export const MAX_LINE_CHARS = 300;

/** The reply's last line when there is nothing to link. */
export const CANT_FIND_LINE = "I couldn't find this in a source I can link, so I won't guess. Ask in #plus-design.";

/** The one source a reply names: the Sources box's name for it, and its link. */
export interface FigmaSource {
  name: string;
  url: string;
}

/** What a reply says. */
export type FigmaReply =
  | { kind: "answer"; lines: string[]; source: FigmaSource | null }
  | { kind: "question"; lines: string[] }
  /** A teammate's change, not made: `would` is what one approval would do, in
   *  the write's fixed gate words (`agent/tool-table.ts`); null when unknown. */
  | { kind: "answer-only"; would: string | null }
  /** A change asked for by someone Team Members does not map. */
  | { kind: "not-teammate" }
  /** Both models out of capacity: the plain overloaded line, as Slack says it. */
  | { kind: "overloaded" }
  | { kind: "failed" };

/** What a reply to a change asked for in Figma opens with. */
const NO_CHANGE = "I can't make changes from a Figma comment, so nothing was changed.";

/**
 * The reply to a change the turn proposed and the ask refused: what it would
 * do, for a teammate, who is sent to le goat in Slack; for anyone else, only
 * that nothing was changed.
 *
 * @param teammate - Whether Team Members maps the asker
 * @param verb - The write's fixed gate words; empty when it has none
 */
export function answerOnlyReply(teammate: boolean, verb: string): FigmaReply {
  return teammate ? { kind: "answer-only", would: verb || null } : { kind: "not-teammate" };
}

/** Where a teammate's change is drafted instead. */
const TO_SLACK = "Ask le goat in Slack, and I'll draft it there for a teammate to approve.";

/**
 * A reply as Figma shows it: the label, then what it says, its first line beside the label.
 *
 * @param reply - What the turn came to
 */
export function figmaReplyText(reply: FigmaReply): string {
  return labelled(figmaReplyLines(reply));
}

/** `Source: <name> — <link>`: Figma posts plain text, so the name sits beside
 *  the link rather than on it. A name that is only the link is said once. */
function sourceLine({ name, url }: FigmaSource): string {
  // Plain text, so a bracket in a title stays, as typed; only lines fold.
  const label = name.replace(/\s+/g, " ").trim();
  return label && label !== url ? `Source: ${label} — ${url}` : `Source: ${url}`;
}

/**
 * What a reply says, under its label: the lines the ask's thread remembers.
 *
 * @param reply - What the turn came to
 */
export function figmaReplyLines(reply: FigmaReply): string[] {
  return ((): string[] => {
    switch (reply.kind) {
      case "answer":
        return reply.source && reply.lines.length ? [...reply.lines, sourceLine(reply.source)] : [CANT_FIND_LINE];
      case "question":
        return [...reply.lines, "Reply here with @uno and the answer, and I'll pick it up."];
      case "answer-only":
        return [NO_CHANGE, reply.would ? `To make it, I'd ${reply.would}. ${TO_SLACK}` : TO_SLACK];
      case "not-teammate":
        return [`${NO_CHANGE} Ask in #plus-design.`];
      case "overloaded":
        return [`${OVERLOADED_LEAD} ${OVERLOADED_NEXT}`];
      case "failed":
        return ["I couldn't answer this just now. Ask in #plus-design."];
    }
  })();
}

/** Markdown links, `[label](url)`; a label may hold backslash-escaped characters. */
const MD_LINK = /\[((?:\\.|[^\]\\\n])+)\]\((https?:\/\/[^\s)]+)\)/g;
/** Slack links, `<url|label>` or `<url>`. */
const SLACK_LINK = /<(https?:\/\/[^|>\s]+)(?:\|[^>]*)?>/g;
/** Bare links. */
const BARE_LINK = /https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/g;

/**
 * The turn's answer as plain lines, and the links it cites, in the order it cites them.
 *
 * Link markup becomes its label, emphasis, headings, bullets and fences go,
 * and a line that is only a "Sources:" heading or list is dropped: the reply
 * carries its own source line.
 *
 * @param text - The answer as the turn wrote it
 */
export function plainAnswer(text: string): { lines: string[]; cited: string[] } {
  const cited: Array<{ at: number; url: string }> = [];
  for (const re of [MD_LINK, SLACK_LINK, BARE_LINK]) {
    for (const m of text.matchAll(re)) cited.push({ at: m.index ?? 0, url: re === MD_LINK ? m[2]! : re === SLACK_LINK ? m[1]! : m[0] });
  }
  cited.sort((a, b) => a.at - b.at);

  // A link becomes its label, as typed: the turn escapes a frame's title in
  // its link (`turn/figma-answer-copy.ts`), and Figma shows a backslash as
  // one. The labels sit out the markup pass, so a `<` in a title stays.
  const labels: string[] = [];
  const held = text.replace(MD_LINK, (_m, label: string) => `\u0000${labels.push(label.replace(/\\(.)/g, "$1").replace(/\*\*/g, "")) - 1}\u0000`);
  const plain = toPlainText(held.replace(/\*\*|__/g, "")).replace(/\u0000(\d+)\u0000/g, (_m, i: string) => labels[Number(i)] ?? "");
  const lines = plain
    .split("\n")
    .filter((l) => !/^\s*(```|~~~)/.test(l))
    .map((l) =>
      l
        .replace(/^\s*#+\s+/, "")
        .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((l) => l && !/^sources?\b\s*:?/i.test(l))
    .slice(0, MAX_ANSWER_LINES)
    .map(capLine);
  return { lines, cited: [...new Set(cited.map((c) => c.url))] };
}

/** A line cut to `MAX_LINE_CHARS`, at a sentence end when one is close enough. */
function capLine(line: string): string {
  if (line.length <= MAX_LINE_CHARS) return line;
  const cut = line.slice(0, MAX_LINE_CHARS);
  const end = cut.lastIndexOf(". ");
  return end > MAX_LINE_CHARS / 2 ? cut.slice(0, end + 1) : `${cut.slice(0, MAX_LINE_CHARS - 1).trimEnd()}…`;
}
