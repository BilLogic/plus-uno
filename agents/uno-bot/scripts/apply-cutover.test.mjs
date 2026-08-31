import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { OLD, REPO_ROOT, edits, plan, rewrite, validate } from "./apply-cutover.mjs";

const VALUES = {
  account: "1111111111111111111111111111aaaa",
  slackKv: "2222222222222222222222222222bbbb",
  harnessKv: "3333333333333333333333333333cccc",
  host: "uno-bot.newaccount.workers.dev",
};

test("every declared edit is findable in the repo as it stands", () => {
  // The point of the assertion, not a tautology: this test fails the day
  // someone rewords one of these lines, which is exactly when a cutover
  // running under time pressure would otherwise write six of seven files.
  for (const edit of edits(VALUES)) {
    const full = path.join(REPO_ROOT, edit.file);
    assert.ok(fs.existsSync(full), `${edit.file} is gone`);
    const state = plan(edit, fs.readFileSync(full, "utf8"));
    assert.equal(state.state, "ready", `${edit.file}: ${state.state} (found ${state.found})`);
  }
});

test("a file that already moved is skipped, not rewritten twice", () => {
  const edit = { file: "x", from: OLD.host, to: VALUES.host, count: 1 };
  const done = rewrite(`https://${OLD.host}/health`, edit);
  assert.equal(done, `https://${VALUES.host}/health`);
  assert.deepEqual(plan(edit, done), { state: "already", found: 1 });
});

test("a wrong occurrence count refuses rather than writing", () => {
  const edit = { file: "x", from: OLD.host, to: VALUES.host, count: 1 };
  const twice = `${OLD.host} and ${OLD.host}`;
  assert.equal(plan(edit, twice).state, "unexpected");
  // …unless the edit says the count is unknown, as the Slack manifests do.
  assert.equal(plan({ ...edit, count: null }, twice).state, "ready");
});

test("a literal that is gone entirely is a finding, not a silent no-op", () => {
  const edit = { file: "x", from: OLD.host, to: VALUES.host, count: 1 };
  assert.equal(plan(edit, "nothing to see").state, "missing");
});

test("the old values are refused as new ones", () => {
  assert.deepEqual(validate(VALUES), []);
  assert.match(validate({ ...VALUES, account: OLD.account }).join(" "), /OLD account/);
  assert.match(validate({ ...VALUES, host: OLD.host }).join(" "), /OLD hostname/);
  assert.match(validate({ ...VALUES, slackKv: OLD.slackKv }).join(" "), /OLD namespace/);
  assert.match(validate({ ...VALUES, host: "" }).join(" "), /--host is missing/);
  assert.match(validate({ ...VALUES, host: "https://x.workers.dev/" }).join(" "), /bare hostname/);
});

test("wrangler.toml gets four distinct edits, not one broad sweep", () => {
  // The account id, both KV ids and the redirect URI are four different
  // decisions with four different sources. A single find-and-replace over the
  // file would happily rewrite a KV id into the account field.
  const toml = edits(VALUES).filter((e) => e.file === "agents/uno-bot/wrangler.toml");
  assert.equal(toml.length, 4);
  assert.equal(new Set(toml.map((e) => e.from)).size, 4);
});

test('four edits to one file all survive, rather than the last one winning', () => {
  // The regression this exists for. wrangler.toml carries four of the ten
  // edits; the write loop rewrote the PLANNING-time source once per edit, so
  // three were discarded and the file came out with a new redirect URI beside
  // the OLD account id and the OLD KV ids — a Worker pointed at the account
  // being left, which is the exact silent half-migration the header promises
  // this script cannot produce.
  const original = [
    `account_id = "${OLD.account}"`,
    `id = "${OLD.slackKv}"`,
    `id = "${OLD.harnessKv}"`,
    `SLACK_OAUTH_REDIRECT_URI = "https://${OLD.host}/oauth/slack/callback"`,
  ].join("\n");

  const toml = edits(VALUES).filter((e) => e.file === "agents/uno-bot/wrangler.toml");
  assert.equal(toml.length, 4);

  // Fold, the way main() now does: each edit sees the previous edit's output.
  const folded = toml.reduce((acc, edit) => rewrite(acc, edit), original);
  assert.ok(folded.includes(VALUES.account), "account id was dropped");
  assert.ok(folded.includes(VALUES.slackKv), "SLACK_OAUTH_KV id was dropped");
  assert.ok(folded.includes(VALUES.harnessKv), "HARNESS_KV id was dropped");
  assert.ok(folded.includes(VALUES.host), "redirect URI was dropped");
  for (const stale of [OLD.account, OLD.slackKv, OLD.harnessKv, OLD.host]) {
    assert.ok(!folded.includes(stale), `${stale} survived the rewrite`);
  }

  // And the shape of the old bug, so this test fails if the fold is reverted:
  // rewriting the ORIGINAL once per edit keeps only the last.
  const clobbered = toml.map((edit) => rewrite(original, edit)).at(-1);
  assert.ok(clobbered.includes(VALUES.host));
  assert.ok(clobbered.includes(OLD.account), "the old bug is what this asserts");
});
