// Who the deployment names as standing confirmers: `STANDING_CONFIRMER_IDS`,
// read once where `Env` becomes a door's dependencies.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { standingConfirmersOf } from "../src/slack/standing-confirmers";

describe("standing confirmers from Env", () => {
  it("reads a comma-separated list of Slack user ids, trimmed", () => {
    assert.deepEqual(standingConfirmersOf({ STANDING_CONFIRMER_IDS: " U03FYQJRQHX, U09E652SJ02 " }), [
      "U03FYQJRQHX",
      "U09E652SJ02",
    ]);
  });

  it("is empty when unset or blank, which is a card's own set and nothing more", () => {
    assert.deepEqual(standingConfirmersOf({}), []);
    assert.deepEqual(standingConfirmersOf({ STANDING_CONFIRMER_IDS: " , " }), []);
  });

  it("drops anything that is not a Slack user id rather than admitting it", () => {
    assert.deepEqual(standingConfirmersOf({ STANDING_CONFIRMER_IDS: "U03FYQJRQHX,bill,C03FC8AS69K,*" }), ["U03FYQJRQHX"]);
  });
});
