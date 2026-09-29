// What a card leaves on the usage record — the builders, the stale-write rule,
// the end-of-day expiry pass on a fake clock, and a write that fails costing
// the card nothing.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { GateVerdict, OperationOutcome } from "../src/gate/index";
import { PROPOSAL_TTL_MS, type PendingProposal } from "../src/thread-state/index";
import {
  createInMemoryProposalEventLog,
  executionEvents,
  recordProposalEvents,
  runProposalExpiry,
  stagedEvent,
  verdictEvents,
  type ProposalEventLog,
  type TeamRole,
} from "../src/usage/index";

const ROLES: Record<string, TeamRole> = { UPM: "pm", UDEV: "dev", UDES: "design" };

/** A card staged at 1_700_000_300_000 ms in a thread begun 200 s before. */
const CARD: PendingProposal = {
  operations: [
    { toolName: "github_issue_create", input: { title: "Fix the toggle" } },
    { toolName: "notion_update", input: { page_id: "p1" } },
  ],
  toolName: "github_issue_create",
  input: { title: "Fix the toggle" },
  channel: "C1",
  threadTs: "1700000100.000000",
  replyTs: "1700000100.000000",
  userMsgTs: "1700000250.000000",
  proposalTs: "1700000300.000000",
  proposalText: "(card)",
  requesterUserId: "UPM",
};

describe("the staged event", () => {
  it("dates the card by its own ts and the thread by its root, and names what the batch runs", () => {
    const e = stagedEvent({ proposal: CARD, at: 5, via: "turn", turnId: "C1:1700000250.000000", roles: ROLES });
    assert.equal(e.proposalId, CARD.proposalTs);
    assert.equal(e.event, "staged");
    assert.equal(e.at, 1_700_000_300_000);
    assert.equal(e.threadStartedAt, 1_700_000_100_000);
    assert.equal(e.turnId, "C1:1700000250.000000");
    assert.equal(e.requesterId, "UPM");
    assert.deepEqual(e.tools, ["github_issue_create", "notion_update"]);
    assert.equal(e.ttlMs, PROPOSAL_TTL_MS);
    assert.equal(e.channelId, "C1");
  });

  it("records the requester's role and the role of the person the ask named", () => {
    const e = stagedEvent({
      proposal: CARD,
      at: 5,
      via: "turn",
      askText: "<@UDEV> can you file that? cc <@UPM>",
      roles: ROLES,
    });
    assert.equal(e.requesterRole, "pm");
    assert.equal(e.aimedAtRole, "dev");
  });

  it("skips the requester's own mention and records no role for someone off the map", () => {
    const named = (askText: string) =>
      stagedEvent({ proposal: CARD, at: 5, via: "turn", askText, roles: ROLES }).aimedAtRole;
    assert.equal(named("me <@UPM> and <@UDES|dana>"), "design");
    assert.equal(named("<@U0NOTONMAP> please"), null);
    assert.equal(named("no one named here"), null);
    assert.equal(stagedEvent({ proposal: { ...CARD, requesterUserId: "U0NEW" }, at: 5, via: "turn", roles: ROLES }).requesterRole, null);
  });

  it("carries the card's own lifetime, and falls back to the clock for a ts that is not Slack's", () => {
    const e = stagedEvent({
      proposal: { ...CARD, ttlMs: 72 * 3_600_000, proposalTs: "eval-card", replyTs: "dm", userMsgTs: "eval" },
      at: 42,
      via: "worker",
    });
    assert.equal(e.ttlMs, 72 * 3_600_000);
    assert.equal(e.at, 42);
    assert.equal(e.threadStartedAt, null);
  });
});

describe("the DM rule `turns` keeps", () => {
  it("stores no channel for a DM card and records no one a DM ask named", () => {
    const dm = { ...CARD, channel: "D0REQUESTER" };
    const e = stagedEvent({ proposal: dm, at: 5, via: "turn", askText: "<@UDEV> can you file that?", roles: ROLES });
    assert.equal(e.channelId, null);
    assert.equal(e.aimedAtRole, null);
    // The requester's own role is not about anyone else, and stays.
    assert.equal(e.requesterRole, "pm");
    const confirmed = verdictEvents(won(dm, "UDEV"), 9)[0]!;
    assert.equal(confirmed.channelId, null);
  });
});

describe("who confirmed", () => {
  it("is unknown, never 'someone else', on a card the Worker staged with no requester", () => {
    const worker = { ...CARD, requesterUserId: "" };
    assert.equal(verdictEvents(won(worker, "U0MEMBER1"), 9)[0]!.confirmedByOther, null);
    assert.equal(stagedEvent({ proposal: worker, at: 5, via: "worker" }).requesterId, null);
  });

  it("is true for someone other than the requester and false for the requester", () => {
    assert.equal(verdictEvents(won(CARD, "UDEV"), 9)[0]!.confirmedByOther, true);
    assert.equal(verdictEvents(won(CARD, "UPM"), 9)[0]!.confirmedByOther, false);
  });
});

function won(proposal: PendingProposal, userId: string): GateVerdict {
  return { outcome: "won", proposal, decision: "confirm", post: null, by: { door: "reaction", userId } };
}

describe("a refused stale write", () => {
  const outcome = (toolName: string, result: unknown): OperationOutcome => ({
    toolName,
    ok: true,
    result: JSON.stringify(result),
    message: "",
  });

  it("is one event per resolution, however many operations refused", () => {
    const events = executionEvents(
      CARD,
      [
        outcome("notion_update", { ok: false, status: "no_changes", refused: ["a", "b"], staleStamps: 2 }),
        outcome("notion_update", { ok: false, status: "no_changes", refused: ["c"], staleStamps: 1 }),
      ],
      9,
    );
    assert.deepEqual(events.map((e) => [e.event, e.via, e.at, e.proposalId]), [
      ["refused_stale", "executor", 9, CARD.proposalTs],
    ]);
  });

  it("is not a refusal for any other reason, nor a write that landed", () => {
    assert.deepEqual(
      executionEvents(
        CARD,
        [
          outcome("notion_update", { ok: true, replaced: 1, refused: ["x (content empty)"], staleStamps: 0 }),
          outcome("github_issue_create", { ok: true, issue_url: "https://github.com/BilLogic/plus-uno/issues/1" }),
          { toolName: "notion_update", ok: false, result: "not json", message: "" },
        ],
        9,
      ),
      [],
    );
  });
});

describe("the end-of-day expiry pass", () => {
  it("gives an untouched card exactly one expired event, dated to when it aged out", async () => {
    const log = createInMemoryProposalEventLog();
    await log.record(stagedEvent({ proposal: CARD, at: 0, via: "turn" }));
    const stagedAt = 1_700_000_300_000;
    // The pass the evening it was staged, the next one, and a retried alarm.
    let clock = stagedAt + PROPOSAL_TTL_MS - 1;
    assert.equal((await runProposalExpiry(log, clock, { dryRun: false })).expired, 0);
    clock = stagedAt + 24 * 3_600_000;
    assert.equal((await runProposalExpiry(log, clock, { dryRun: false })).expired, 1);
    assert.equal((await runProposalExpiry(log, clock, { dryRun: false })).expired, 0);
    clock += 24 * 3_600_000;
    assert.equal((await runProposalExpiry(log, clock, { dryRun: false })).expired, 0);

    const expired = (await log.eventsOf(CARD.proposalTs)).filter((e) => e.event === "expired");
    assert.deepEqual(expired.map((e) => [e.at, e.via]), [[stagedAt + PROPOSAL_TTL_MS, "end-of-day"]]);
  });

  it("writes nothing on a dry run, and says what it would have recorded", async () => {
    const log = createInMemoryProposalEventLog();
    await log.record(stagedEvent({ proposal: CARD, at: 0, via: "turn" }));
    const r = await runProposalExpiry(log, 1_800_000_000_000, { dryRun: true });
    assert.equal(r.expired, 0);
    assert.match(r.summary, /^1 proposal\(s\) would be recorded expired/);
    assert.deepEqual(log.events().map((e) => e.event), ["staged"]);
  });
});

describe("a write that fails", () => {
  it("is logged and swallowed, and the next event is still tried", async () => {
    const tried: string[] = [];
    const flaky: ProposalEventLog = {
      ...createInMemoryProposalEventLog(),
      async record(event) {
        tried.push(event.event);
        if (event.event === "superseded") throw new Error("D1 down");
      },
    };
    await recordProposalEvents(flaky, [
      { ...stagedEvent({ proposal: CARD, at: 0, via: "turn" }), event: "superseded" },
      stagedEvent({ proposal: CARD, at: 0, via: "turn" }),
    ]);
    assert.deepEqual(tried, ["superseded", "staged"]);
  });

  it("gives up on a write that never answers, within its timeout", async () => {
    const hung: ProposalEventLog = {
      ...createInMemoryProposalEventLog(),
      record: () => new Promise(() => {}),
    };
    const started = Date.now();
    await recordProposalEvents(hung, [stagedEvent({ proposal: CARD, at: 0, via: "turn" })], 20);
    assert.ok(Date.now() - started < 1_000);
  });
});
