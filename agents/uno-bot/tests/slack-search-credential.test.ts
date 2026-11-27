// The two gates every Slack read shares: the private allowlist, parsed once,
// and the own-DM predicate that lets the requester's own token act.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import { inOwnDm, privateAllowlist } from "../src/slack/search-credential";

describe("privateAllowlist", () => {
  it("splits, trims and drops blanks", () => {
    const env = { SLACK_SEARCH_PRIVATE_ALLOWLIST: " G1, ,C2 ,," } as unknown as Env;
    assert.deepEqual(privateAllowlist(env), ["G1", "C2"]);
  });
  it("is empty when unset", () => {
    assert.deepEqual(privateAllowlist({} as Env), []);
  });
});

describe("inOwnDm", () => {
  it("is true in the assistant DM", () => {
    assert.equal(inOwnDm({ channel: "D0OWNDM01" }), true);
  });
  it("is false on a public-only turn, in a channel, or with no context", () => {
    assert.equal(inOwnDm({ channel: "D0OWNDM01", publicOnly: true }), false);
    assert.equal(inOwnDm({ channel: "CDESIGN1" }), false);
    assert.equal(inOwnDm(undefined), false);
  });
});

describe("sanitizeAssistantContext size cap", () => {
  it("keeps three Slack ids and refuses a large payload", async () => {
    const { sanitizeAssistantContext } = await import("../src/thread-state/store.js");
    const ids = { channel_id: "C03FC8AS69K", team_id: "T03FC8AS69K", enterprise_id: "E03FC8AS69K" };
    assert.deepEqual(sanitizeAssistantContext(ids), ids);
    assert.equal(sanitizeAssistantContext({ ...ids, pad: "x".repeat(600) }), null);
  });
});
