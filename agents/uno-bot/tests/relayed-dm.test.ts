// The relayed DM: what the recipient reads, and what a ✅ actually sends.
//
// Two seams, driven from outside. The WRAPPER is a pure renderer — the
// attribution line and the link back are the Worker's, so the model cannot
// leave either out, and this is where their shape is pinned. The EXECUTOR takes
// its Slack client by name, so an approved batch runs here through Gate's own
// batch runner against a fake client: what is asserted is who got a DM and what
// it said, never the order of calls inside.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  relayFailure,
  relayRecipientId,
  renderRelayedDm,
} from "../src/tools/relayed-dm-render";
import { executeRelayDm, relayMemoryOver, type RelayMemory, type RelaySlack } from "../src/tools/relay-dm";
import { createInMemoryThreadState, DM_CONVERSATION } from "../src/thread-state/index";
import { runOperations } from "../src/gate/index";
import { preflight } from "../src/agent/preflight";
import type { Env, SlackContext } from "../src/types";

// ── the wrapper ──────────────────────────────────────────────────────────────

describe("renderRelayedDm", () => {
  const PERMALINK = "https://plus.slack.com/archives/C1/p1700000000000200";

  it("opens with who asked and closes with the link back", () => {
    const text = renderRelayedDm({
      requesterId: "U0REQ1",
      text: "RM-2436 is Ready for QA: <https://notion.so/rm-2436|Calendar Sync>",
      permalink: PERMALINK,
      originIsDm: false,
    });
    const lines = text.split("\n");
    assert.equal(lines[0], "<@U0REQ1> asked me to pass this on:");
    assert.ok(text.includes("RM-2436 is Ready for QA: <https://notion.so/rm-2436|Calendar Sync>"));
    assert.ok(lines.at(-1)!.includes(PERMALINK), "the last line carries the permalink");
  });

  it("keeps a multi-line body verbatim, between the two lines the Worker adds", () => {
    const body = "Two things:\n- the card is Ready for QA\n- the Figma link is in the PRD";
    const text = renderRelayedDm({ requesterId: "U0REQ1", text: body, permalink: PERMALINK, originIsDm: false });
    assert.ok(text.includes(`\n\n${body}\n\n`), text);
  });

  it("does not promise the recipient a link into someone else's DM", () => {
    const fromDm = renderRelayedDm({
      requesterId: "U0REQ1",
      text: "RM-2436 is Ready for QA.",
      permalink: "https://plus.slack.com/archives/D1/p1700000000000200",
      originIsDm: true,
    });
    const last = fromDm.split("\n").at(-1)!;
    assert.ok(last.includes("https://plus.slack.com/archives/D1/p1700000000000200"), "still included, for the record");
    assert.match(last, /only they can open/i);
    assert.doesNotMatch(fromDm, /you can (open|read|see)/i);
  });

  it("still attributes the relay when no permalink came back", () => {
    const thin = renderRelayedDm({ requesterId: "U0REQ1", text: "hi", permalink: null, originIsDm: false });
    assert.equal(thin, "<@U0REQ1> asked me to pass this on:\n\nhi");
  });
});

describe("relayRecipientId", () => {
  it("reads a bare id or a mention, and nothing else", () => {
    assert.equal(relayRecipientId("U0ABC123"), "U0ABC123");
    assert.equal(relayRecipientId(" <@U0ABC123> "), "U0ABC123");
    assert.equal(relayRecipientId("<@W0ABC123|coco>"), "W0ABC123");
    assert.equal(relayRecipientId("Coco"), null);
    assert.equal(relayRecipientId("C0ABC123"), null);
    assert.equal(relayRecipientId(undefined), null);
  });
});

describe("relayFailure", () => {
  it("names the cause and a next route for each Slack refusal the relay meets", () => {
    for (const error of ["user_disabled", "cannot_dm_bot", "channel_not_found", "user_not_found", "ratelimited"]) {
      const { cause, next } = relayFailure(error);
      assert.ok(cause.length > 0 && next.length > 0, error);
    }
    assert.match(relayFailure("user_disabled").cause, /deactivated/);
    assert.match(relayFailure("cannot_dm_bot").cause, /bot/);
  });

  it("reads account_inactive as the bot's own credential, not a deactivated recipient", () => {
    // Slack answers `account_inactive` when the TOKEN's user or workspace is
    // gone — the same reading `slack-search.ts` gives it.
    const { cause, next } = relayFailure("account_inactive");
    assert.doesNotMatch(cause, /deactivated/);
    assert.match(cause, /credential/);
    assert.match(next, /Bill/);
  });

  it("offers a retry only for a transient refusal", () => {
    for (const transient of ["ratelimited", "network_error", "http_503", "internal_error"]) {
      assert.match(relayFailure(transient).next, /try again/, transient);
    }
    for (const lasting of [
      "missing_scope",
      "not_authed",
      "invalid_auth",
      "restricted_action",
      "not_allowed_token_type",
      "something_new",
    ]) {
      assert.doesNotMatch(relayFailure(lasting).next, /try again/, lasting);
    }
  });
});

describe("preflight on a relay", () => {
  // The substance check before a card is staged: a name is not a recipient.
  // The dm_relay arm reads nothing from `Env`, so none is supplied.
  const ctx = { env: {} as Env, prd: null };

  it("asks rather than stages when the recipient is a name, not a person", async () => {
    const ask = await preflight("dm_relay", { recipient: "Coco", text: "RM-2436 is Ready for QA." }, ctx);
    assert.ok(ask, "a name must not reach the card");
    assert.match(ask.ask, /which one/);
  });

  it("asks for the message when there is none", async () => {
    assert.ok(await preflight("dm_relay", { recipient: "<@U0COCO>", text: "  " }, ctx));
  });

  it("lets a resolved recipient and a real message through", async () => {
    assert.equal(await preflight("dm_relay", { recipient: "<@U0COCO>", text: "RM-2436 is Ready for QA." }, ctx), null);
  });
});

// ── the executor, behind the Gate ────────────────────────────────────────────

interface FakeSlack extends RelaySlack {
  opened: string[];
  posts: Array<{ channel: string; text: string; thread_ts?: string }>;
}

/** What each recipient's DM conversation was told the bot said. */
interface FakeMemory extends RelayMemory {
  remembered: Array<{ channel: string; content: string; ts?: string }>;
}

function fakeMemory(opts: { fail?: boolean } = {}): FakeMemory {
  const remembered: FakeMemory["remembered"] = [];
  return {
    remembered,
    async remember(channel, turn) {
      if (opts.fail) throw new Error("store down");
      remembered.push({ channel, ...turn });
    },
  };
}

function fakeSlack(opts: { refuse?: Record<string, string>; permalink?: string | null } = {}): FakeSlack {
  const opened: string[] = [];
  const posts: FakeSlack["posts"] = [];
  return {
    opened,
    posts,
    async openDm(userId) {
      opened.push(userId);
      const error = opts.refuse?.[userId];
      return error ? { ok: false, error } : { ok: true, channel: `D-${userId}` };
    },
    async postMessage(message) {
      posts.push(message);
      return { ok: true, ts: `1700000001.00000${posts.length}` };
    },
    async permalink(channel, ts) {
      return opts.permalink === undefined
        ? `https://plus.slack.com/archives/${channel}/p${ts.replace(".", "")}`
        : opts.permalink;
    },
  };
}

const CONTEXT: SlackContext = {
  channel: "C1",
  threadTs: "1700000000.000100",
  replyTs: "1700000000.000100",
  userMsgTs: "1700000000.000200",
  requestedBy: "U0REQ1",
};

describe("an approved relay", () => {
  it("opens exactly one DM per recipient and sends each the wrapped text", async () => {
    const slack = fakeSlack();
    const operations = [
      { toolName: "dm_relay", input: { recipient: "<@U0COCO>", text: "RM-2436 is Ready for QA." } },
      { toolName: "dm_relay", input: { recipient: "U0MERYEM", text: "RM-2436 is Ready for QA." } },
    ];
    const outcomes = await runOperations(operations, (op) =>
      executeRelayDm({ slack, memory: fakeMemory() }, op.input, { ...CONTEXT, batched: true }),
    );

    assert.deepEqual(outcomes.map((o) => o.ok), [true, true]);
    assert.deepEqual(slack.opened, ["U0COCO", "U0MERYEM"]);
    const dms = slack.posts.filter((p) => p.channel.startsWith("D-"));
    assert.deepEqual(dms.map((p) => p.channel), ["D-U0COCO", "D-U0MERYEM"]);
    for (const dm of dms) {
      assert.ok(dm.text.startsWith("<@U0REQ1> asked me to pass this on:"), dm.text);
      assert.ok(dm.text.includes("RM-2436 is Ready for QA."));
      assert.ok(dm.text.includes("https://plus.slack.com/archives/C1/p1700000000000200"), dm.text);
    }
    // In a batch the thread hears ONE outcome — the Gate's summary, which
    // names each recipient from these results — not a line per recipient too.
    assert.equal(slack.posts.filter((p) => p.channel === "C1").length, 0);
    assert.match(outcomes[0]!.message, /Sent to <@U0COCO>/);
    assert.match(outcomes[1]!.message, /Sent to <@U0MERYEM>/);
  });

  it("confirms a single relay in the requesting thread, under the real reply ts", async () => {
    const slack = fakeSlack();
    await executeRelayDm({ slack, memory: fakeMemory() }, { recipient: "U0COCO", text: "hi" }, CONTEXT);
    const notes = slack.posts.filter((p) => p.channel === "C1");
    assert.equal(notes.length, 1);
    assert.equal(notes[0]!.thread_ts, CONTEXT.replyTs);
    assert.match(notes[0]!.text, /Sent to <@U0COCO>/);
  });

  it("links a DM-origin request without promising the recipient they can open it", async () => {
    const slack = fakeSlack();
    await executeRelayDm(
      { slack, memory: fakeMemory() },
      { recipient: "U0COCO", text: "RM-2436 is Ready for QA." },
      { ...CONTEXT, channel: "D0REQUESTER", threadTs: "dm" },
    );
    const dm = slack.posts.find((p) => p.channel === "D-U0COCO")!;
    assert.match(dm.text, /archives\/D0REQUESTER\//);
    assert.match(dm.text, /only they can open/i);
  });

  it("answers a Slack refusal with its cause and a next route, and sends nothing", async () => {
    const slack = fakeSlack({ refuse: { U0GONE: "user_disabled" } });
    const [outcome] = await runOperations(
      [{ toolName: "dm_relay", input: { recipient: "U0GONE", text: "hello" } }],
      (op) => executeRelayDm({ slack, memory: fakeMemory() }, op.input, CONTEXT),
    );
    assert.equal(outcome!.ok, false);
    assert.match(outcome!.message, /deactivated/);
    assert.equal(slack.posts.filter((p) => p.channel.startsWith("D-")).length, 0);
    const note = slack.posts.find((p) => p.channel === "C1")!;
    assert.match(note.text, /<@U0GONE>/);
    assert.match(note.text, /deactivated/);
    assert.equal(note.thread_ts, CONTEXT.replyTs);
  });

  it("carries on past one recipient Slack refused", async () => {
    const slack = fakeSlack({ refuse: { U0COCO: "cannot_dm_bot" } });
    const outcomes = await runOperations(
      [
        { toolName: "dm_relay", input: { recipient: "U0COCO", text: "hello" } },
        { toolName: "dm_relay", input: { recipient: "U0MERYEM", text: "hello" } },
      ],
      (op) => executeRelayDm({ slack, memory: fakeMemory() }, op.input, CONTEXT),
    );
    assert.deepEqual(outcomes.map((o) => o.ok), [false, true]);
    assert.deepEqual(slack.posts.filter((p) => p.channel.startsWith("D-")).map((p) => p.channel), ["D-U0MERYEM"]);
  });

  it("refuses a recipient that is not a user id without opening anything", async () => {
    const slack = fakeSlack();
    const result = JSON.parse(await executeRelayDm({ slack, memory: fakeMemory() }, { recipient: "Coco", text: "hi" }, CONTEXT));
    assert.equal(result.ok, false);
    assert.deepEqual(slack.opened, []);
  });

  it("will not send an unattributed relay", async () => {
    const slack = fakeSlack();
    const { requestedBy: _unused, ...anonymous } = CONTEXT;
    const result = JSON.parse(await executeRelayDm({ slack, memory: fakeMemory() }, { recipient: "U0COCO", text: "hi" }, anonymous));
    assert.equal(result.ok, false);
    assert.deepEqual(slack.opened, []);
  });

  it("remembers what it sent in the recipient's DM, so their reply has it to go on", async () => {
    // A reply typed in the composer reads the DM's history from the store, not
    // from a Slack thread — so a relay the store never heard of is one the bot
    // cannot talk about when the recipient asks what it is.
    const slack = fakeSlack();
    const memory = fakeMemory();
    await executeRelayDm({ slack, memory }, { recipient: "U0COCO", text: "RM-2436 is Ready for QA." }, CONTEXT);
    const dm = slack.posts.find((p) => p.channel === "D-U0COCO")!;
    assert.deepEqual(memory.remembered.map((r) => r.channel), ["D-U0COCO"]);
    assert.equal(memory.remembered[0]!.content, dm.text, "remembered as the recipient read it");
    assert.ok(memory.remembered[0]!.ts, "under the ts Slack gave the DM");
  });

  it("stores the relay where the recipient's unthreaded reply reads its history", async () => {
    // The real memory over a real (in-memory) store: an unthreaded DM line
    // reads the conversation `{ channel, DM_CONVERSATION }`, so that is where
    // the recipient's "what's this about?" finds what was sent.
    const store = createInMemoryThreadState();
    const slack = fakeSlack();
    await executeRelayDm(
      { slack, memory: relayMemoryOver(store) },
      { recipient: "U0COCO", text: "RM-2436 is Ready for QA." },
      CONTEXT,
    );
    const history = await store.readHistory({ channel: "D-U0COCO", thread: DM_CONVERSATION });
    assert.equal(history.length, 1);
    assert.equal(history[0]!.role, "assistant");
    assert.equal(history[0]!.content, slack.posts.find((p) => p.channel === "D-U0COCO")!.text);
    assert.deepEqual(await store.readHistory({ channel: "C1", thread: CONTEXT.threadTs }), [], "nothing in the requester's thread");
  });

  it("remembers nothing for a relay Slack refused", async () => {
    const slack = fakeSlack({ refuse: { U0GONE: "user_disabled" } });
    const memory = fakeMemory();
    await executeRelayDm({ slack, memory }, { recipient: "U0GONE", text: "hello" }, CONTEXT);
    assert.deepEqual(memory.remembered, []);
  });

  it("still reports a sent relay as sent when remembering it fails", async () => {
    const slack = fakeSlack();
    const result = JSON.parse(
      await executeRelayDm({ slack, memory: fakeMemory({ fail: true }) }, { recipient: "U0COCO", text: "hi" }, CONTEXT),
    );
    assert.equal(result.ok, true);
    assert.match(slack.posts.find((p) => p.channel === "C1")!.text, /Sent to <@U0COCO>/);
  });
});
