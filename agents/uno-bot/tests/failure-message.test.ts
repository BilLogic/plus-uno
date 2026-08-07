import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFailureMessage, type FailureStage } from "../src/slack/failure-message";

const STAGES: FailureStage[] = ["context", "agent", "delivery", "internal"];

// The three parts the playbook asks for, on every stage, capacity or not.
test("every failure names progress, reassurance, and a next step", () => {
  for (const stage of STAGES) {
    for (const capacity of [false, true]) {
      const msg = buildFailureMessage({ stage, capacity });
      assert.ok(msg.split("\n").length >= 3, `${stage}/${capacity}: too few lines`);
      assert.match(msg, /nothing was created or changed/i, `${stage}/${capacity}`);
    }
  }
});

test("the old dead-end wording is gone", () => {
  for (const stage of STAGES) {
    const msg = buildFailureMessage({ stage });
    assert.doesNotMatch(msg, /something went wrong on my end/i);
    assert.doesNotMatch(msg, /I hit an internal error/i);
  }
});

test("stages differ — the message says how far it actually got", () => {
  const seen = new Set(STAGES.map((stage) => buildFailureMessage({ stage })));
  assert.equal(seen.size, STAGES.length);
});

test("a capacity failure says wait, not report", () => {
  const msg = buildFailureMessage({ stage: "agent", capacity: true });
  assert.match(msg, /over capacity/i);
  assert.match(msg, /couple of minutes/i);
});

test("an alert channel id renders as a channel mention", () => {
  const msg = buildFailureMessage({ stage: "agent", alertChannel: "C0ARJ2A3A69" });
  assert.match(msg, /<#C0ARJ2A3A69>/);
});
