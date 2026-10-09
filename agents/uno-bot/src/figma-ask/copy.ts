// What uno-bot says when asked in a Figma comment (#903), and the #plus-design
// post a change request opens.
//
// THE REPLY is plain text: Figma shows a comment as typed, so Slack's markup
// would arrive as asterisks and angle brackets. It leads with the label, says
// the answer in at most three lines, and ends with one source link. An answer
// with nothing to link is not posted as an answer: the reply says it could not
// find this, and points at #plus-design, so uno-bot never guesses in a file.
//
// THE LEAD in #plus-design is a Figma message like the rest
// (docs/connectors/slack.md § Figma messages): it opens with what happened,
// quotes the ask, and asks for one action. The card under it carries the gate.
//
// PURE.

import { toPlainText } from "../slack/mrkdwn";
import { FIGMA_LABEL } from "./trigger";

/** Lines of answer a reply carries, at most. */
export const MAX_ANSWER_LINES = 3;
/** Characters in one line of answer, at most. */
export const MAX_LINE_CHARS = 300;

/** The reply's last line when there is nothing to link. */
export const CANT_FIND_LINE = "I couldn't find this in a source I can link, so I won't guess. Ask in #plus-design.";

/** What a reply says. */
export type FigmaReply =
  | { kind: "answer"; lines: string[]; source: string | null }
  | { kind: "question"; lines: string[] }
  | { kind: "drafted"; link: string | null }
  | { kind: "not-teammate" }
  | { kind: "failed" };

/**
 * A reply as Figma shows it: the label, then what it says.
 *
 * @param reply - What the turn came to
 */
export function figmaReplyText(reply: FigmaReply): string {
  const body = ((): string[] => {
    switch (reply.kind) {
      case "answer":
        return reply.source && reply.lines.length ? [...reply.lines, `Source: ${reply.source}`] : [CANT_FIND_LINE];
      case "question":
        return [...reply.lines, "Reply here with @uno and the answer, and I'll pick it up."];
      case "drafted":
        return [
          `I drafted this change for approval in #plus-design${reply.link ? `: ${reply.link}` : "."}`,
          "Nothing changes in the file or anywhere else until a teammate approves it there.",
        ];
      case "not-teammate":
        return [
          "I draft changes only for teammates whose Figma account is on Team Members, so I haven't drafted this one.",
          "Ask in #plus-design.",
        ];
      case "failed":
        return ["I couldn't answer this just now. Ask in #plus-design."];
    }
  })();
  return [FIGMA_LABEL, ...body].join("\n");
}

/** Markdown links, `[label](url)`. */
const MD_LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
/** Slack links, `<url|label>` or `<url>`. */
const SLACK_LINK = /<(https?:\/\/[^|>\s]+)(?:\|[^>]*)?>/g;
/** Bare links. */
const BARE_LINK = /https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/g;

/**
 * The turn's answer as plain lines, and the first link it cites.
 *
 * Link markup becomes its label, emphasis, headings, bullets and fences go,
 * and a line that is only a "Sources:" heading or list is dropped: the reply
 * carries its own source line.
 *
 * @param text - The answer as the turn wrote it
 */
export function plainAnswer(text: string): { lines: string[]; source: string | null } {
  const cited: Array<{ at: number; url: string }> = [];
  for (const re of [MD_LINK, SLACK_LINK, BARE_LINK]) {
    for (const m of text.matchAll(re)) cited.push({ at: m.index ?? 0, url: re === MD_LINK ? m[2]! : re === SLACK_LINK ? m[1]! : m[0] });
  }
  cited.sort((a, b) => a.at - b.at);

  const plain = toPlainText(text.replace(MD_LINK, "$1").replace(/\*\*|__/g, ""));
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
  return { lines, source: cited[0]?.url ?? null };
}

/** A line cut to `MAX_LINE_CHARS`, at a sentence end when one is close enough. */
function capLine(line: string): string {
  if (line.length <= MAX_LINE_CHARS) return line;
  const cut = line.slice(0, MAX_LINE_CHARS);
  const end = cut.lastIndexOf(". ");
  return end > MAX_LINE_CHARS / 2 ? cut.slice(0, end + 1) : `${cut.slice(0, MAX_LINE_CHARS - 1).trimEnd()}…`;
}

/** What the #plus-design lead names. */
export interface AskLead {
  /** The asker's Slack id. */
  slackId: string;
  file: { title: string; url: string };
  /** The ask, one line and short. */
  quote: string;
  /** A Figma link to the comment. */
  commentUrl: string;
}

/**
 * The #plus-design post a change asked for in Figma opens: what happened,
 * the ask, and one action. The card goes in its thread.
 *
 * @param lead - Who asked, in which file, and what
 */
export function askLeadText(lead: AskLead): string {
  return [
    `<@${lead.slackId}> asked for a change in a Figma comment on <${lead.file.url}|${lead.file.title}>.`,
    `> ${lead.quote} (<${lead.commentUrl}|comment>)`,
    "The draft is in this thread. Review it to approve, change or drop it; nothing is written from Figma.",
  ].join("\n");
}
