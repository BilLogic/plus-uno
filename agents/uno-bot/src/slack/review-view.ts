// The Review pop-up's views: loading, the draft, and the one-line states that
// follow a decision or find nothing left to decide.
//
// Renders and posts nothing; `review-door.ts` decides which view to show and
// hands it to Slack. Every view is a modal with a Close, and the decision is a
// button in the body's last row, because a view's footer holds only two
// buttons, and Slack's ✕ closes without deciding. A draft with editable fields
// also has a submit, because Slack requires one beside an input; it is Check
// edits, which decides nothing (`CHECK_EDITS`).
//
// The view carries the card it is about in `private_metadata`, as the card's
// own buttons carry it in the message they sit on — that ts is the identity,
// and the decision is resolved against it and nothing else.
import { textSections } from "./render";
import { CONFIRM_FOOTER } from "./proposal-render";
import { SLACK_USER_ID } from "./mrkdwn";
import { fieldInputBlocks, type EditableField } from "./review-fields";
import type { PendingProposal, StatedCardWords } from "../thread-state/index";

/** The Approve button inside the pop-up; `slack/interactive.ts` routes it. */
export const REVIEW_APPROVE_ACTION_ID = "uno_review_approve";

/** The card a view is about, as `private_metadata` carries it. */
export interface ReviewedCard {
  channel: string;
  ts: string;
}

/** Slack's modal title cap is 24 characters. */
const TITLE = "Review proposal";

/** Slack's cap on a view's blocks. The draft's sections stay well under it:
 *  a card's text is held to one message, at most fourteen 2,900-char sections. */
const MAX_VIEW_BLOCKS = 100;

type View = Record<string, unknown>;

/** A view's `callback_id`, which names the pop-up's submit to the endpoint. */
export const REVIEW_CALLBACK_ID = "uno_review";

/** The one alert a view carries, replaced rather than stacked. */
export const REVIEW_ALERT_BLOCK_ID = "uno_review_alert";

/**
 * The footer's submit, present only beside the fields. Slack requires a
 * submit on any view with an input block, and pressing Enter in a field
 * presses it, so it decides nothing: it runs the edit checks and answers in
 * the pop-up. The decision stays in the body's last row.
 */
export const CHECK_EDITS = "Check edits";

function modal(card: ReviewedCard, blocks: unknown[], opts: { submit?: string } = {}): View {
  return {
    type: "modal",
    callback_id: REVIEW_CALLBACK_ID,
    title: { type: "plain_text", text: TITLE },
    close: { type: "plain_text", text: "Close" },
    ...(opts.submit ? { submit: { type: "plain_text", text: opts.submit } } : {}),
    private_metadata: JSON.stringify({ channel: card.channel, ts: card.ts }),
    blocks: blocks.slice(0, MAX_VIEW_BLOCKS),
  };
}

/** What the pop-up has to say about the edits: an alert block, which Slack
 *  takes in a modal and nowhere else. Text is plain, so a quoted edit shows
 *  exactly as typed. */
export function alertBlock(level: "error" | "success", text: string): unknown {
  return { type: "alert", block_id: REVIEW_ALERT_BLOCK_ID, level, text: { type: "plain_text", text } };
}

/** The draft's fields, editable, and what the pop-up says about them. */
export interface DraftEdit {
  fields: readonly EditableField[];
  /** The person's own values, kept across a redraw. */
  values?: ReadonlyMap<string, string>;
  alert?: { level: "error" | "success"; text: string };
}

function line(text: string): unknown {
  return { type: "section", text: { type: "mrkdwn", text } };
}

/** The view `views.open` shows at once, inside Slack's three-second trigger
 *  window, before anything has been read. */
export function loadingView(card: ReviewedCard): View {
  return modal(card, [line("Loading the draft…")]);
}

/**
 * The draft, as the card states it, minus the card's footer about reactions —
 * the pop-up carries its own decision.
 *
 * `mayDecide` false is the same draft read-only: no decision row, and a line
 * naming who can decide instead.
 *
 * `edit` gives a confirmer the draft's fields as inputs, under the draft and
 * above the decision; an alert about them opens the view, where it is seen.
 * Read-only views take no fields.
 */
export function draftView(
  card: ReviewedCard,
  proposal: PendingProposal,
  access: { mayDecide: boolean; confirmers: readonly string[] },
  edit?: DraftEdit,
): View {
  const body = proposal.proposalText.replace(CONFIRM_FOOTER, "").trim();
  const fields = access.mayDecide ? (edit?.fields ?? []) : [];
  const blocks: unknown[] = [];
  if (fields.length && edit?.alert) blocks.push(alertBlock(edit.alert.level, edit.alert.text));
  blocks.push(...textSections(body));
  if (fields.length) {
    blocks.push({ type: "divider" });
    blocks.push(...fieldInputBlocks(fields, edit?.values));
  }
  if (access.mayDecide) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "actions",
      block_id: "uno_review_decision",
      elements: [
        {
          type: "button",
          action_id: REVIEW_APPROVE_ACTION_ID,
          style: "primary",
          text: { type: "plain_text", text: "Approve" },
          value: "confirm",
        },
      ],
    });
  } else {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: readOnlyLine(access.confirmers) }] });
  }
  return modal(card, blocks, fields.length ? { submit: CHECK_EDITS } : {});
}

function readOnlyLine(confirmers: readonly string[]): string {
  const who = confirmers.filter((id) => SLACK_USER_ID.test(id)).map((id) => `<@${id}>`);
  if (!who.length) return "Read-only. Nobody here can decide this proposal.";
  const names = who.length === 1 ? who[0]! : `${who.slice(0, -1).join(", ")} or ${who.at(-1)!}`;
  return `Read-only. Only ${names} can decide this proposal.`;
}

/** A card that cannot be decided any more, and why. No decision row. */
export function closedView(
  card: ReviewedCard,
  why: { state: "expired"; stated?: StatedCardWords } | { state: "superseded" } | { state: "gone" },
): View {
  switch (why.state) {
    case "expired":
      return modal(card, [line(why.stated?.expired ?? "This proposal expired, so it can't be approved now. Ask me again and I'll set it up fresh.")]);
    case "superseded":
      return modal(card, [line("This proposal was replaced by a newer one. Review the newest card in the thread instead.")]);
    case "gone":
      return modal(card, [line("This proposal has already been decided.")]);
  }
}

/** One line in place of the draft: the decision registered, or the Gate's
 *  answer when it did not. */
export function noticeView(card: ReviewedCard, text: string): View {
  return modal(card, [line(text)]);
}

/** The card a view's `private_metadata` names, or null for one this Worker
 *  did not write. */
export function reviewedCardOf(privateMetadata: string | undefined): ReviewedCard | null {
  if (!privateMetadata) return null;
  try {
    const parsed = JSON.parse(privateMetadata) as Partial<ReviewedCard>;
    return typeof parsed.channel === "string" && typeof parsed.ts === "string"
      ? { channel: parsed.channel, ts: parsed.ts }
      : null;
  } catch {
    return null;
  }
}
