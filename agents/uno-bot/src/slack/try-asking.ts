// The App Home's "Try asking" buttons, and the door a press comes in by.
//
// A press asks the prompt the way the person would have: the question goes
// into their DM with the bot as the thread's first line, and a turn is queued
// on it as their own message — the same synthetic event the message
// shortcuts build (`shortcuts.ts`), so history, proposals, delivery and the
// visible-failure backstops all run unchanged. The Home tab is not a
// conversation, so the DM is where the answer can go.
//
// The prompts are the assistant panel's starters (`assistant.ts`
// `promptsFor`), not a second list: the Home offers the ones that work for
// the person looking, and the door runs only a prompt one of those lists
// holds. A button's value is the prompt itself, so a value the Home never
// offered is not run.
//
// PURE: the door takes its Slack calls and the runner by name, and `Env`
// enters in `interactive.ts`.

import type { SlackMessageEvent } from "./types";
import { promptsFor } from "./assistant";

/** Each button's action_id starts with this; the index after it keeps the ids
 *  unique within their actions block, which Slack requires. */
export const TRY_ASKING_ACTION_PREFIX = "uno_try_asking_";

/**
 * The buttons, one per starter prompt that works for this person.
 *
 * @param connected - Whether they have linked their own Slack
 */
export function tryAskingButtons(connected: boolean): Array<Record<string, unknown>> {
  return promptsFor(connected).map((p, i) => ({
    type: "button",
    text: { type: "plain_text", text: p.title },
    action_id: `${TRY_ASKING_ACTION_PREFIX}${i}`,
    value: p.message,
  }));
}

/** Every prompt a Home may offer, linked or not. */
const OFFERED = new Set([...promptsFor(true), ...promptsFor(false)].map((p) => p.message));

export interface TryAskingDoorDeps {
  /** The presser's DM with the bot, or null when Slack would not open it. */
  dmChannelFor(userId: string): Promise<string | null>;
  /** Post a top-level line; the ts, or null when it did not land. */
  post(message: { channel: string; text: string }): Promise<string | null>;
  /** Queue a turn on a message, under its conversation key. */
  enqueue(event: SlackMessageEvent, key: string): Promise<void>;
}

/**
 * A press: the prompt asked in the presser's DM, as them.
 *
 * @param press.userId - Who pressed
 * @param press.value - The button's value, the prompt
 */
export async function runTryAskingDoor(press: { userId: string; value: string | undefined }, deps: TryAskingDoorDeps): Promise<void> {
  const prompt = press.value ?? "";
  if (!OFFERED.has(prompt)) {
    console.warn(`[try-asking] ${press.userId} pressed a prompt the Home does not offer`);
    return;
  }
  const dm = await deps.dmChannelFor(press.userId);
  if (!dm) {
    console.error(`[try-asking] no DM with ${press.userId}`);
    return;
  }
  const ts = await deps.post({ channel: dm, text: `From the Home tab, you asked:\n>${prompt}` });
  if (!ts) {
    console.error(`[try-asking] the question did not post in ${dm}`);
    return;
  }
  const event: SlackMessageEvent = { type: "message", channel: dm, user: press.userId, text: prompt, ts, thread_ts: ts };
  await deps.enqueue(event, `${dm}:${ts}`);
}
