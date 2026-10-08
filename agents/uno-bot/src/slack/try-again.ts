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
// back on the press. So does who asked it (`retryValue`), and only they are
// answered: a question asked again runs as the presser's own message, with
// their access and their name on whatever it stages, so a bystander in a
// channel thread is told to ask it themselves. A value with no asker in it —
// a button posted before the asker rode along — still asks for whoever
// pressed, as it always did.
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
  /** The button's value: the question, and who asked it (`retryValue`). */
  value: string | undefined;
}

export interface TryAgainDoorDeps {
  /** Post a line; the ts, or null when it did not land. */
  post(message: { channel: string; thread_ts?: string; text: string }): Promise<string | null>;
  /** Queue a turn on a message. */
  enqueue(event: SlackMessageEvent): Promise<void>;
  /** Answer the presser alone, where they pressed. */
  replyEphemeral(text: string): Promise<void>;
}

/**
 * The Try again button's value: the question, and the person who asked it.
 *
 * @param asker - The Slack id of whoever asked the question that failed
 * @param question - The question, as they asked it
 */
export function retryValue(asker: string, question: string): string {
  return JSON.stringify({ asker, ask: question });
}

/** A value read back: the question, and its asker when the value names one. */
function readRetryValue(value: string): { ask: string; asker?: string } {
  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as { asker?: unknown; ask?: unknown };
      if (typeof parsed.ask === "string" && typeof parsed.asker === "string") {
        return { ask: parsed.ask, asker: parsed.asker };
      }
    } catch {
      // A question that happens to open with a brace.
    }
  }
  return { ask: value };
}

/**
 * A press: the question asked again in the failure's thread, as the presser —
 * when the presser is who asked it.
 *
 * @param press - Who pressed, where, and the question the button carried
 */
export async function runTryAgainDoor(press: TryAgainPress, deps: TryAgainDoorDeps): Promise<void> {
  const { ask, asker } = readRetryValue(press.value ?? "");
  const question = ask.trim() ? ask : "";
  if (!question || !SLACK_USER_ID.test(press.userId)) return;
  if (asker && asker !== press.userId) {
    const who = SLACK_USER_ID.test(asker) ? `<@${asker}>` : "the person who asked";
    await deps.replyEphemeral(`Only ${who} can retry this — ask it yourself.`);
    return;
  }
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
