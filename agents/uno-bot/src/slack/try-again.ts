// The Try again button under a failure, and the door a press comes in by.
//
// A press asks the question again the way the person would have: a line in
// the failure's thread says who asked again and what, and a turn is queued on
// that line as the presser's own message — the same synthetic event the Home
// "Try asking" buttons and the message shortcuts build (`try-asking.ts`,
// `shortcuts.ts`), so history, proposals, delivery and the visible-failure
// backstops all run unchanged. A new line rather than the original message,
// because a turn is keyed on its message and the original one has had its
// turn.
//
// The question rides on the button as its value (`failure-message.ts`): the
// failure is the only place that still holds it, and Slack hands the value
// back on the press. Whoever presses is who asks — the button sits where the
// asker is reading, and a read asked twice changes nothing, while a write
// still waits on its card.
//
// PURE: the door takes its Slack call and the runner by name, and `Env`
// enters in `interactive.ts`.

import type { SlackMessageEvent } from "./types";
import { escapeSlackText, SLACK_USER_ID } from "./mrkdwn";

export interface TryAgainPress {
  userId: string;
  channel: string;
  /** The failure message the button sits on. */
  messageTs: string;
  /** The failure's thread, when it sat in one. */
  threadTs?: string;
  /** The button's value: the question. */
  value: string | undefined;
}

export interface TryAgainDoorDeps {
  /** Post a line; the ts, or null when it did not land. */
  post(message: { channel: string; thread_ts?: string; text: string }): Promise<string | null>;
  /** Queue a turn on a message. */
  enqueue(event: SlackMessageEvent): Promise<void>;
}

/**
 * A press: the question asked again in the failure's thread, as the presser.
 *
 * @param press - Who pressed, where, and the question the button carried
 */
export async function runTryAgainDoor(press: TryAgainPress, deps: TryAgainDoorDeps): Promise<void> {
  const question = press.value?.trim() ? press.value : "";
  if (!question || !SLACK_USER_ID.test(press.userId)) return;
  const quoted = escapeSlackText(question)
    .split("\n")
    .map((line) => `>${line}`)
    .join("\n");
  const ts = await deps.post({
    channel: press.channel,
    ...(press.threadTs ? { thread_ts: press.threadTs } : {}),
    text: `<@${press.userId}> asked again:\n${quoted}`,
  });
  if (!ts) {
    console.error(`[try-again] the question did not post in ${press.channel}`);
    return;
  }
  await deps.enqueue({
    type: "message",
    channel: press.channel,
    user: press.userId,
    text: question,
    ts,
    thread_ts: press.threadTs ?? ts,
  });
}
