// A ⏳ narration must not print underneath the answer it was announcing.
//
// `postInterim` is fire-and-forget by contract, and the contract is about not
// BLOCKING the agent loop on a courtesy message. It was being read as "and
// never think about it again", which is a different promise: the post was left
// to land whenever Slack finished it. A full model round-trip normally sits
// between the last narration and the answer and hides that — but `/stop`
// returns `STOPPED_MESSAGE` with no model call behind it, and a reply under
// `MIN_DRAFT_CHARS` skips the judge, so on those exits the two requests leave
// together. You stop the bot, it says it stopped, and then it says it is
// checking Notion.
//
// The discipline lives in `slack/narration-order.ts` so it can be tested by
// RUNNING it. What is left to a source assertion is only what the Node lane
// cannot reach: `slack/slack-delivery.ts` names `Env` and the Slack client, and
// nothing in the type system makes a terminal post drain before it sends. Same
// move as `stream-recipient.test.ts` and the door check in
// `confirmation-paths.test.ts`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { INTERIM_DRAIN_MS, narrationOrder } from "../src/slack/narration-order";

/** A promise with its settle in the test's hands, standing in for a Slack post
 *  that has left but not landed. */
function deferred(): { promise: Promise<void>; land: () => void } {
  let land!: () => void;
  const promise = new Promise<void>((resolve) => {
    land = resolve;
  });
  return { promise, land };
}

const tick = (): Promise<void> => new Promise((r) => setImmediate(r));

describe("a narration and the answer it precedes", () => {
  it("holds the last word until what is on the wire has landed", async () => {
    const order = narrationOrder();
    const post = deferred();
    order.track(post.promise);

    const landedFirst: string[] = [];
    const saying = order.lastWord().then(() => landedFirst.push("answer"));

    await tick();
    assert.equal(landedFirst.length, 0, "the answer waits while the narration is still out");

    post.land();
    landedFirst.push("narration");
    await saying;
    assert.deepEqual(landedFirst, ["narration", "answer"], "and goes out after it");
  });

  it("waits on every narration still out, not just the newest", async () => {
    // Tool boundaries can be closer together than a post takes. Keeping only
    // the newest would leave the older one free to land under the answer —
    // the same bug, one narration to the left.
    const order = narrationOrder();
    const first = deferred();
    const second = deferred();
    order.track(first.promise);
    order.track(second.promise);

    let done = false;
    const saying = order.lastWord().then(() => {
      done = true;
    });

    second.land();
    await tick();
    assert.equal(done, false, "the older narration is still out");

    first.land();
    await saying;
    assert.equal(done, true);
  });

  it("gives up at the bound rather than hold a ready answer", async () => {
    // A narration is best-effort; the answer behind it is not. A hung post must
    // cost the narration its ordering, never the reply.
    const order = narrationOrder(5);
    order.track(deferred().promise); // never lands
    await order.lastWord();
    assert.ok(true, "the last word returned without the narration");
  });

  it("does not inherit a failed post", async () => {
    const order = narrationOrder(5);
    order.track(Promise.reject(new Error("slack 500")));
    await order.lastWord();
    assert.ok(true, "a narration that never posted is not a reason to fail the answer");
  });

  it("costs nothing when nothing is out", async () => {
    const order = narrationOrder(60_000);
    const landed = deferred();
    order.track(landed.promise);
    landed.land();
    await tick();
    // Settled posts are forgotten, so this must not wait out the bound.
    await order.lastWord();
    assert.ok(true);
  });

  it("drops a narration asked for after the last word", async () => {
    const order = narrationOrder(5);
    assert.equal(order.open(), true);
    await order.lastWord();
    assert.equal(order.open(), false, "whatever it was going to announce is over");
  });

  it("drains without closing, for the verdict that precedes real work", async () => {
    // The Gate doors post a verdict and THEN run the confirmed tool, which is
    // entitled to narrate again. A drain that closed would gag it.
    const order = narrationOrder(5);
    await order.drain();
    assert.equal(order.open(), true);
  });

  it("bounds the wait at something a person would not notice", () => {
    assert.ok(INTERIM_DRAIN_MS <= 2_000, "a ready answer is never held for long");
  });
});

describe("the adapter wires it", () => {
  const src = readFileSync(resolve(process.cwd(), "src/slack/slack-delivery.ts"), "utf8").replace(
    /\s+/g,
    " ",
  );

  it("tracks the narration it sends", () => {
    assert.ok(src.includes("narration.track("), "an untracked post is one nothing can order");
    assert.ok(src.includes("if (!narration.open()) return;"), "and none is sent after the last word");
  });

  for (const post of ["postAnswer", "stageProposal", "postFailure"]) {
    it(`${post} says the last word before it sends`, () => {
      const body = src.slice(src.indexOf(`async ${post}(`));
      const drained = body.indexOf("await narration.lastWord();");
      assert.ok(drained >= 0 && drained < 120, `${post} drains first, not eventually`);
    });
  }
});
