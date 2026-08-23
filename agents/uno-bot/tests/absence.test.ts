// "I found nothing" is not "there is nothing".
//
// Eval S1 has failed intermittently at ~2/3 samples across five runs. The
// instruction that should prevent it already ships inside the empty search
// result; this is the deterministic net under it.
//
// The most important assertions here are the ones about the THREE VISIBILITY
// MODES. The scope of a Slack search is not always "public channels" — with the
// requester's own credential it covers their DMs and private channels, and a
// repair that told the model to say "public channels" there would make the
// reply FALSE in the other direction.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { absenceRepairInstruction, judgeAbsence } from "../src/agent/absence";

const OWN = {
  visibility: "requester-own (their DMs/private included)",
  searchedSurfaces: "public_channel,private_channel,im,mpim",
};
const PUBLIC = {
  visibility: "public-only (no user credential — public channels are the whole search)",
  searchedSurfaces: "public_channel",
};
const WORKSPACE = {
  visibility: "workspace-filtered (public + team-allowlisted private)",
  searchedSurfaces: "public_channel,private_channel",
};

describe("an unscoped absence claim", () => {
  it("catches the sentence S1 actually fails on", () => {
    // Verbatim shape from the judge's complaint, twice over.
    assert.equal(
      judgeAbsence("No one in Slack has mentioned a hard deadline for the spacing migration."),
      "unscoped",
    );
  });

  it("catches the other ways of saying the world is empty", () => {
    for (const text of [
      "Nobody has brought that up.",
      "There is no deadline anywhere.",
      "That doesn't exist.",
      "It was never discussed.",
      "There are no messages about it.",
    ]) {
      assert.equal(judgeAbsence(text), "unscoped", text);
    }
  });
});

describe("a properly scoped answer is left alone", () => {
  it("passes when the reply names what was searched", () => {
    for (const text of [
      "Nothing in the public channels I can see.",
      "No one has mentioned it in the channels I searched — DMs weren't covered.",
      "I looked through the public channels and found nothing on a deadline.",
      "Nothing anywhere you can see, including your DMs.",
      "There is no mention of it in what I can access.",
    ]) {
      assert.equal(judgeAbsence(text), "ok", text);
    }
  });

  it("passes a reply that reports withheld private matches", () => {
    // Explicitly allowed by S1's judgeNote — this is honest, not an overclaim.
    assert.equal(
      judgeAbsence("Nobody mentioned it publicly, though there were also matches in private spaces I can't surface."),
      "ok",
    );
  });

  it("does not fire on a reply making no absence claim at all", () => {
    assert.equal(judgeAbsence("The deadline is 5 October, per the Roadmap card."), "ok");
    assert.equal(judgeAbsence(""), "ok");
    assert.equal(judgeAbsence("   "), "ok");
  });
});

describe("the repair is written for the mode that actually ran", () => {
  // The correction that prompted this design: the bot's reach is not fixed. With
  // the requester's own token the search really does cover their DMs, so
  // "public channels" would understate it.
  it("widens to the requester's own view under requester-own", () => {
    const r = absenceRepairInstruction(OWN);
    assert.ok(r.includes("REQUESTER can see"), r);
    assert.ok(r.includes("your DMs and private channels"), r);
    assert.ok(!r.includes("scope it to public channels"), r);
  });

  it("says public-only, and that DMs were not covered", () => {
    const r = absenceRepairInstruction(PUBLIC);
    assert.ok(r.includes("public channels"), r);
    assert.ok(r.includes("NOT covered"), r);
  });

  it("names the allowlisted middle mode", () => {
    assert.ok(absenceRepairInstruction(WORKSPACE).includes("team-allowlisted"), "workspace mode");
  });

  it("carries the verbatim visibility and surfaces, so the judge sees the facts", () => {
    const r = absenceRepairInstruction(PUBLIC);
    assert.ok(r.includes(PUBLIC.visibility), r);
    assert.ok(r.includes(PUBLIC.searchedSurfaces), r);
  });
});

describe("the S1-versus-S3 trade this exists to avoid", () => {
  // The previous attempt at the absence rule fixed S1 and broke S3 in the same
  // run: the model scoped the absence and dropped the connect-link offer. The
  // repair must be explicitly additive or it will do that again.
  it("tells the judge to change ONLY the absence claim", () => {
    for (const ctx of [OWN, PUBLIC, WORKSPACE]) {
      const r = absenceRepairInstruction(ctx);
      assert.ok(r.includes("ONLY the absence claim"), ctx.visibility);
      assert.ok(r.includes("keep any connect-link offer"), ctx.visibility);
      assert.ok(r.includes("Change nothing else"), ctx.visibility);
    }
  });
});
