// The checklist as a static `plan` block — the form it takes where Slack will
// not open a stream.
//
// A top-level Messages-tab DM has no thread, and `chat.startStream` refuses one
// without `thread_ts` outside Slack Code session channels (`invalid_thread_ts`).
// There the adapter posts the checklist as a message carrying one `plan` block
// of `task_card`s and rewrites it once at settle (`delivery-adapter.ts`).
//
// SAME CARDS, DIFFERENT SPELLING. The block is drawn from the very `PlanTask`
// state the stream path keeps, so whatever a card carries there reaches the
// block too. Two fields change shape on the way: the stream chunk's `id` is the
// block's `task_id`, and the chunk's `details` / `output` are bare strings where
// the block's are rich text. A source is kept as `{text, url}` and spelled as
// Slack's `{type: "url", …}`. That spelling is the same on the stream chunk,
// so `cardLinks` is the one place it is written, and `api.ts` imports it for
// the chunk.
//
// NO ICON. Slack refuses a `task_update` chunk carrying any `icon` — every
// shape tried live on 2026-10-07 (an image URL, `url`, an `image` element, a
// named icon, an emoji) came back `invalid_arguments`, despite the reference
// page's example (docs/connectors/slack.md § Task cards). The block's icon
// was never seen to work either, so a card carries none on either path.
//
// PURE: no `Env`, so the adapter can import it without importing `api.ts`.

import type { PlanTask } from "./delivery-adapter";

/** Slack's limit on the tasks one `plan` block may hold. */
export const PLAN_BLOCK_MAX_TASKS = 50;

/** How long a title or a rich-text line may run — the same 256-char limit the
 *  stream's task chunks live under, with the same margin `api.ts` keeps. */
const TEXT_CHARS = 250;

const cut = (text: string): string => (text.length > TEXT_CHARS ? `${text.slice(0, TEXT_CHARS - 1)}…` : text);

/** A plain string as the one-section rich text a `task_card` field takes. It
 *  is literal text, not mrkdwn, so it needs no markup pass — only the cut. */
function richText(text: string): Record<string, unknown> {
  return {
    type: "rich_text",
    elements: [{ type: "rich_text_section", elements: [{ type: "text", text: cut(text) }] }],
  };
}

/**
 * A card's sources as Slack spells them, on a stream chunk and on a block
 * alike — ready to spread into either.
 *
 * @param task - The card's kept sources (`{text, url}`)
 * @param textPass - The path's own pass over a source's name: the chunk's
 *   markup pass, or the block's cut. A URL goes as the tool returned it, since
 *   a link is not text to escape.
 */
export function cardLinks(
  task: { readonly sources?: ReadonlyArray<{ text: string; url: string }> },
  textPass: (text: string) => string,
): Record<string, unknown> {
  const { sources } = task;
  return sources?.length ? { sources: sources.map((s) => ({ type: "url", text: textPass(s.text), url: s.url })) } : {};
}

/** One card as a `task_card` block element. */
function taskCard(task: PlanTask): Record<string, unknown> {
  const { id, title, status, details, output } = task;
  return {
    type: "task_card",
    task_id: id,
    title: cut(title),
    status,
    ...(details ? { details: richText(details) } : {}),
    ...(output ? { output: richText(output) } : {}),
    ...cardLinks(task, cut),
  };
}

/**
 * The checklist as one `plan` block.
 *
 * The cap on cards a turn shows is the checklist's own rule and is applied
 * before a card reaches here; the slice is Slack's limit, held regardless, so
 * a plan the cap missed is cut rather than refused.
 *
 * @param title - The checklist's heading
 * @param tasks - Every card, in the order the checklist shows them
 */
export function planBlock(title: string, tasks: readonly PlanTask[]): Record<string, unknown> {
  return {
    type: "plan",
    title: cut(title),
    tasks: tasks.slice(0, PLAN_BLOCK_MAX_TASKS).map(taskCard),
  };
}
