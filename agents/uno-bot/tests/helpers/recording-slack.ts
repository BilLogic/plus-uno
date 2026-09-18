// A Slack client that records instead of calling Slack — the stand-in the
// Slack Delivery adapter is driven on (#594).
//
// It is `turn/delivery.ts`'s `recordingDelivery` one layer down: that one
// stands in for the PORT, so a turn can be run without Slack; this one stands
// in for the CLIENT, so the Slack adapter itself can be run without Slack. Two
// layers, because the questions are different — a turn test asks what the turn
// meant, and an adapter test asks what Slack was handed.
//
// Same rule as the recording Delivery, for the same reason: it answers the way
// the real client answers — a post reports a ts, a status call reports Slack's
// `ok`, a stream reports the ts it opened — because a fake that is merely close
// is worse than none. And its failure switches are OPTIONS on the record rather
// than a second constructor each, so a case that needs a refusal reads as one
// word.

import type {
  PlanTask,
  SlackDeliveryClient,
  SlackDeliveryDeps,
  WorkingSignalOutcome,
} from "../../src/slack/delivery-adapter";
import type { FooterKind } from "../../src/slack/footer-kind";
import type { PostingClient, PostingDeps } from "../../src/slack/delivery";
import type { DeliveryFailureStage } from "../../src/turn/index";
import type { SessionStatus, StatusResult } from "../../src/slack/session-status";

/** One thing the adapter asked Slack to do, in order. */
export type SlackCall =
  | { kind: "react"; channel: string; ts: string; name: string }
  | { kind: "unreact"; channel: string; ts: string; name: string }
  | { kind: "message"; channel: string; threadTs?: string; text: string; blocks: boolean }
  | {
      kind: "answer";
      channel: string;
      threadTs?: string;
      text: string;
      userId: string;
      team?: string;
      footerHint?: FooterKind;
      openStreamTs?: string;
    }
  | {
      kind: "failure";
      channel: string;
      threadTs?: string;
      userMsgTs: string;
      stage: DeliveryFailureStage;
    }
  | { kind: "startStream"; channel: string; threadTs: string; userId: string; team?: string }
  | { kind: "task"; channel: string; ts: string; task: PlanTask }
  | { kind: "stopStream"; channel: string; ts: string }
  | { kind: "status"; channel: string; threadTs: string; status: SessionStatus }
  | { kind: "rename"; channel: string; threadTs: string; title: string };

/** A `[working]` line as it was reported, with the outcome that produced it. */
export interface WorkingLine {
  line: string;
  outcome: WorkingSignalOutcome;
}

export interface RecordingSlackOptions {
  /** What every status call answers. Default: Slack accepted it. */
  status?: StatusResult;
  /** Throw out of the status call instead of answering — the budget stop, or a
   *  transport failure `api.ts` did not degrade. */
  statusThrows?: unknown;
  /** Refuse every plain post, the way Slack refuses a conversation the bot was
   *  removed from. */
  messageFails?: boolean;
  /** Refuse only a post carrying blocks, so the card's text-only retry is
   *  reachable. */
  blocksFail?: boolean;
  /** What `startStream` opens. `null` is a stream Slack would not open. */
  streamTs?: string | null;
  /** Throw out of the answer post, so the adapter's "close the stream nobody
   *  else holds" path is reachable. */
  answerThrows?: unknown;
}

export interface RecordingSlack {
  client: SlackDeliveryClient;
  /** Everything Slack was asked to do, in order. */
  calls: SlackCall[];
  /** Every `[working]` line reported, in order. */
  lines: WorkingLine[];
  /** The adapter's dependencies, with this client in them. */
  deps(planStream?: boolean): SlackDeliveryDeps;
  /** Just the calls of one kind, narrowed. */
  of<K extends SlackCall["kind"]>(kind: K): Array<Extract<SlackCall, { kind: K }>>;
}

export function recordingSlack(opts: RecordingSlackOptions = {}): RecordingSlack {
  const calls: SlackCall[] = [];
  const lines: WorkingLine[] = [];
  let posted = 0;

  const client: SlackDeliveryClient = {
    async addReaction(channel, ts, name) {
      calls.push({ kind: "react", channel, ts, name });
    },
    async removeReaction(channel, ts, name) {
      calls.push({ kind: "unreact", channel, ts, name });
    },
    async postMessage(input) {
      const blocks = !!input.blocks;
      calls.push({
        kind: "message",
        channel: input.channel,
        ...(input.thread_ts === undefined ? {} : { threadTs: input.thread_ts }),
        text: input.text,
        blocks,
      });
      if (opts.messageFails || (blocks && opts.blocksFail)) return { ok: false };
      return { ok: true, ts: `posted-${++posted}` };
    },
    async postAnswer(input) {
      calls.push({
        kind: "answer",
        channel: input.channel,
        ...(input.threadTs === undefined ? {} : { threadTs: input.threadTs }),
        text: input.text,
        userId: input.recipient.userId,
        ...(input.recipient.team === undefined ? {} : { team: input.recipient.team }),
        ...(input.footerHint === undefined ? {} : { footerHint: input.footerHint }),
        ...(input.openStreamTs === undefined ? {} : { openStreamTs: input.openStreamTs }),
      });
      if (opts.answerThrows !== undefined) throw opts.answerThrows;
      return { ok: true, text: input.text };
    },
    async postFailure(input) {
      calls.push({
        kind: "failure",
        channel: input.channel,
        ...(input.threadTs === undefined ? {} : { threadTs: input.threadTs }),
        userMsgTs: input.userMsgTs,
        stage: input.stage,
      });
    },
    async startStream(channel, threadTs, userId, team) {
      calls.push({
        kind: "startStream",
        channel,
        threadTs,
        userId,
        ...(team === undefined ? {} : { team }),
      });
      return opts.streamTs === undefined ? "stream-1" : opts.streamTs;
    },
    async appendTask(channel, ts, task) {
      calls.push({ kind: "task", channel, ts, task });
    },
    async stopStream(channel, ts) {
      calls.push({ kind: "stopStream", channel, ts });
    },
    async setSessionStatus(channel, threadTs, status) {
      calls.push({ kind: "status", channel, threadTs, status });
      if (opts.statusThrows !== undefined) throw opts.statusThrows;
      return opts.status ?? { ok: true };
    },
    async renameSession(channel, threadTs, title) {
      calls.push({ kind: "rename", channel, threadTs, title });
    },
  };

  return {
    client,
    calls,
    lines,
    deps: (planStream = false) => ({
      slack: client,
      planStream,
      logWorking: (line, outcome) => {
        lines.push({ line, outcome });
      },
    }),
    of: <K extends SlackCall["kind"]>(kind: K) =>
      calls.filter((call): call is Extract<SlackCall, { kind: K }> => call.kind === kind),
  };
}

/** One thing the posting functions asked Slack to do, in order. */
export type PostingCall =
  | { kind: "react"; channel: string; ts: string; name: string }
  | { kind: "message"; channel: string; threadTs?: string; text: string; blocks: boolean }
  | { kind: "startStream"; channel: string; threadTs: string; userId: string; team?: string }
  | { kind: "appendStream"; channel: string; ts: string; text: string }
  | { kind: "stopStream"; channel: string; ts: string; blocks: boolean };

export interface RecordingPostingOptions {
  /** What `startStream` opens. `null` is a stream Slack would not open. */
  streamTs?: string | null;
  /** Refuse every plain post. */
  messageFails?: boolean;
  /** Refuse only a post carrying blocks. */
  blocksFail?: boolean;
  /** Refuse `appendStream`, so the finish-failed fallback is reachable. */
  appendFails?: boolean;
  /** Refuse `stopStream`. */
  stopFails?: boolean;
}

export interface RecordingPosting {
  client: PostingClient;
  calls: PostingCall[];
  /** The posting functions' dependencies, with this client in them. */
  deps(over?: Partial<Omit<PostingDeps, "slack">>): PostingDeps;
  of<K extends PostingCall["kind"]>(kind: K): Array<Extract<PostingCall, { kind: K }>>;
}

/**
 * A Slack posting client that records instead of calling Slack — the stand-in
 * `postTextVerified` / `postVisibleFailure` are driven on (#654).
 *
 * One layer below `recordingSlack`: that one stands in for the Delivery
 * adapter's client (plan streams, session status); this one stands in for the
 * posting functions' client (answer streams, the recipient pair).
 */
export function recordingPosting(opts: RecordingPostingOptions = {}): RecordingPosting {
  const calls: PostingCall[] = [];
  let posted = 0;

  const client: PostingClient = {
    async addReaction(channel, ts, name) {
      calls.push({ kind: "react", channel, ts, name });
    },
    async postMessage(input) {
      const blocks = !!input.blocks;
      calls.push({
        kind: "message",
        channel: input.channel,
        ...(input.thread_ts === undefined ? {} : { threadTs: input.thread_ts }),
        text: input.text,
        blocks,
      });
      if (opts.messageFails || (blocks && opts.blocksFail)) return { ok: false };
      return { ok: true, ts: `posted-${++posted}` } as { ok: boolean };
    },
    async startStream(channel, threadTs, userId, team) {
      calls.push({
        kind: "startStream",
        channel,
        threadTs,
        userId,
        ...(team === undefined ? {} : { team }),
      });
      return opts.streamTs === undefined ? "stream-1" : opts.streamTs;
    },
    async appendStream(channel, ts, text) {
      calls.push({ kind: "appendStream", channel, ts, text });
      return !opts.appendFails;
    },
    async stopStream(channel, ts, blocks) {
      calls.push({ kind: "stopStream", channel, ts, blocks: !!blocks?.length });
      return !opts.stopFails;
    },
  };

  return {
    client,
    calls,
    /**
     * The posting functions' dependencies, with this client in them.
     *
     * `streamingOn` defaults true so a test of the recipient pair actually
     * reaches `startStream` — the production envelope reads `SLACK_STREAMING`.
     *
     * @param over optional overrides for the streaming switch, alert channel, or throttle
     */
    deps: (over = {}) => ({
      slack: client,
      streamingOn: over.streamingOn ?? true,
      alertChannel: over.alertChannel ?? "C_ALERT",
      ...(over.throttle === undefined ? {} : { throttle: over.throttle }),
    }),
    of: <K extends PostingCall["kind"]>(kind: K) =>
      calls.filter((call): call is Extract<PostingCall, { kind: K }> => call.kind === kind),
  };
}
