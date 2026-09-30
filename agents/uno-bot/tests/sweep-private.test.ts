// The sweep in private places: allowlisted private channels and the group DMs
// uno-bot is in. Whole days, in memory, through the same harness as
// `sweep-run.test.ts`. Each case asserts the audience rule as a person would
// meet it: what was posted where, and that nothing from a private place shows
// up anywhere else — no text, no link, no mention.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import {
  runSweepJob,
  stageSweepShare,
  SWEEP_CARD_TTL_MS,
  SWEEP_SHARE_KEY,
  sweepShareNotes,
  sweepShareOffer,
  WITHHELD_TEXT,
} from "../src/sweep/index";
import { resolveSignal, type OperationOutcome } from "../src/gate/index";
import { isSubrequestBudgetError } from "../src/net";
import { renderProposalCard } from "../src/slack/proposal-render";
import type { ProposalCard } from "../src/turn/index";
import {
  at,
  DESIGN,
  drift,
  msg,
  notionPage,
  reply,
  sweepHarness,
  ts,
  UNIVERSAL,
  UNO_BOT,
  type FakeChannel,
} from "./helpers/sweep-harness";

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

/** A group DM with one drift on `page`, swept and carded: the staged fix card. */
async function groupDmCard(page = PAGE_A) {
  const dm = thread({ user: "U0ADE", when: ts(29, 15), pages: [page.url] }, [
    { user: "U0BEA", when: ts(29, 16), text: "Launch moved to November 1, don't tell anyone yet" },
  ]);
  const h = sweepHarness({
    channels: { [MPIM]: place("group-dm", dm, ["U0ADE", "U0BEA", "U0BOT"]) },
    groupDms: [MPIM],
    sources: [page],
    detectorReplies: [reply(drift({ source: page, evidence: [ts(29, 16)], claimedBy: "U0BEA" }))],
    now: at(29, 22),
  });
  const night = await runSweepJob(GROUP_DMS, h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  return { h, dm, night, fix: h.staged[0]! };
}

const applied = (url: string): OperationOutcome => ({
  toolName: "notion_update",
  input: { page_url: url, replace: [{ block_id: "b", last_edited_time: "t", content: "Launch date: November 1" }] },
  ok: true,
  result: JSON.stringify({ ok: true }),
  message: "updated",
});
const refused = (url: string): OperationOutcome => ({ ...applied(url), ok: false, result: JSON.stringify({ ok: false }) });
const CHANNELS = { plusDesign: DESIGN, plusUniversal: UNIVERSAL, unoBot: UNO_BOT };

/** `stageSweepShare` against the harness's ThreadState and usage record, with
 *  the posts it makes kept. */
function shareDeps(h: ReturnType<typeof sweepHarness>) {
  const posts: Array<{ channel: string; threadTs: string; text: string; ts: string }> = [];
  return {
    posts,
    deps: {
      channels: CHANNELS,
      async post(to: { channel: string; threadTs: string }, card: ProposalCard) {
        const text = renderProposalCard(card).text;
        const ts = `${Math.floor(h.clock.now / 1000)}.${String(800000 + posts.length)}`;
        posts.push({ ...to, text, ts });
        return { ok: true, ts, text };
      },
      threadState: h.threadState,
      proposalEvents: h.proposalEvents,
      now: () => h.clock.now,
    },
  };
}

test("a group-DM finding is posted only in that group DM, and its fix card offers no share of its own", async () => {
  const { h, dm, night, fix } = await groupDmCard();
  assert.equal(night.findings.length, 1);
  assert.deepEqual(h.posted.map((p) => [p.channel, p.threadTs]), [[MPIM, dm.root.ts]]);
  assert.doesNotMatch(h.posted[0]!.text, /#plus-design|share|note/i, "the fix card's ✅ applies the fix and nothing more");
  assert.deepEqual(fix.operations!.map((op) => op.toolName), ["notion_update"]);
  assert.deepEqual(fix.confirmers, ["U0BEA", "U0ADE"]);
  assert.deepEqual(fix.sweepShare, { pages: [{ url: PAGE_A.url, title: PAGE_A.title, to: "plus-design" }] });
});

test("a group DM's staged fix card is on the usage record without its channel", async () => {
  const { h, fix } = await groupDmCard();
  const [staged] = await h.proposalEvents.eventsOf(fix.proposalTs);
  assert.equal(staged?.event, "staged");
  assert.equal(staged?.channelId, null, "a group DM is never named");
});

test("a private channel's staged card is on the usage record with its channel", async () => {
  const priv = thread({ user: "U0PRIV", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0QUIET", when: ts(29, 16) }]);
  const h = sweepHarness({
    channels: { [FEEDBACK]: place("private", priv, ["U0PRIV", "U0QUIET"]) },
    sources: [PAGE_A],
    privateAllowlist: [FEEDBACK],
    detectorReplies: [reply(drift({ source: PAGE_A, evidence: [ts(29, 16)] }))],
    now: at(29, 22),
  });
  await runSweepJob(nightOf(FEEDBACK), h.deps);
  h.clock.now = at(30, 14);
  await runSweepJob(MORNING, h.deps);
  const [staged] = await h.proposalEvents.eventsOf(h.staged[0]!.proposalTs);
  assert.equal(staged?.channelId, FEEDBACK);
});

test("the share card appears only after the fix batch wrote a page", async () => {
  const { h, fix } = await groupDmCard();
  const { posts, deps } = shareDeps(h);

  assert.equal(await stageSweepShare(fix, [refused(PAGE_A.url)], deps), null, "nothing written, nothing offered");
  assert.equal(await stageSweepShare(fix, [], deps), null, "a ⛔ runs nothing, so nothing is offered");
  assert.equal(posts.length, 0);

  const share = await stageSweepShare(fix, [applied(PAGE_A.url)], deps);
  assert.ok(share);
  assert.deepEqual(posts.map((p) => [p.channel, p.threadTs]), [[MPIM, fix.replyTs]], "in the same group DM thread");
  assert.equal(share.supersedeKey, SWEEP_SHARE_KEY);
  assert.equal(share.ttlMs, SWEEP_CARD_TTL_MS);
  assert.deepEqual(share.confirmers, fix.confirmers);
  assert.equal(share.sweepRun, undefined, "not a fix card");
  assert.equal((await h.threadState.getProposalByTs(share.proposalTs)).state, "found");
  const [staged] = await h.proposalEvents.eventsOf(share.proposalTs);
  assert.deepEqual([staged?.event, staged?.via, staged?.channelId], ["staged", "worker", null]);
});

test("the share card shows exactly the note its ✅ posts, and the channel it goes to", async () => {
  const { h, fix } = await groupDmCard();
  const { posts, deps } = shareDeps(h);
  const share = (await stageSweepShare(fix, [applied(PAGE_A.url)], deps))!;

  const [op] = share.operations!;
  assert.equal(share.operations!.length, 1);
  assert.equal(op!.toolName, "sweep_share_post");
  assert.equal(op!.input.channel, DESIGN, "#plus-design, by pickDestination rung 4");
  const note = String(op!.input.text);
  assert.match(posts[0]!.text, /#plus-design/);
  for (const line of note.split("\n")) assert.ok(posts[0]!.text.includes(line), `the card shows: ${line}`);
  assert.match(note, new RegExp(PAGE_A.url));
  assert.doesNotMatch(note, /<@|U0ADE|U0BEA|November 1|don't tell|archives|G0MPIM/, "no names, no quote, no link back");
});

test("the share card is resolved by the gate: a ✅ runs its post, a ⛔ runs nothing, a non-confirmer nothing", async () => {
  const { h, fix } = await groupDmCard();
  const { deps } = shareDeps(h);
  const share = (await stageSweepShare(fix, [applied(PAGE_A.url)], deps))!;
  const react = (userId: string, glyph: string) => ({
    kind: "reaction" as const,
    messageTs: share.proposalTs,
    channel: share.channel,
    thread: share.replyTs!,
    glyph,
    userId,
  });

  const stranger = await resolveSignal(react("U0STRANGER", "white_check_mark"), { threadState: h.threadState });
  assert.equal(stranger.outcome, "none");
  assert.equal(stranger.execute, undefined);

  const yes = await resolveSignal(react("U0ADE", "white_check_mark"), { threadState: h.threadState });
  assert.equal(yes.outcome, "won");
  assert.deepEqual(yes.execute?.operations, share.operations, "exactly the note it showed");

  const again = (await stageSweepShare(fix, [applied(PAGE_A.url)], deps))!;
  const no = await resolveSignal({ ...react("U0BEA", "no_entry"), messageTs: again.proposalTs }, { threadState: h.threadState });
  assert.equal(no.outcome, "won");
  assert.equal(no.execute, undefined, "a ⛔ posts nothing");
});

test("markup in a page title is inert on the share card and in the note, and the note is byte-equal to the card", async () => {
  const hostile = notionPage("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", {
    title: "Tutor guide <!channel> <@U0123ABCD> <!subteam^S01|design> <https://evil.example|click me> & co",
  });
  const { h, fix } = await groupDmCard(hostile);
  const { posts, deps } = shareDeps(h);
  const share = (await stageSweepShare(fix, [applied(hostile.url)], deps))!;
  const note = String(share.operations![0]!.input.text);
  const card = posts[0]!.text;

  for (const raw of ["<!channel>", "<@U0123ABCD>", "<!subteam^", "<https://evil.example"]) {
    assert.ok(!note.includes(raw), `the note carries no live markup: ${raw}`);
    assert.ok(!card.includes(raw), `the card carries no live markup: ${raw}`);
  }
  assert.match(note, /&lt;!channel&gt; &lt;@U0123ABCD&gt;/, "shown as text");
  assert.match(note, / &amp; co/);
  for (const line of note.split("\n")) assert.ok(card.includes(`> ${line}`), `the card quotes the note byte for byte: ${line}`);
  assert.doesNotMatch(card, /no parameters/, "no empty parameter line");
});

test("the note names only the pages written, and a design-system page goes to #plus-universal", () => {
  const universal = notionPage("cccccccccccccccccccccccccccccccc", { pillars: ["Universal"] });
  const share = {
    pages: [
      { url: PAGE_A.url, title: PAGE_A.title, to: "plus-design" as const },
      { url: universal.url, title: universal.title, to: "plus-universal" as const },
    ],
  };
  assert.deepEqual(
    sweepShareNotes(share, [applied(PAGE_A.url), applied(universal.url)]).map((n) => n.to),
    ["plus-design", "plus-universal"],
  );
  assert.deepEqual(
    sweepShareNotes(share, [applied(PAGE_A.url), refused(universal.url)]).map((n) => n.to),
    ["plus-design"],
  );
  assert.equal(sweepShareOffer(share, [applied(PAGE_A.url)], { plusDesign: UNO_BOT, unoBot: UNO_BOT }), null, "never #uno-bot");
  assert.equal(sweepShareOffer(share, [applied(PAGE_A.url)], {}), null, "no channel configured, nothing offered");
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

test("a design-system fix found in a group DM would be shared to #plus-universal", async () => {
  const universal = notionPage("cccccccccccccccccccccccccccccccc", { pillars: ["Universal"] });
  const { h, fix } = await groupDmCard(universal);
  assert.deepEqual(
    h.posted.map((p) => p.channel),
    [MPIM],
    `the card stays in the group DM, never in ${UNIVERSAL}`,
  );
  assert.equal(fix.sweepShare?.pages[0]?.to, "plus-universal");
  const { deps } = shareDeps(h);
  const share = (await stageSweepShare(fix, [applied(universal.url)], deps))!;
  assert.equal(share.operations![0]!.input.channel, UNIVERSAL);
});

test("a dry run shows a private place's findings and cards as ids and counts only", async () => {
  const pub = thread({ user: "U0STARTER", when: ts(29, 15), pages: [PAGE_A.url] }, [{ user: "U0ADE", when: ts(29, 16) }]);
  const dm = thread({ user: "U0ADE", when: ts(29, 15), pages: [PAGE_B.url] }, [
    { user: "U0BEA", when: ts(29, 16), text: "Owner is Quinn now" },
  ]);
  const found = (source: typeof PAGE_A) => reply(drift({ source, evidence: [ts(29, 16)], claimedBy: "U0BEA" }));
  const h = sweepHarness({
    channels: { [DESIGN]: place("public", pub), [MPIM]: place("group-dm", dm, ["U0ADE", "U0BEA"]) },
    groupDms: [MPIM],
    sources: [PAGE_A, PAGE_B],
    detectorReplies: [found(PAGE_B), found(PAGE_A)],
    now: at(29, 22),
    dryRun: true,
  });

  const priv = await runSweepJob(GROUP_DMS, h.deps);
  assert.deepEqual(priv.findings, [], "no finding from the group DM is shown");
  assert.deepEqual(priv.withheld, [{ id: `${MPIM}:${dm.root.ts}:${PAGE_B.blocks[0]!.id}`, channel: MPIM, channelKind: "group-dm" }]);
  assert.equal(priv.cards.length, 1);
  assert.equal(priv.cards[0]!.text, WITHHELD_TEXT);
  const shown = JSON.stringify(priv);
  for (const leak of ["November 1", "Owner is Quinn", "U0BEA", PAGE_B.url]) {
    assert.ok(!shown.includes(leak), `the dry run shows nothing of the group DM: ${leak}`);
  }
  assert.match(priv.summary, /1 finding/, "the counts still include it");

  const pubReport = await runSweepJob(nightOf(DESIGN), h.deps);
  assert.equal(pubReport.findings.length, 1, "a public finding is shown whole");
  assert.equal(pubReport.withheld, undefined);
  assert.match(pubReport.cards[0]!.text, /November 1/);
});

/** `n` group DMs, each one thread with replies and no link — a read each. */
function manyGroupDms(n: number) {
  const ids = Array.from({ length: n }, (_, i) => `G0DM${String(i).padStart(2, "0")}`);
  const channels: Record<string, FakeChannel> = {};
  for (const id of ids) {
    const t = thread({ user: "U0ADE", when: ts(29, 15), pages: [] }, [{ user: "U0BEA", when: ts(29, 16), text: "lunch?" }]);
    channels[id] = place("group-dm", t);
  }
  return { ids, channels };
}

test("25 group DMs over two budgets: the retry passes over those already swept today", async () => {
  const { ids, channels } = manyGroupDms(25);
  const h = sweepHarness({ channels, groupDms: ids, now: at(29, 22) });
  h.budget.replies = 12;
  await assert.rejects(runSweepJob(GROUP_DMS, h.deps), (err) => isSubrequestBudgetError(err));
  const handled = () => h.store.runs().filter((r) => r.outcome === "handled").map((r) => r.jobKey);
  assert.equal(handled().length, 12);

  h.budget.replies = Infinity;
  h.reads.length = 0;
  h.clock.now = at(29, 22, 2);
  const retried = await runSweepJob(GROUP_DMS, h.deps);
  assert.equal(retried.outcome, "handled");
  assert.match(retried.summary, /12 already swept today/);
  for (const id of ids.slice(0, 12)) assert.ok(!h.reads.includes(`info ${id}`), `${id} is not read again`);
  for (const id of ids.slice(12)) assert.ok(h.reads.includes(`replies ${id} ${ts(29, 15)}`), `${id} is read`);
  assert.deepEqual(handled().sort(), ids.map((id) => `sweep:group-dms:${id}`).sort());
});

test("one group DM that fails is counted, and the others are still swept", async () => {
  const { ids, channels } = manyGroupDms(3);
  channels[ids[1]!]!.fails = true;
  const h = sweepHarness({ channels, groupDms: ids, now: at(29, 22) });
  const report = await runSweepJob(GROUP_DMS, h.deps);
  assert.equal(report.outcome, "handled");
  assert.match(report.summary, new RegExp(`1 failed: ${ids[1]}`));
  assert.ok(h.reads.includes(`replies ${ids[2]} ${ts(29, 15)}`), "the one after it is swept");
  assert.deepEqual(
    h.store.runs().filter((r) => r.outcome === "handled").map((r) => r.jobKey).sort(),
    [ids[0], ids[2]].map((id) => `sweep:group-dms:${id}`),
  );
});
