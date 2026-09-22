// What a GitHub intake says once it is filed: the drafted body, then the footer
// the Worker adds.
//
// Pure, and apart from the executor, for the reason `share-out-render.ts`
// gives: a shape that is only ever assembled inside a side effect is a shape
// nothing compares against anything. Here the part worth comparing is the
// footer — it is added at execution time precisely so the model cannot leave it
// out, and a footer nobody asserts is one a refactor can.
//
// The labels are here too, as a constant: they are the Worker's decision, never
// a model input, so the one place they are written is the one place they are
// read from.

import { escapeSlackText } from "../slack/mrkdwn";

/** Every bot-filed issue enters uno-maintain triage beside the headless sweep
 *  findings. Fixed: the model cannot add to or change them, so a triage outcome
 *  such as `ready-for-agent` is never self-applied. */
export const INTAKE_LABELS = ["harness-intake", "needs-triage"] as const;

/** The triage outcomes (`docs/agents/triage-labels.md`): a maintainer's
 *  decision about an intake, so no bot write ever applies or removes one —
 *  `github_issue_update` refuses them, whatever the model asks. */
export const TRIAGE_OUTCOME_LABELS = ["ready-for-agent", "ready-for-human", "wontfix"] as const;

/** The model's half of an intake: a title and a body, and nothing else. */
export interface IssueDraft {
  title: string;
  body: string;
}

/** Who asked, and where — the facts the footer is written from. */
export interface IssueFiling {
  /** The requester's Slack display name — a mention id means nothing on GitHub. */
  requester: string;
  /** The source thread's permalink, or null when Slack would not give one. */
  permalink: string | null;
  /** Asked for in a DM: the footer says so and links nothing, because a DM
   *  stays a DM and the issue may be public. */
  dm?: boolean;
}

/**
 * The draft as the tool input carries it.
 *
 * Reads `title` and `body` and nothing else, so a `labels` the model sent
 * anyway goes nowhere — the schema refuses it too, but the executor does not
 * rely on the schema. The `repo` is the executor's, through the resolver.
 */
export function issueDraftFromInput(input: Record<string, unknown>): IssueDraft {
  const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
  return { title: str(input.title), body: str(input.body) };
}

/**
 * The issue body: the draft verbatim, a rule, then who it was filed for and the
 * thread it came from — so a maintainer knows whom to ask and where the context
 * lives, and can tell the requester's words from the bot's.
 */
export function renderIssueBody(draft: IssueDraft, filing: IssueFiling): string {
  return withSlackFooter(draft.body, filing, "Filed");
}

/**
 * A comment the bot posts on an issue (`github_issue_update`): the text
 * verbatim, then the same footer an intake carries — "Posted" where an intake
 * says "Filed" — so every word the shared token writes names who asked.
 */
export function renderCommentBody(text: string, filing: IssueFiling): string {
  return withSlackFooter(text, filing, "Posted");
}

/** The words, a rule, then who asked and where. A DM's footer says so and
 *  links nothing: the repo is public and a DM stays a DM. */
function withSlackFooter(text: string, filing: IssueFiling, verb: "Filed" | "Posted"): string {
  const footer = filing.dm
    ? [`${verb} from Slack by uno-bot on behalf of ${filing.requester}, ${verb.toLowerCase()} from a DM.`]
    : [
        `${verb} from Slack by uno-bot on behalf of ${filing.requester}.`,
        `Source thread: ${filing.permalink ?? "(thread link unavailable)"}`,
      ];
  return [text, "", "---", ...footer].join("\n");
}

/**
 * The draft as a person pastes it: the title, then the body in a code block
 * whose fence is longer than any backtick run inside it, so a body carrying
 * its own ``` cannot close the block early.
 *
 * Escaped whole, valid-looking markup included: this is text to copy, not to
 * render, and a quoted `<@teammate>` blanks a message (live 2026-09-22,
 * `slack/mrkdwn.ts` § sanitizeSlackMarkup). Slack decodes the entities for
 * display, so what the person sees and copies is the draft as written.
 */
export function pasteableDraft(draft: IssueDraft): string {
  const longest = Math.max(0, ...(draft.body.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `*${escapeSlackText(draft.title)}*\n${fence}\n${escapeSlackText(draft.body)}\n${fence}`;
}
