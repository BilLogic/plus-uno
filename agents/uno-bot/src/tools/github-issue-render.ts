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

/** Every bot-filed issue enters uno-maintain triage beside the headless sweep
 *  findings. Fixed: the model cannot add to or change them, so a triage outcome
 *  such as `ready-for-agent` is never self-applied. */
export const INTAKE_LABELS = ["harness-intake", "needs-triage"] as const;

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
   *  stays a DM and the issue is public. */
  dm?: boolean;
}

/**
 * The draft as the tool input carries it.
 *
 * Reads `title` and `body` and nothing else, so a `labels` or `repo` the model
 * sent anyway goes nowhere — the schema refuses them too, but the executor does
 * not rely on the schema.
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
  const footer = filing.dm
    ? [`Filed from Slack by uno-bot on behalf of ${filing.requester}, filed from a DM.`]
    : [
        `Filed from Slack by uno-bot on behalf of ${filing.requester}.`,
        `Source thread: ${filing.permalink ?? "(thread link unavailable)"}`,
      ];
  return [draft.body, "", "---", ...footer].join("\n");
}

/**
 * The draft as a person pastes it: the title, then the body in a code block
 * whose fence is longer than any backtick run inside it, so a body carrying
 * its own ``` cannot close the block early.
 */
export function pasteableDraft(draft: IssueDraft): string {
  const longest = Math.max(0, ...(draft.body.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `*${draft.title}*\n${fence}\n${draft.body}\n${fence}`;
}
