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
//
// AND IT REFUSES WHAT SLACK REFUSES. A fake that accepts anything let a
// checklist pass every suite and break on every multi-tool turn in production:
// Slack answered `invalid_arguments` to a `pending` task status,
// `streaming_mode_mismatch` to markdown appended into a stream opened in plan
// mode, and `message_not_in_streaming_state` to a stop on a stream already
// stopped — and `invalid_arguments` again to a task card carrying an icon in a
// shape it does not take. And every message's blocks are held to the shape
// rules in `slack-block-rules.ts`, confirmed against Slack's own validator.
// Both clients below refuse those the same way — the call is
// recorded, it does not land, and the refusal is kept on `refused` — and
// because the adapter swallows a refused card update by design, a refusal
// nobody looked at FAILS THE TEST it happened in (the `afterEach` below). A
// suite cannot pass while Slack would have said no.

import { afterEach } from "node:test";
import type {
  PlanTask,
  SlackDeliveryClient,
  SlackDeliveryDeps,
  WorkingSignalOutcome,
} from "../../src/slack/delivery-adapter";
import type { FooterKind } from "../../src/slack/footer-kind";
import type { PostingClient, PostingDeps } from "../../src/slack/delivery";
import { textCopy, type Presentation, type DeliveryFailureStage } from "../../src/turn/index";
import type { SessionStatus, StatusResult } from "../../src/slack/session-status";
import { iconRefusal, messageBlocksRefusal, SLACK_TASK_STATUSES } from "./slack-block-rules";

/** One thing the adapter asked Slack to do, in order. */
export type SlackCall =
  | { kind: "react"; channel: string; ts: string; name: string }
  | { kind: "unreact"; channel: string; ts: string; name: string }
  | {
      kind: "message";
      channel: string;
      threadTs?: string;
      text: string;
      blocks: boolean;
      /** The blocks themselves, when there were any — what a static checklist
       *  is asserted on. */
      blockList?: unknown[];
    }
  | { kind: "update"; channel: string; ts: string; text: string; blocks: unknown[] }
  | {
      kind: "answer";
      channel: string;
      threadTs?: string;
      text: string;
      userId: string;
      team?: string;
      footerHint?: FooterKind;
      presentation?: Presentation;
    }
  | {
      kind: "failure";
      channel: string;
      threadTs?: string;
      userMsgTs: string;
      stage: DeliveryFailureStage;
    }
  | { kind: "startStream"; channel: string; threadTs: string; userId: string; team?: string }
  | { kind: "tasks"; channel: string; ts: string; tasks: PlanTask[] }
  | { kind: "heading"; channel: string; ts: string; title: string }
  | { kind: "stopStream"; channel: string; ts: string }
  | { kind: "status"; channel: string; threadTs: string; status: SessionStatus }
  | { kind: "rename"; channel: string; threadTs: string; title: string };

/** A call Slack would have refused, and the error code it would have said. */
export interface SlackRefusal {
  call: string;
  error: string;
}


/** Every refusal not yet looked at, from every recording client in this test. */
const unread: SlackRefusal[] = [];

// A refusal is a failure unless the test took it off `refused` on purpose
// (`expectRefusals`). Registered once, at import, so it covers every suite that
// drives either client without each one remembering to ask.
afterEach(() => {
  if (!unread.length) return;
  const seen = unread.splice(0);
  throw new Error(`Slack would have refused: ${seen.map((r) => `${r.call} → ${r.error}`).join("; ")}`);
});

/** Note a refusal: on the client's own list, and on the list the hook reads. */
function refuse(list: SlackRefusal[], call: string, error: string): void {
  const refusal = { call, error };
  list.push(refusal);
  unread.push(refusal);
}

/** Refuse a message's blocks the way Slack does, if it would; true when it did.
 *  `invalid_blocks` is the code Slack's validator gives a bad shape. */
function refuseBlocks(list: SlackRefusal[], call: string, blocks: readonly unknown[] | undefined): boolean {
  const why = blocks ? messageBlocksRefusal(blocks) : null;
  if (why) refuse(list, `${call} with ${why}`, "invalid_blocks");
  return !!why;
}

/** Take a client's refusals as expected, so the test it happened in may pass. */
export function expectRefusals(list: readonly SlackRefusal[]): SlackRefusal[] {
  const taken = [...list];
  for (const r of taken) {
    const at = unread.indexOf(r);
    if (at >= 0) unread.splice(at, 1);
  }
  return taken;
}

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
  /** How long the Nth task append (0-based) takes to come back, in ms. A
   *  schedule where an early update is slow and a later one fast is a client
   *  that resolves out of order — the shape that let a card's "complete" land
   *  after the next card's "in progress" while updates were fire-and-forget. */
  taskDelayMs?: (index: number) => number;
  /** Reject every task update, the way a refused or thrown append arrives. */
  taskRejects?: unknown;
}

export interface RecordingSlack {
  client: SlackDeliveryClient;
  /** Everything Slack was asked to do, in order. */
  calls: SlackCall[];
  /** Every call in the order it LANDED — a task update when its promise
   *  settled, everything else when it was made. With a slow client this is
   *  what Slack actually received, which `calls` (the order of asking) is not. */
  landed: SlackCall[];
  /** Every `[working]` line reported, in order. */
  lines: WorkingLine[];
  /** Every call Slack would have refused, with its error code. */
  refused: SlackRefusal[];
  /** The adapter's dependencies, with this client in them. */
  deps(planStream?: boolean): SlackDeliveryDeps;
  /** Just the calls of one kind, narrowed. */
  of<K extends SlackCall["kind"]>(kind: K): Array<Extract<SlackCall, { kind: K }>>;
}

export function recordingSlack(opts: RecordingSlackOptions = {}): RecordingSlack {
  const calls: SlackCall[] = [];
  const landed: SlackCall[] = [];
  const lines: WorkingLine[] = [];
  const refused: SlackRefusal[] = [];
  let posted = 0;
  let appends = 0;
  // Every stream this client opens is a plan-mode one — the adapter's
  // `startStream` is the checklist's — and a stopped stream takes nothing more.
  const planStreams = new Set<string>();
  const stopped = new Set<string>();
  // Every call but a task append lands the moment it is made.
  const record = (call: SlackCall): void => {
    calls.push(call);
    if (call.kind !== "tasks") landed.push(call);
  };

  const client: SlackDeliveryClient = {
    async addReaction(channel, ts, name) {
      record({ kind: "react", channel, ts, name });
    },
    async removeReaction(channel, ts, name) {
      record({ kind: "unreact", channel, ts, name });
    },
    async postMessage(input) {
      const blocks = !!input.blocks;
      record({
        kind: "message",
        channel: input.channel,
        ...(input.thread_ts === undefined ? {} : { threadTs: input.thread_ts }),
        text: input.text,
        blocks,
        ...(input.blocks ? { blockList: input.blocks } : {}),
      });
      if (refuseBlocks(refused, "post", input.blocks)) return { ok: false };
      if (opts.messageFails || (blocks && opts.blocksFail)) return { ok: false };
      return { ok: true, ts: `posted-${++posted}` };
    },
    async updateMessage(input) {
      record({ kind: "update", channel: input.channel, ts: input.ts, text: input.text, blocks: input.blocks });
      if (refuseBlocks(refused, "update", input.blocks)) return { ok: false };
      return { ok: !opts.messageFails };
    },
    async postAnswer(input) {
      record({
        kind: "answer",
        channel: input.channel,
        ...(input.threadTs === undefined ? {} : { threadTs: input.threadTs }),
        text: input.text,
        userId: input.recipient.userId,
        ...(input.recipient.team === undefined ? {} : { team: input.recipient.team }),
        ...(input.footerHint === undefined ? {} : { footerHint: input.footerHint }),
        ...(input.presentation === undefined ? {} : { presentation: input.presentation }),
      });
      // Closing a stream INTO the answer appends the answer as markdown, and a
      // plan-mode stream takes task and plan chunks only. The client's type
      // no longer carries a stream ts at all; this is the refusal Slack gave
      // when it did, kept so a stream ts smuggled back in still fails.
      const handed = (input as { openStreamTs?: string }).openStreamTs;
      if (handed !== undefined) {
        if (planStreams.has(handed)) refuse(refused, "answer appended into a plan stream", "streaming_mode_mismatch");
        stopped.add(handed);
      }
      if (opts.answerThrows !== undefined) throw opts.answerThrows;
      // What the posting path reports it posted: a table's plain list rides
      // the text copy beneath the prose.
      return { ok: true, text: textCopy(input.text, input.presentation) };
    },
    async postFailure(input) {
      record({
        kind: "failure",
        channel: input.channel,
        ...(input.threadTs === undefined ? {} : { threadTs: input.threadTs }),
        userMsgTs: input.userMsgTs,
        stage: input.stage,
      });
    },
    async startStream(channel, threadTs, userId, team) {
      record({
        kind: "startStream",
        channel,
        threadTs,
        userId,
        ...(team === undefined ? {} : { team }),
      });
      const ts = opts.streamTs === undefined ? "stream-1" : opts.streamTs;
      if (ts) planStreams.add(ts);
      return ts;
    },
    async appendTasks(channel, ts, tasks) {
      const call: SlackCall = { kind: "tasks", channel, ts, tasks: [...tasks] };
      record(call);
      const delay = opts.taskDelayMs?.(appends++) ?? 0;
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      const bad = tasks.find((t) => !SLACK_TASK_STATUSES.has(t.status));
      if (bad) return refuse(refused, `task ${bad.id} as ${String(bad.status)}`, "invalid_arguments");
      // A card's `icon` only as Slack's icon object, `{type: "icon", name}`
      // with a built-in name (`slack-block-rules.ts`). The
      // `/debug/slack-stream?chunks=` probe against production Slack on
      // 2026-10-07 refused an image-URL `name`, a `url`, an `image` element and
      // an emoji — `invalid_arguments`, "failed to match exactly one allowed
      // schema [json-pointer:/chunks/0]".
      for (const t of tasks) {
        if (!("icon" in t)) continue;
        const why = iconRefusal((t as { icon?: unknown }).icon);
        if (why) return refuse(refused, `task ${t.id} with ${why}`, "invalid_arguments");
      }
      if (stopped.has(ts)) return refuse(refused, "task update on a stopped stream", "message_not_in_streaming_state");
      landed.push(call);
      if (opts.taskRejects !== undefined) throw opts.taskRejects;
    },
    async setPlanTitle(channel, ts, title) {
      record({ kind: "heading", channel, ts, title });
      if (stopped.has(ts)) refuse(refused, "plan title on a stopped stream", "message_not_in_streaming_state");
    },
    async stopStream(channel, ts) {
      record({ kind: "stopStream", channel, ts });
      if (stopped.has(ts)) return refuse(refused, "stop on a stopped stream", "message_not_in_streaming_state");
      stopped.add(ts);
    },
    async setSessionStatus(channel, threadTs, status) {
      record({ kind: "status", channel, threadTs, status });
      if (opts.statusThrows !== undefined) throw opts.statusThrows;
      return opts.status ?? { ok: true };
    },
    async renameSession(channel, threadTs, title) {
      record({ kind: "rename", channel, threadTs, title });
    },
  };

  return {
    client,
    calls,
    landed,
    lines,
    refused,
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
  | {
      kind: "message";
      channel: string;
      threadTs?: string;
      text: string;
      blocks: boolean;
      /** The blocks themselves, when there were any — what an answer's
       *  `markdown` block and its fallback rungs are asserted on. */
      blockList?: unknown[];
    }
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
  /** Refuse a post whose blocks include any of these types, the way Slack
   *  refuses a block it will not take on a surface — so each rung of the
   *  answer's fallback ladder is reachable. Answered `invalid_blocks`, with
   *  `response_metadata.messages` naming the block. */
  refusesBlockTypes?: readonly string[];
  /** Fail every post with this error code and `response_metadata.messages` —
   *  a failure that is not about the blocks (`ratelimited`), or one that
   *  points at them only through its messages (`invalid_arguments`). */
  postFailsWith?: { error: string; messages?: readonly string[] };
  /** Refuse `appendStream`, so the finish-failed fallback is reachable. */
  appendFails?: boolean;
  /** Refuse `stopStream`. */
  stopFails?: boolean;
}

export interface RecordingPosting {
  client: PostingClient;
  calls: PostingCall[];
  /** Every call Slack would have refused, with its error code. */
  refused: SlackRefusal[];
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
  const refused: SlackRefusal[] = [];
  let posted = 0;
  const stopped = new Set<string>();

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
        ...(input.blocks ? { blockList: input.blocks } : {}),
      });
      if (refuseBlocks(refused, "post", input.blocks)) return { ok: false, error: "invalid_blocks" };
      const at = (input.blocks ?? []).findIndex((b) => opts.refusesBlockTypes?.includes(String(b.type)));
      if (at >= 0) {
        const type = String(input.blocks?.[at]?.type);
        refuse(refused, `post with a ${type} block`, "invalid_blocks");
        return {
          ok: false,
          error: "invalid_blocks",
          response_metadata: { messages: [`[ERROR] unsupported type: ${type} [json-pointer:/blocks/${at}]`] },
        } as { ok: boolean };
      }
      if (opts.postFailsWith) {
        const { error, messages } = opts.postFailsWith;
        return { ok: false, error, ...(messages ? { response_metadata: { messages } } : {}) } as { ok: boolean };
      }
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
      if (stopped.has(ts)) {
        refuse(refused, "append on a stopped stream", "message_not_in_streaming_state");
        return false;
      }
      return !opts.appendFails;
    },
    async stopStream(channel, ts, blocks) {
      calls.push({ kind: "stopStream", channel, ts, blocks: !!blocks?.length });
      if (refuseBlocks(refused, "stop", blocks)) return false;
      if (stopped.has(ts)) {
        refuse(refused, "stop on a stopped stream", "message_not_in_streaming_state");
        return false;
      }
      if (opts.stopFails) return false;
      stopped.add(ts);
      return true;
    },
  };

  return {
    client,
    calls,
    refused,
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
