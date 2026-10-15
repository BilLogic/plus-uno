// The Review pop-up's object card: Slack's `card` block for the thing a draft
// shares or touches, and the one place that knows it may not be taken.
//
// UNTRIED IN A MODAL. Slack's block reference lists `card` for modals, but no
// uno-bot view had carried one when the pop-up began to, and `views.open`
// cannot be dry-run without a real `trigger_id`. So the card is built here and
// nowhere else, and so is its fallback: a `section` with the title and the
// subtitle, its Open link a `url` button as the accessory. A view goes out
// with the card; when Slack answers `invalid_blocks` and names the card (or
// names nothing), `sendWithCardFallback` sends it once more with every card
// swapped for its fallback, and logs that it did, so a refused card never
// leaves a person without a pop-up.
//
// The fallback is read off the card block itself, not off the reading that
// built it: any view, however it was assembled, can be stepped down.
//
// PURE: blocks in, blocks out; the send is a parameter.
import { escapeSlackText } from "./mrkdwn";

/** The thing a draft shares or touches, as its card shows it. */
export interface ObjectCard {
  title: string;
  subtitle?: string;
  /** 200 characters or fewer; a longer text goes under the card instead. */
  body?: string;
  /** Its Open button: an https link and the button's words. */
  open?: { url: string; text: string };
}

/** The action id an Open button carries. A `url` button still sends a
 *  `block_actions`, which `slack/interactive.ts` acks and lets fall through. */
export const OPEN_ACTION_ID = "uno_review_open";

/** Slack's caps on a card: title and subtitle 150, body 200, a button's text 75. */
const CARD_TITLE_CHARS = 150;
export const CARD_BODY_CHARS = 200;
const BUTTON_CHARS = 75;
/** Slack's cap on a section's text. */
const SECTION_CHARS = 3000;

const plain = (text: string) => ({ type: "plain_text", text });

/** Text cut to one of Slack's caps, an ellipsis where it was cut. */
export function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Whether a link can be an Open button: an https or http URL, nothing else. */
function isLink(url: string): boolean {
  return /^https?:\/\/[^\s<>|]+$/.test(url);
}

/**
 * The card for the object, and, when its body is over a card's 200
 * characters, the body as a section under a card that has none.
 */
export function objectCardBlocks(card: ObjectCard): unknown[] {
  const title = card.title.trim() || "Untitled";
  const body = card.body?.trim();
  const fits = body !== undefined && body.length > 0 && body.length <= CARD_BODY_CHARS;
  const open = card.open && isLink(card.open.url) ? card.open : undefined;
  const block = {
    type: "card",
    title: plain(clip(title, CARD_TITLE_CHARS)),
    ...(card.subtitle?.trim() ? { subtitle: plain(clip(card.subtitle.trim(), CARD_TITLE_CHARS)) } : {}),
    ...(fits ? { body: plain(body!) } : {}),
    ...(open
      ? { actions: [{ type: "button", action_id: OPEN_ACTION_ID, text: plain(clip(open.text, BUTTON_CHARS)), url: open.url }] }
      : {}),
  };
  const under = body && !fits ? [{ type: "section", text: plain(clip(body, SECTION_CHARS)) }] : [];
  return [block, ...under];
}

type Text = { text?: unknown };
type CardShape = { type?: unknown; title?: Text; subtitle?: Text; body?: Text; actions?: Array<{ url?: unknown; text?: Text; action_id?: unknown }> };

const textOf = (t: Text | undefined): string => (typeof t?.text === "string" ? t.text : "");

/** A `card` block stepped down to what every modal has taken: a section with
 *  the title in bold and the subtitle under it, the Open link its accessory,
 *  and the body as a section beneath. */
export function cardFallbackBlocks(block: unknown): unknown[] {
  const card = block as CardShape;
  const escape = escapeSlackText;
  const title = textOf(card.title);
  const subtitle = textOf(card.subtitle);
  const lines = [title ? `*${escape(title)}*` : "", subtitle ? escape(subtitle) : ""].filter(Boolean);
  const button = card.actions?.find((a) => typeof a.url === "string");
  const head = {
    type: "section",
    text: { type: "mrkdwn", text: lines.join("\n") || " " },
    ...(button
      ? { accessory: { type: "button", action_id: typeof button.action_id === "string" ? button.action_id : OPEN_ACTION_ID, text: plain(textOf(button.text) || "Open"), url: button.url } }
      : {}),
  };
  const body = textOf(card.body);
  return body ? [head, { type: "section", text: plain(body) }] : [head];
}

const isCard = (block: unknown) => (block as { type?: unknown } | null)?.type === "card";

/** The view with every `card` block swapped for its fallback, or null when it
 *  carries none. */
export function withoutCardBlocks(view: Record<string, unknown>): Record<string, unknown> | null {
  const blocks = Array.isArray(view.blocks) ? view.blocks : [];
  if (!blocks.some(isCard)) return null;
  return { ...view, blocks: blocks.flatMap((b) => (isCard(b) ? cardFallbackBlocks(b) : [b])) };
}

/** What a views call answers, as far as the fallback reads it. */
export interface ViewCallResult {
  ok: boolean;
  error?: string;
  response_metadata?: { messages?: unknown };
}

/**
 * Whether Slack refused this view for its card: `invalid_blocks`, on a view
 * that has one, with a message that names a card or points at a card block
 * (`[json-pointer:/view/blocks/3/…]`) — or with no message at all, since a
 * refusal that names nothing could be the card and the retry costs one call.
 */
export function refusedForCard(view: Record<string, unknown>, res: ViewCallResult): boolean {
  if (res.ok || res.error !== "invalid_blocks") return false;
  const blocks = Array.isArray(view.blocks) ? view.blocks : [];
  if (!blocks.some(isCard)) return false;
  const messages = Array.isArray(res.response_metadata?.messages) ? res.response_metadata!.messages.map(String) : [];
  if (!messages.length) return true;
  return messages.some((m) => {
    if (/\bcard\b/i.test(m)) return true;
    const at = /blocks\/(\d+)/.exec(m);
    return at !== null && isCard(blocks[Number(at[1])]);
  });
}

/**
 * Send a view, and once more with its cards stepped down when Slack refuses it
 * for one: what `views.open`, `views.push` and `views.update` all go through.
 *
 * @param view - The view as built, cards and all
 * @param send - One views call with this view
 */
export async function sendWithCardFallback<R extends { ok: boolean }>(
  view: Record<string, unknown>,
  send: (view: Record<string, unknown>) => Promise<R>,
): Promise<R> {
  const res = await send(view);
  // Slack's answer types its extra fields as unknown; only these are read.
  if (!refusedForCard(view, res as unknown as ViewCallResult)) return res;
  const fallback = withoutCardBlocks(view)!;
  console.warn("[review] card block refused (invalid_blocks); sent the view again with its section fallback");
  return send(fallback);
}
