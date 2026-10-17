// The blueprint check's plan card as the Worker wires it (#1344): which job
// gets a card at all — the plan-stream switch on, a Slack user id and the
// presser's workspace — and the workspace read off the press.

import { test } from "node:test";
import assert from "node:assert/strict";

import { checkPlanRecipient } from "../src/blueprint-upkeep/env";
import { checkPressOf } from "../src/slack/interactive";

const ON = { SLACK_STREAM_PLAN: "on", SLACK_STREAM_MARKUP_PROBE: "pass:2026-09-22 DM" };
const JOB = { offerTs: "1.2", run: "r1", by: "U2PRESSER", team: "T0PLUS" };

test("a job opens its card for the presser in their workspace while the plan-stream switch is on", () => {
  assert.deepEqual(checkPlanRecipient(ON, JOB), { userId: "U2PRESSER", team: "T0PLUS" });
});

test("no card with the switch off, or on without a recorded probe pass", () => {
  assert.equal(checkPlanRecipient({ ...ON, SLACK_STREAM_PLAN: "off" }, JOB), null);
  assert.equal(checkPlanRecipient({ SLACK_STREAM_PLAN: "on" }, JOB), null);
});

test("no card without the presser's workspace, or for a presser who is not a Slack user id", () => {
  const { team: _team, ...noTeam } = JOB;
  assert.equal(checkPlanRecipient(ON, noTeam), null);
  assert.equal(checkPlanRecipient(ON, { ...JOB, by: "someone" }), null);
  const { by: _by, ...noBy } = JOB;
  assert.equal(checkPlanRecipient(ON, noBy), null);
});

test("the press carries the presser's workspace, from the user or else the envelope's team", () => {
  const base = { type: "block_actions", channel: { id: "C1" }, message: { ts: "1.2" } };
  assert.deepEqual(checkPressOf({ ...base, user: { id: "U2PRESSER", team_id: "T0PLUS" }, team: { id: "T9OTHER" } }), {
    channel: "C1",
    offerTs: "1.2",
    userId: "U2PRESSER",
    team: "T0PLUS",
  });
  assert.equal(checkPressOf({ ...base, user: { id: "U2PRESSER" }, team: { id: "T0PLUS" } })?.team, "T0PLUS");
  assert.equal("team" in (checkPressOf({ ...base, user: { id: "U2PRESSER" } }) ?? {}), false);
  assert.equal(checkPressOf({ type: "block_actions", user: { id: "U2PRESSER" } }), null);
});
