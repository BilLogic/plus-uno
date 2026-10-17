// A proposal card expires on the rule's deadline without saying when, and
// says so once it has (#1316).
//
// No card shows "Expires …": not on the card, not in its text copy, not under
// a report. The deadline is still enforced — the store lets the card go at
// it. Once it passes, the card's message reads "Expired. Ask again for a
// fresh card." whichever path finds it: a late gesture, or the edit the
// store's alarm hands over at the deadline itself.
//
// Driven through the turn (a staged card enforces its deadline unshown; an
// expired card says so) on the Slack spelling, so the assertion is what a person reads;
// and through the alarm's hand-off and the runner job it queues, onto Slack's
// `chat.update`, for the card nobody touched.
import { expiryEdits, expiryFetchResponse } from "./helpers/report-expiry-fetch";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { decisionReport, reportMessage, reportRecord } from "../src/slack/decision-cards";
import { handOffExpiredCardsFor, onRunnerJob } from "../src/slack/events";
import { renderCardNote, renderGateNote } from "../src/slack/gate-note";
import { proposalCardBlocks, renderProposalCard } from "../src/slack/proposal-render";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import type { Env } from "../src/types";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { recordingDelivery, runTurn } from "../src/turn/index";
import { CHANNEL, CONVERSATION, harness, request } from "./helpers/turn-harness";

type Block = Record<string, any>;

/** Monday 12 October 2026, 14:00 ET. */
const MONDAY_2PM_ET = Date.UTC(2026, 9, 12, 18, 0);
/** The deadline the rule gives it: Tuesday 14:00 ET, in Unix seconds. */
const TUESDAY_2PM_ET_S = 1791914400;

const slackSpelling = () =>
  recordingDelivery({ spelling: { card: (c) => renderProposalCard(c), gateNote: renderGateNote } });

const FILE_IT = [{ text: "I'll file it.", toolCalls: [{ name: "notion_create", args: { title: "Reflection redesign" } }] }];

function contextLines(blocks: unknown[]): string[] {
  return (blocks as Block[]).filter((b) => b.type === "context").map((b) => String(b.elements?.[0]?.text ?? ""));
}

describe("a staged card enforces its deadline without showing it", () => {
  it("neither the card nor its text copy says it, and the store lets the card go at it", async () => {
    let now = MONDAY_2PM_ET;
    const h = harness({ now: () => now, threadState: createInMemoryThreadState({ now: () => now }), delivery: slackSpelling(), replies: FILE_IT });
    const outcome = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);
    assert.equal(outcome.disposition, "staged");
    const text = outcome.staged!.proposal.proposalText;
    assert.doesNotMatch(text, /Expires|<!date/, `the text copy says no deadline:\n${text}`);
    assert.doesNotMatch(JSON.stringify(proposalCardBlocks(text)), /Expires|<!date/, "nor does the card");
    // What the store holds is the rule's deadline.
    now = TUESDAY_2PM_ET_S * 1000;
    assert.equal((await h.threadState.getProposalByTs(outcome.staged!.proposal.proposalTs)).state, "found");
    now += 1;
    assert.equal((await h.threadState.getProposalByTs(outcome.staged!.proposal.proposalTs)).state, "expired");
  });
});

describe("the deadline enforced is the rule's, from when the card was staged", () => {
  it("a card staged just before Saturday 00:00 ET enforces Monday's, unshown, though the store stages it on Saturday", async () => {
    // Friday 16 October, 23:59:59.900 ET; the store's clock reads 20 ms later,
    // past midnight into Saturday, as a hop to the store can.
    const FRIDAY_LAST = Date.UTC(2026, 9, 17, 3, 59, 59, 900);
    const MONDAY_LAST = Date.UTC(2026, 9, 20, 3, 59, 59, 900);
    const HOP = 20;
    let now = FRIDAY_LAST;
    const threadState = createInMemoryThreadState({ now: () => now + HOP });
    const h = harness({ now: () => now, threadState, delivery: slackSpelling(), replies: FILE_IT });
    const outcome = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);
    assert.doesNotMatch(outcome.staged!.proposal.proposalText, /Expires/, "it says no deadline");
    const ts = outcome.staged!.proposal.proposalTs;
    now = MONDAY_LAST;
    assert.equal((await threadState.getProposalByTs(ts)).state, "found", "live through Monday's deadline, and the hop");
    now = MONDAY_LAST + 1;
    assert.equal((await threadState.getProposalByTs(ts)).state, "expired", "and not into Tuesday");
  });
});

describe("an expired card says so", () => {
  it("a late ✅ in its thread finds the card expired, and the card reads so", async () => {
    let now = MONDAY_2PM_ET;
    const threadState = createInMemoryThreadState({ now: () => now });
    const h = harness({ now: () => now, threadState, delivery: slackSpelling(), replies: FILE_IT });
    const staged = await runTurn(request({ text: "file a card for the reflection redesign" }), h.deps);
    assert.equal(staged.disposition, "staged");

    // The ✅ came in while the card was live and its turn ran just past the
    // deadline, queued behind another: the request holds the card, the store
    // has let it go.
    const pending = await threadState.getProposalByThread({ channel: CHANNEL, thread: CONVERSATION });
    assert.ok(pending);
    now = TUESDAY_2PM_ET_S * 1000 + 1;
    await runTurn(request({ text: "✅", userMsgTs: "1700000000.000300", pending }), h.deps);
    const notes = h.delivery.calls.flatMap((c) => (c.kind === "gate-note" ? [c] : []));
    assert.equal(notes.length, 1);
    assert.equal(notes[0]!.note.kind, "expired");
    const line = notes[0]!.card ? renderCardNote(notes[0]!.note) : renderGateNote(notes[0]!.note);
    assert.equal(line, "Expired. Ask again for a fresh card.");
    assert.equal(h.ran.length, 0, "nothing ran");
  });
});

describe("a card nobody touched says it expired at its deadline", () => {
  const CARD_TS = "1791828000.000200";
  async function stagedCard(over: Partial<PendingProposal> = {}) {
    const clock = { at: MONDAY_2PM_ET };
    const store = createInMemoryThreadState({ now: () => clock.at });
    const rendered = renderProposalCard({
      kind: "confirm",
      verb: "create a Notion page",
      fields: [{ label: "title", value: "Reflection redesign" }],
      caveats: [],
      operations: [],
      expiresAt: TUESDAY_2PM_ET_S * 1000,
    });
    const card: PendingProposal = {
      toolName: "notion_create",
      input: { title: "Reflection redesign" },
      channel: CHANNEL,
      threadTs: CONVERSATION,
      userMsgTs: CONVERSATION,
      proposalTs: CARD_TS,
      proposalText: rendered.text,
      requesterUserId: "U1",
      ...over,
    };
    await store.putProposal(card);
    return { store, clock, card };
  }

  /** The Worker's env as the hand-off and the job reach it: a runner that
   *  records what was queued, and the store behind the ThreadState stub. */
  function env(store: ThreadState, queued: unknown[] = []): Env {
    return {
      SLACK_BOT_TOKEN: "test-only",
      AGENT_RUNNER: { idFromName: (name: string) => name, get: (key: string) => ({ fetch: async (_url: string, init: { body: string }) => {
        queued.push({ key, job: JSON.parse(init.body).job });
        return new Response(null, { status: 202 });
      } }) },
      THREAD_STATE: { idFromName: (name: string) => name, get: () => store },
    } as unknown as Env;
  }

  const job = { kind: "card-expiry", proposalTs: CARD_TS } as const;

  it("queues the edit on a runner of its own, and the edit says the one expired line", async () => {
    const { store, clock, card } = await stagedCard();
    const queued: unknown[] = [];
    await handOffExpiredCardsFor(env(store, queued))([card]);
    assert.deepEqual(queued, [{ key: `${CHANNEL}:card-expiry:${CARD_TS}`, job }]);

    expiryEdits.length = 0;
    expiryFetchResponse({ ok: true });
    assert.equal(await onRunnerJob(env(store), job), "handled");
    assert.equal(expiryEdits.length, 0, "still live at its deadline: nothing to say yet");

    clock.at = TUESDAY_2PM_ET_S * 1000 + 1;
    assert.equal(await onRunnerJob(env(store), job), "handled");
    assert.equal(expiryEdits.length, 1);
    const edit = expiryEdits[0] as { channel: string; ts: string; blocks: Block[] };
    assert.equal(edit.channel, CHANNEL);
    assert.equal(edit.ts, CARD_TS);
    const lines = contextLines(edit.blocks);
    assert.equal(lines.at(-1), "Expired. Ask again for a fresh card.");
    assert.ok(!lines.some((l) => l.startsWith("Expires")), "the deadline gives way to the line");
    const buttons = edit.blocks.flatMap((b) => (b.type === "actions" ? b.elements.map((e: Block) => e.text.text) : []));
    assert.deepEqual(buttons, ["View"]);

    await onRunnerJob(env(store), job);
    assert.equal(expiryEdits.length, 1, "said once");
  });

  it("is still owed after a late gesture read the card as expired, and retried after Slack refuses it", async () => {
    const { store, clock } = await stagedCard();
    clock.at = TUESDAY_2PM_ET_S * 1000 + 1;
    assert.equal((await store.getProposalByTs(CARD_TS)).state, "expired");
    assert.equal((await store.getProposalByTs(CARD_TS)).state, "expired", "and still says so to the next one");

    expiryEdits.length = 0;
    expiryFetchResponse({ ok: false, error: "ratelimited" });
    await assert.rejects(onRunnerJob(env(store), job), /ratelimited/);
    expiryFetchResponse({ ok: true });
    await onRunnerJob(env(store), job);
    assert.equal(expiryEdits.length, 2);
    await onRunnerJob(env(store), job);
    assert.equal(expiryEdits.length, 2);
  });

  it("leaves a decided card, a replaced one and a report's item alone", async () => {
    for (const setup of [
      async (s: ThreadState) => void (await s.claimProposal(CARD_TS, { decision: "confirm", by: "U1" })),
      async (s: ThreadState) => void (await s.putProposal({ ...(await s.getProposalByThread({ channel: CHANNEL, thread: CONVERSATION }))!, proposalTs: "1791828000.000300" })),
    ]) {
      const { store, clock } = await stagedCard();
      await setup(store);
      clock.at = TUESDAY_2PM_ET_S * 1000 + 1;
      expiryEdits.length = 0;
      await onRunnerJob(env(store), job);
      assert.deepEqual(expiryEdits, []);
    }
    const { store, clock } = await stagedCard({ proposalTs: "1791828000.000200#a", item: { messageTs: "1791828000.000200", id: "a" } });
    clock.at = TUESDAY_2PM_ET_S * 1000 + 1;
    expiryEdits.length = 0;
    await onRunnerJob(env(store), { kind: "card-expiry", proposalTs: "1791828000.000200#a" });
    assert.deepEqual(expiryEdits, [], "its report redraws it");
  });
});

describe("the bot's own decision report enforces its deadline without showing it", () => {
  const items = ["a", "b"].map((id) => ({ id, title: `Page ${id}`, body: `Fix ${id}`, open: { url: `https://www.notion.so/${id}` } }));

  it("neither under its cards nor in its text copy, open or closed", () => {
    const report = decisionReport(items, "Two pages drifted.", { channel: "C1", expiresAt: TUESDAY_2PM_ET_S * 1000 });
    assert.ok(!contextLines(report.blocks).some((l) => l.startsWith("Expires")), "the morning message does not say it");
    assert.ok(!report.text.includes("Expires"), "nor its notification copy");
    assert.equal(messageBlocksRefusal(report.blocks), null);

    const record = reportRecord("C1", "1791828000.000900", report, 1000);
    assert.ok(!JSON.stringify(reportMessage(record).blocks).includes("Expires"), "nor a redraw");
    const oneLeft = { ...record, entries: [{ ...record.entries[0]!, state: { kind: "rejected" as const, by: "U1" } }, record.entries[1]!] };
    assert.ok(!JSON.stringify(reportMessage(oneLeft).blocks).includes("Expires"));
    const closed = { ...record, entries: record.entries.map((e) => ({ ...e, state: { kind: "expired" as const } })) };
    assert.ok(!reportMessage(closed).text.includes("Expires"), "nor a report with nothing left to decide");
    assert.ok(!contextLines(reportMessage(closed).blocks).some((l) => l.startsWith("Expires")));
  });
});
