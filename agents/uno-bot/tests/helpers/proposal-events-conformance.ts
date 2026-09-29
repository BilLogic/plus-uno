// The ProposalEventLog conformance suite.
//
// Written only against the ports, and handed its runner, so the same cases run
// against the in-memory adapter under `node --test`
// (`tests/proposal-events-in-memory.test.ts`) and against the D1 adapter under
// workerd with the real migrations applied (`tests/workerd/usage-log.conformance.test.ts`).
// A factory hands back the event log AND the usage log beside it, because
// `noteSelfFiledTicket` writes a turn's row: one database in production.
import assert from "node:assert/strict";

import type { ProposalEvent, ProposalEventLog } from "../../src/usage/proposal-events";
import type { UsageLog } from "../../src/usage/store";
import { turnRecord, type ConformanceRunner } from "./usage-log-conformance";

const HOUR = 60 * 60 * 1000;

/** A fully populated staged event — every nullable column set. */
export function stagedRow(over: Partial<ProposalEvent> = {}): ProposalEvent {
  return {
    proposalId: "1700000000.000300",
    event: "staged",
    at: 1_700_000_000_300,
    via: "turn",
    channelId: "C1",
    testTraffic: false,
    originProposalId: null,
    turnId: "C1:1700000000.000200",
    requesterId: "U1",
    tools: ["github_issue_create", "notion_update"],
    ttlMs: HOUR,
    requesterRole: "pm",
    aimedAtRole: "dev",
    threadStartedAt: 1_700_000_000_100,
    ticketUrl: null,
    actorId: null,
    confirmedByOther: null,
    ...over,
  };
}

/** A bare event of any kind on the same card. */
export function eventRow(event: ProposalEvent["event"], over: Partial<ProposalEvent> = {}): ProposalEvent {
  return {
    ...stagedRow(),
    event,
    at: 1_700_000_100_000,
    via: "reaction",
    turnId: null,
    requesterId: null,
    tools: [],
    ttlMs: null,
    requesterRole: null,
    aimedAtRole: null,
    threadStartedAt: null,
    ...over,
  };
}

export function runProposalEventConformance(
  label: string,
  make: () => { events: ProposalEventLog; turns: UsageLog },
  runner: ConformanceRunner,
): void {
  const it = (name: string, fn: () => Promise<void>) => runner.it(`[${label}] ${name}`, fn);

  it("a recorded event reads back field for field", async () => {
    const { events } = make();
    const staged = stagedRow();
    await events.record(staged);
    assert.deepEqual(await events.eventsOf(staged.proposalId), [staged]);
  });

  it("a card nobody recorded has no events", async () => {
    const { events } = make();
    assert.deepEqual(await events.eventsOf("1.1"), []);
  });

  it("a card's history reads oldest first, whatever order it was written in", async () => {
    const { events } = make();
    const confirmed = eventRow("confirmed", { actorId: "U2", confirmedByOther: true });
    const refused = eventRow("refused_stale", { at: 1_700_000_200_000, via: "executor" });
    await events.record(refused);
    await events.record(stagedRow());
    await events.record(confirmed);
    assert.deepEqual(await events.eventsOf("1700000000.000300"), [stagedRow(), confirmed, refused]);
  });

  it("empty columns read back as null and empty — never undefined — and a false stays false", async () => {
    const { events } = make();
    const bare = eventRow("confirmed", { channelId: null, actorId: "U1", confirmedByOther: false });
    await events.record(bare);
    assert.deepEqual(await events.eventsOf(bare.proposalId), [bare]);
  });

  it("keeps the first write of an event and ignores the second", async () => {
    // A retried alarm, or two paths recording one staging, leave one row.
    const { events } = make();
    await events.record(stagedRow());
    await events.record(stagedRow({ at: 9, via: "restage", requesterRole: null }));
    assert.deepEqual(await events.eventsOf("1700000000.000300"), [stagedRow()]);
  });

  it("an event changed after it was written changes nothing stored", async () => {
    const { events } = make();
    const staged = stagedRow();
    await events.record(staged);
    staged.tools.push("notion_create");
    assert.deepEqual(await events.eventsOf(staged.proposalId), [stagedRow()]);
  });

  it("finds a card past its lifetime with no outcome, dated to when it aged out", async () => {
    const { events } = make();
    const staged = stagedRow();
    await events.record(staged);
    assert.deepEqual(await events.overdue(staged.at + HOUR - 1), []);
    assert.deepEqual(await events.overdue(staged.at + HOUR), [
      { proposalId: staged.proposalId, expiredAt: staged.at + HOUR },
    ]);
  });

  it("does not find a card that was confirmed, cancelled, superseded or already expired", async () => {
    const { events } = make();
    const outcomes = ["confirmed", "cancelled", "superseded", "expired"] as const;
    for (const [i, event] of outcomes.entries()) {
      const id = `1700000000.00040${i}`;
      await events.record(stagedRow({ proposalId: id }));
      await events.record(eventRow(event, { proposalId: id }));
    }
    // A refused stale write is not an outcome of its own: it follows a ✅.
    await events.record(stagedRow({ proposalId: "1700000000.000500" }));
    await events.record(eventRow("refused_stale", { proposalId: "1700000000.000500" }));
    assert.deepEqual(
      (await events.overdue(1_800_000_000_000)).map((o) => o.proposalId),
      ["1700000000.000500"],
    );
  });

  it("records exactly one expired event however many passes run", async () => {
    const { events } = make();
    const staged = stagedRow();
    await events.record(staged);
    const now = staged.at + 2 * HOUR;
    assert.equal(await events.expireOverdue(now), 1);
    assert.equal(await events.expireOverdue(now + HOUR), 0);
    assert.deepEqual(await events.eventsOf(staged.proposalId), [
      staged,
      eventRow("expired", { at: staged.at + HOUR, via: "end-of-day" }),
    ]);
    assert.deepEqual(await events.overdue(now), []);
  });

  it("carries the staged row's test-traffic flag onto every later event of the card, the expiry included", async () => {
    const { events } = make();
    await events.record(stagedRow({ testTraffic: true }));
    await events.record(eventRow("refused_stale", { testTraffic: null }));
    await events.expireOverdue(1_800_000_000_000);
    assert.deepEqual(
      (await events.eventsOf("1700000000.000300")).map((e) => [e.event, e.testTraffic]),
      [
        ["staged", true],
        ["refused_stale", true],
        ["expired", true],
      ],
    );
  });

  it("reads an event with no staged row to inherit from as real traffic", async () => {
    const { events } = make();
    await events.record(eventRow("confirmed", { testTraffic: null }));
    assert.equal((await events.eventsOf("1700000000.000300"))[0]?.testTraffic, false);
  });

  it("gives a re-staged card its original's turn and test-traffic flag", async () => {
    const { events } = make();
    await events.record(stagedRow({ testTraffic: true }));
    await events.record(
      stagedRow({
        proposalId: "1700000000.000900",
        via: "restage",
        turnId: null,
        testTraffic: null,
        originProposalId: "1700000000.000300",
      }),
    );
    const [restaged] = await events.eventsOf("1700000000.000900");
    assert.equal(restaged?.turnId, "C1:1700000000.000200");
    assert.equal(restaged?.testTraffic, true);
    assert.equal(restaged?.originProposalId, "1700000000.000300");
  });

  it("puts a ticket on the staging turn's row, and keeps one it already names", async () => {
    const { events, turns } = make();
    await turns.record(turnRecord({ selfFiledTicketUrl: null }));
    await events.record(stagedRow());
    await events.noteSelfFiledTicket("1700000000.000300", "https://github.com/BilLogic/plus-uno/issues/901");
    assert.equal(
      (await turns.get("C1:1700000000.000200"))?.selfFiledTicketUrl,
      "https://github.com/BilLogic/plus-uno/issues/901",
    );
    await events.noteSelfFiledTicket("1700000000.000300", "https://github.com/BilLogic/plus-uno/issues/902");
    assert.equal(
      (await turns.get("C1:1700000000.000200"))?.selfFiledTicketUrl,
      "https://github.com/BilLogic/plus-uno/issues/901",
    );
  });

  it("keeps a ticket on the card's staged row even before the turn's row exists", async () => {
    // The ✅ can land before the staging turn writes its own row; that turn
    // reads it back from here (`ticketFor`).
    const { events, turns } = make();
    await events.record(stagedRow());
    assert.equal(await events.ticketFor("1700000000.000300"), null);
    await events.noteSelfFiledTicket("1700000000.000300", "https://github.com/BilLogic/plus-uno/issues/903");
    assert.equal(await events.ticketFor("1700000000.000300"), "https://github.com/BilLogic/plus-uno/issues/903");
    assert.equal(await turns.get("C1:1700000000.000200"), null);
  });

  it("gives a re-staged card with no channel of its own its original's", async () => {
    const { events } = make();
    await events.record(stagedRow());
    await events.record(
      stagedRow({ proposalId: "1700000000.000900", via: "restage", channelId: null, originProposalId: "1700000000.000300" }),
    );
    assert.equal((await events.eventsOf("1700000000.000900"))[0]?.channelId, "C1");
  });

  it("puts a ticket nowhere when no turn staged the card", async () => {
    const { events, turns } = make();
    await turns.record(turnRecord({ selfFiledTicketUrl: null }));
    await events.record(stagedRow({ turnId: null, via: "worker" }));
    await events.noteSelfFiledTicket("1700000000.000300", "https://github.com/BilLogic/plus-uno/issues/901");
    assert.equal((await turns.get("C1:1700000000.000200"))?.selfFiledTicketUrl, null);
  });
}
