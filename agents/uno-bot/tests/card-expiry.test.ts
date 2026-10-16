import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cardExpiresAt, cardTtlMs, MAX_CARD_TTL_MS } from "../src/card-expiry";

const at = (iso: string) => Date.parse(iso);

describe("a proposal card's deadline: 24 weekday hours, counted in ET", () => {
  it("a card staged Monday 10:00 ET expires Tuesday 10:00 ET", () => {
    assert.equal(cardExpiresAt(at("2026-10-12T14:00:00Z")), at("2026-10-13T14:00:00Z"));
  });

  it("a card staged Friday 15:00 ET expires Monday 15:00 ET", () => {
    assert.equal(cardExpiresAt(at("2026-10-16T19:00:00Z")), at("2026-10-19T19:00:00Z"));
  });

  it("a card staged in Friday's last second carries its one second into Monday", () => {
    assert.equal(cardExpiresAt(at("2026-10-17T03:59:59.500Z")), at("2026-10-20T03:59:59.500Z"));
  });

  it("a card staged on Saturday or Sunday counts from Monday 00:00 ET and expires Tuesday 00:00 ET", () => {
    const tuesday = at("2026-10-20T04:00:00Z");
    assert.equal(cardExpiresAt(at("2026-10-17T04:00:00Z")), tuesday, "Saturday 00:00 ET");
    assert.equal(cardExpiresAt(at("2026-10-17T16:00:00Z")), tuesday, "Saturday noon ET");
    assert.equal(cardExpiresAt(at("2026-10-19T03:59:59Z")), tuesday, "Sunday 23:59:59 ET");
  });

  it("Monday 00:00 ET is a weekday hour, not the weekend", () => {
    assert.equal(cardExpiresAt(at("2026-10-19T04:00:00Z")), at("2026-10-20T04:00:00Z"));
  });

  it("holds ET wall-clock time across the November clock change", () => {
    // Fri 30 Oct 15:00 EDT → Mon 2 Nov 15:00 EST: 73 real hours.
    assert.equal(cardExpiresAt(at("2026-10-30T19:00:00Z")), at("2026-11-02T20:00:00Z"));
    // Sun 1 Nov 01:30, the hour that happens twice → Tue 3 Nov 00:00 EST.
    assert.equal(cardExpiresAt(at("2026-11-01T05:30:00Z")), at("2026-11-03T05:00:00Z"));
    assert.equal(cardExpiresAt(at("2026-11-01T06:30:00Z")), at("2026-11-03T05:00:00Z"));
  });

  it("holds ET wall-clock time across the March clock change", () => {
    // Fri 6 Mar 15:00 EST → Mon 9 Mar 15:00 EDT: 71 real hours.
    assert.equal(cardExpiresAt(at("2026-03-06T20:00:00Z")), at("2026-03-09T19:00:00Z"));
    // Sun 8 Mar 01:00 EST, an hour before the clocks jump → Tue 10 Mar 00:00 EDT.
    assert.equal(cardExpiresAt(at("2026-03-08T06:00:00Z")), at("2026-03-10T04:00:00Z"));
  });

  it("a card's lifetime is its deadline less its staging, and no lifetime passes the longest", () => {
    assert.equal(cardTtlMs(at("2026-10-12T14:00:00Z")), 24 * 3_600_000);
    assert.equal(cardTtlMs(at("2026-10-16T19:00:00Z")), 72 * 3_600_000);
    assert.equal(cardTtlMs(at("2026-10-30T19:00:00Z")), MAX_CARD_TTL_MS);
    for (let t = at("2026-10-26T00:00:00Z"); t < at("2026-11-09T00:00:00Z"); t += 17 * 60_000) {
      assert.ok(cardTtlMs(t) > 0 && cardTtlMs(t) <= MAX_CARD_TTL_MS, new Date(t).toISOString());
    }
  });
});
