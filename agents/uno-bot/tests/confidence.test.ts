// The confidence pre-check. Bias under test: a false negative costs one judge
// call, a false positive ships a non-compliant reply — so the "should have been
// caught" cases matter more than the "correctly passed" ones.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertsSomething,
  claimsFreshness,
  hasTrailingLabel,
  hasWovenConfidence,
  judgeConfidence,
  needsRepair,
  repairInstruction,
} from "../src/agent/confidence";

const GROUNDED = { retrievalRan: true } as const;
const CACHED = { retrievalRan: true, servedFromCache: true } as const;
const UNGROUNDED = { retrievalRan: false } as const;

describe("woven confidence detection", () => {
  it("recognises sureness the model earned by looking", () => {
    for (const text of [
      "I checked the Roadmap board just now — there are four maintenance cards.",
      "I've read the reconfirm step; it sits under Standard Scheduling.",
      "Checked the blueprint, and the lane is owned by Tutor Supervisors.",
      "From what I can see, the call-off threshold is twelve hours.",
    ]) {
      assert.equal(hasWovenConfidence(text), true, text);
    }
  });

  it("recognises sureness the model is disclaiming", () => {
    for (const text of [
      "Going from memory here, but the deadline is Friday.",
      "I'm not entirely sure — the docs I found are from May.",
      "I couldn't verify this against the board, so treat it as approximate.",
      "As far as I can tell, nothing else references that column.",
      "I think it moved to In Review, though it's worth double-checking.",
    ]) {
      assert.equal(hasWovenConfidence(text), true, text);
    }
  });

  it("does not read an incidental verb as a clause", () => {
    // These are the false positives that would ship a non-compliant reply.
    for (const text of [
      "Check the box in Settings, then reload the page.",
      "The supervisor checks the roster every Monday.",
      "Reading the form is the tutor's first step.",
      "Found items are listed under Lost and Found.",
    ]) {
      assert.equal(hasWovenConfidence(text), false, text);
    }
  });
});

describe("freshness claims", () => {
  it("spots an assertion that the data is current", () => {
    for (const text of [
      "Checked just now — three cards are open.",
      "As of today the lane has no owner.",
      "There are currently six phases.",
      "That's the position at the moment.",
    ]) {
      assert.equal(claimsFreshness(text), true, text);
    }
  });

  it("does not treat a past-tense look as a freshness claim", () => {
    for (const text of [
      "I read this earlier, so it may have moved since.",
      "The docs I found are from May.",
      "Going from memory.",
    ]) {
      assert.equal(claimsFreshness(text), false, text);
    }
  });
});

describe("the retired trailing label", () => {
  it("spots every rating, not only high", () => {
    // Wider than delivery.ts's stripper on purpose: that one only DELETES a
    // high rating, because a trailing "low — from memory" is often the reply's
    // only calibration signal. Here we are only noticing that the model
    // reached for a label instead of weaving, so every rating counts.
    for (const text of [
      "Four cards are open.\n_Confidence: high — checked the board_",
      "Four cards are open.\nConfidence: low — from memory",
      "Four cards are open.\n\n- *Confidence*: medium — partial read",
    ]) {
      assert.equal(hasTrailingLabel(text), true, JSON.stringify(text));
    }
  });

  it("leaves a woven mention of confidence alone", () => {
    const text = "I'm confident about the phase count — I checked the board just now.";
    assert.equal(hasTrailingLabel(text), false);
  });

  it("survives a run of trailing blank lines", () => {
    // The narrow version of this regex once backtracked badly enough on this
    // exact input to blow the 10ms Worker CPU limit, which posts nothing at
    // all. Node just runs slower, so this asserts the shape, not the timing.
    const text = `Four cards are open.${"\n".repeat(200)}`;
    assert.equal(hasTrailingLabel(text), false);
  });
});

describe("does the reply assert anything", () => {
  it("exempts a bare acknowledgement", () => {
    for (const text of ["Got it.", "Cancelled.", "On it", "Will do.", "Sure!"]) {
      assert.equal(assertsSomething(text), false, text);
    }
  });

  it("does NOT exempt a short reply carrying a claim", () => {
    // The case that broke the first design, which keyed the exemption on
    // footerKindFor === "none": 48 characters, no link, no list — classified as
    // an acknowledgement, and asserting a fact about the board.
    const text = "Yep — and that card moved to In Review yesterday.";
    assert.equal(assertsSomething(text), true);
  });

  it("treats a reply that only asks as not asserting", () => {
    assert.equal(assertsSomething("Do you mean the Warm-Up scenario?"), false);
  });
});

describe("verdicts", () => {
  it("passes a grounded reply that carries a clause", () => {
    const v = judgeConfidence(
      "I checked the board just now — Warm-Up has two paths.",
      GROUNDED,
    );
    assert.equal(v.kind, "ok");
    assert.equal(needsRepair(v), false);
  });

  it("flags a grounded factual reply with no clause", () => {
    const v = judgeConfidence("Warm-Up has two paths, and one is an exception.", GROUNDED);
    assert.equal(v.kind, "absent");
    assert.equal(needsRepair(v), true);
  });

  it("flags a trailing label rather than letting it be silently stripped", () => {
    // The compounding failure: on a short reply the stripper deletes the label
    // and nothing replaces it, so the delivered message carries no signal at
    // all — worse than the shape it was cleaning up.
    const v = judgeConfidence(
      "Warm-Up has two paths.\n_Confidence: high — checked the board_",
      GROUNDED,
    );
    assert.equal(v.kind, "trailing-label");
  });

  it("flags a freshness claim over a cached read", () => {
    const v = judgeConfidence("Checked just now — Warm-Up has two paths.", CACHED);
    assert.equal(v.kind, "false-freshness");
  });

  it("flags a freshness claim when nothing was fetched at all", () => {
    const v = judgeConfidence("Warm-Up currently has two paths.", UNGROUNDED);
    assert.equal(v.kind, "false-freshness");
  });

  it("exempts an ungrounded reply that claims nothing", () => {
    assert.equal(judgeConfidence("Got it.", UNGROUNDED).kind, "exempt");
    assert.equal(
      judgeConfidence("Here's how I'd approach the redesign, roughly.", UNGROUNDED).kind,
      "exempt",
    );
  });

  it("exempts an acknowledgement even on a turn that fetched", () => {
    assert.equal(judgeConfidence("Got it.", GROUNDED).kind, "exempt");
  });

  it("gives every repairable verdict a specific instruction", () => {
    for (const kind of ["false-freshness", "trailing-label", "absent"] as const) {
      const instruction = repairInstruction({ kind });
      assert.ok(instruction && instruction.length > 40, `${kind} needs a real instruction`);
    }
    assert.equal(repairInstruction({ kind: "ok" }), null);
    assert.equal(repairInstruction({ kind: "exempt" }), null);
  });
});
