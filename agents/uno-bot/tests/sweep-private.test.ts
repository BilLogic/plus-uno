// The sweep in private places: allowlisted private channels and the group DMs
// uno-bot is in. Whole days, in memory, through the same harness as
// `sweep-run.test.ts`. Each case asserts the audience rule as a person would
// meet it: what was posted where, and that nothing from a private place shows
// up anywhere else — no text, no link, no mention.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import { runSweepJob, sweepShareNotes } from "../src/sweep/index";
import type { OperationOutcome } from "../src/gate/index";
import { at, DESIGN, drift, msg, notionPage, reply, sweepHarness, ts, UNIVERSAL, type FakeChannel } from "./helpers/sweep-harness";

const FEEDBACK = "G0FEEDBACK";
const MPIM = "G0MPIM";
const OFF_LIST = "G0SECRET";

const MORNING: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };
const GROUP_DMS: ScheduledJob = { key: "sweep:group-dms", kind: "sweep-group-dms" };
const nightOf = (channel: string): ScheduledJob => ({ key: `sweep:${channel}`, kind: "sweep-channel", channel });

const PAGE_A = notionPage("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
const PAGE_B = notionPage("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", { contributors: ["Cy Contributor"] });

/** A thread in `channel`: a root linking `pages`, then replies. */
function thread(
  root: { user: string; when: string; pages: string[] },
  replies: Array<{ user: string; when: string; text?: string }>,
) {
  const rootMsg = msg(root.user, root.when, `Update on this: ${root.pages.map((u) => `<${u}|page>`).join(" ")}`, {
    ...(replies.length ? { reply_count: replies.length, latest_reply: replies[replies.length - 1]!.when } : {}),
  });
  const all = [rootMsg, ...replies.map((r) => msg(r.user, r.when, r.text ?? "Agreed — Nov 1.", { thread_ts: root.when }))];
  return { root: rootMsg, messages: all };
}

function place(kind: FakeChannel["kind"], t: ReturnType<typeof thread>, members?: string[]): FakeChannel {
  return { kind, history: [t.root], threads: { [t.root.ts]: t.messages }, ...(members ? { members } : {}) };
}

test("a public drift and a private drift make two cards, each in its own thread, with nothing crossing over", async () => {
  const pub = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const priv = thread({ user: "U0PRIV", when: ts(29, 15, 30), pages: [PAGE_B.url] }, [
    { user: "U0QUIET", when: ts(29, 17), text: "Owner is Quinn now" },
  ]);
  const h = sweepHarness({
    channels: { [DESIGN]: place("public", pub), [FEEDBACK]: place("private", priv, ["U0PRIV", "U0QUIET"]) },
    sources: [PAGE_A, PAGE_B],
    // Cy is the card's Contributor but not in the private channel.
    people: { "Cy Contributor": "U0CY" },
    privateAllowlist: [FEEDBACK],
    detectorReplies: [
      reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0ADE" })),
      reply(drift({ source: PAGE_B, block: PAGE_B.blocks[1]!.id, evidence: [ts(29, 17)], replacement: "Owner: Quinn" })),
    ],
    now: at(29, 22),
  });

  await runSweepJob(nightOf(DESIGN), h.deps);
  await runSweepJob(nightOf(FEEDBACK), h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.deepEqual(
    h.posted.map((p) => [p.channel, p.threadTs]).sort(),
    [
      [DESIGN, pub.root.ts],
      [FEEDBACK, priv.root.ts],
    ].sort(),
  );
  const publicCard = h.posted.find((p) => p.channel === DESIGN)!;
  const privateCard = h.posted.find((p) => p.channel === FEEDBACK)!;
  for (const leak of [FEEDBACK, PAGE_B.url, "Owner: Quinn", "<@U0PRIV>", "<@U0QUIET>", "<@U0CY>"]) {
    assert.ok(!publicCard.text.includes(leak), `the public card carries nothing of the private one: ${leak}`);
  }
  for (const leak of [DESIGN, PAGE_A.url, "<@U0ADE>", "<@U0STARTER>"]) {
    assert.ok(!privateCard.text.includes(leak), `the private card carries nothing of the public one: ${leak}`);
  }
  const privateStaged = h.staged.find((p) => p.channel === FEEDBACK)!;
  assert.match(privateCard.text, /<@U0PRIV>/, "a Contributor outside the channel is passed over for the starter");
  assert.deepEqual(privateStaged.confirmers, ["U0PRIV", "U0QUIET"], "confirmers come from that channel");
  assert.equal(privateStaged.sweepShare, undefined, "a private channel's card never offers to share");
});

test("a fix whose evidence spans a public and a private thread lands only on the private card", async () => {
  const pub = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const priv = thread({ user: "U0PRIV", when: ts(29, 15, 30), pages: [PAGE_A.url] }, [{ user: "U0QUIET", when: ts(29, 17) }]);
  const found = (evidence: string) => reply(drift({ source: PAGE_A, evidence: [evidence] }));
  const h = sweepHarness({
    channels: { [DESIGN]: place("public", pub), [FEEDBACK]: place("private", priv, ["U0PRIV", "U0QUIET"]) },
    sources: [PAGE_A],
    privateAllowlist: [FEEDBACK],
    detectorReplies: [found(ts(29, 16)), found(ts(29, 17))],
    now: at(29, 22),
  });

  await runSweepJob(nightOf(DESIGN), h.deps);
  await runSweepJob(nightOf(FEEDBACK), h.deps);
  h.clock.now = at(30, 14);
  const morning = await runSweepJob(MORNING, h.deps);

  assert.deepEqual(h.posted.map((p) => [p.channel, p.threadTs]), [[FEEDBACK, priv.root.ts]]);
  assert.match(morning.summary, /1 card/);
  assert.deepEqual(await h.store.pendingFindings(), [], "the public copy leaves the queue, not to be carded later");

  // The next morning, with the private card still live, the public thread
  // gets nothing either.
  h.clock.now = at(31, 14);
  await runSweepJob(MORNING, h.deps);
  assert.equal(h.posted.length, 1);
});

test("a group-DM finding is posted only in that group DM, and its card says what a ✅ shares", async () => {
  const dm = thread({ user: "U0ADE", when: ts(29, 15), pages: [PAGE_A.url] }, [
    { user: "U0BEA", when: ts(29, 16), text: "Launch moved to November 1, don't tell anyone yet" },
  ]);
  const h = sweepHarness({
    channels: { [MPIM]: place("group-dm", dm, ["U0ADE", "U0BEA", "U0BOT"]) },
    groupDms: [MPIM],
    sources: [PAGE_A],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16)], claimedBy: "U0BEA" }))],
    now: at(29, 22),
  });

  const night = await runSweepJob(GROUP_DMS, h.deps);
  assert.equal(night.findings.length, 1);
  assert.equal(h.posted.length, 0, "the end of day posts nothing");
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);

  assert.deepEqual(h.posted.map((p) => [p.channel, p.threadTs]), [[MPIM, dm.root.ts]]);
  assert.match(h.posted[0]!.text, /#plus-design/, "the card names where a ✅ would share a note");
  assert.match(h.posted[0]!.text, /no quote/i);
  const [staged] = h.staged;
  assert.deepEqual(staged!.confirmers, ["U0BEA", "U0ADE"]);
  assert.deepEqual(staged!.sweepShare, { pages: [{ url: PAGE_A.url, title: PAGE_A.title, to: "plus-design" }] });
});

test("a ✅ on a group-DM card shares a reworded note at rung 3 or 4 — no quote, no names, no link back", () => {
  const universal = notionPage("cccccccccccccccccccccccccccccccc", { pillars: ["Universal"] });
  const share = {
    pages: [
      { url: PAGE_A.url, title: PAGE_A.title, to: "plus-design" as const },
      { url: universal.url, title: universal.title, to: "plus-universal" as const },
    ],
  };
  const ok = (url: string): OperationOutcome => ({
    toolName: "notion_update",
    input: { page_url: url, replace: [{ block_id: "b", last_edited_time: "t", content: "Launch date: November 1" }] },
    ok: true,
    result: JSON.stringify({ ok: true }),
    message: "updated",
  });
  const failed = (url: string): OperationOutcome => ({ ...ok(url), ok: false, result: JSON.stringify({ ok: false }) });

  const notes = sweepShareNotes(share, [ok(PAGE_A.url), ok(universal.url)]);
  assert.deepEqual(
    notes.map((n) => n.to),
    ["plus-design", "plus-universal"],
  );
  for (const note of notes) {
    assert.doesNotMatch(note.text, /<@/, "no mention");
    assert.doesNotMatch(note.text, /November 1|Launch/, "no quote of the change or the conversation");
    assert.doesNotMatch(note.text, /archives|G0MPIM|slack\.com/, "no link back into the group DM");
  }
  assert.match(notes[0]!.text, new RegExp(PAGE_A.url));
  assert.match(notes[1]!.text, new RegExp(universal.url));

  assert.deepEqual(sweepShareNotes(share, [failed(PAGE_A.url), failed(universal.url)]), [], "nothing applied, nothing shared");
  assert.deepEqual(
    sweepShareNotes(share, [ok(PAGE_A.url), failed(universal.url)]).map((n) => n.to),
    ["plus-design"],
    "only what was applied is shared",
  );
});

test("a private channel missing from the allowlist is never read, even when it is on SWEEP_CHANNELS", async () => {
  const t = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: { [OFF_LIST]: place("private", t, ["U0STARTER", "U0ADE"]) },
    sources: [PAGE_A],
    privateAllowlist: [FEEDBACK],
    now: at(29, 22),
  });
  const report = await runSweepJob(nightOf(OFF_LIST), h.deps);
  assert.equal(report.outcome, "skipped");
  assert.match(report.summary, /allowlist/);
  assert.deepEqual(h.reads, [`info ${OFF_LIST}`], "only its kind was asked");
});

test("the group-DM job reads each group DM uno-bot is in, and nothing when the list cannot be read", async () => {
  const one = thread({ user: "U0ADE", when: ts(29, 15), pages: [] }, [{ user: "U0BEA", when: ts(29, 16), text: "lunch?" }]);
  const h = sweepHarness({
    channels: { G0ONE: place("group-dm", one), G0TWO: place("group-dm", one), D0DM: place("dm", one) },
    groupDms: ["G0ONE", "G0TWO", "D0DM"],
    now: at(29, 22),
  });
  const report = await runSweepJob(GROUP_DMS, h.deps);
  assert.equal(report.outcome, "handled");
  assert.ok(h.reads.includes("history G0ONE") && h.reads.includes("history G0TWO"));
  assert.ok(!h.reads.includes("history D0DM"), "a DM is never read, whatever the list says");
  assert.deepEqual(
    h.store.runs().map((r) => r.jobKey).sort(),
    ["sweep:group-dms:D0DM", "sweep:group-dms:G0ONE", "sweep:group-dms:G0TWO"],
  );

  const blind = sweepHarness({ channels: {}, groupDms: null, now: at(29, 22) });
  const skipped = await runSweepJob(GROUP_DMS, blind.deps);
  assert.equal(skipped.outcome, "skipped");
});

test("a design-system fix found in a group DM is shared to #plus-universal", async () => {
  const universal = notionPage("cccccccccccccccccccccccccccccccc", { pillars: ["Universal"] });
  const dm = thread({ user: "U0ADE", when: ts(29, 15), pages: [universal.url] }, [{ user: "U0BEA", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: { [MPIM]: place("group-dm", dm) },
    groupDms: [MPIM],
    sources: [universal],
    detectorReplies: [reply(drift({ source: universal, evidence: [ts(29, 16)] }))],
    now: at(29, 22),
  });
  await runSweepJob(GROUP_DMS, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  assert.deepEqual(
    h.posted.map((p) => p.channel),
    [MPIM],
    `the card stays in the group DM, never in ${UNIVERSAL}`,
  );
  assert.match(h.posted[0]!.text, /#plus-universal/);
  assert.equal(h.staged[0]!.sweepShare?.pages[0]?.to, "plus-universal");
});
