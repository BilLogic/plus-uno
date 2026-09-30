// The raise card's ✅, driven through the gate to the channel post Slack is
// handed: the DM sweep's one way out of a DM posts exactly its note in the
// team channel, with no quote and no name, and only for the person the DM is
// with.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` at the top of this file and everything is imported lazily
// inside the test (the seam `github-issue-client.test.ts` uses). Nothing here
// touches Slack.
import { test } from "node:test";
import assert from "node:assert/strict";

const sent: Array<{ url: string; body: Record<string, unknown> }> = [];
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  sent.push({ url: String(input), body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
  return new Response(JSON.stringify({ ok: true, ts: "1790780000.000001", channel: "C0UNIVERSAL" }), {
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

const MAYA = "U0MAYA";
const DM = "D0MAYA";
const UNIVERSAL = "C0UNIVERSAL";
const DESIGN = "C0DESIGN";

test("a ✅ from the person posts exactly the raise note in the team channel: no quote, no name", async () => {
  const { createInMemoryCommitmentStore } = await import("../src/commitments/index.js");
  const { dmAsksDue, raiseId } = await import("../src/dm-sweep/index.js");
  const { createInMemoryThreadState } = await import("../src/thread-state/index.js");
  const { createInMemoryProposalEventLog } = await import("../src/usage/index.js");
  const { resolveSignal } = await import("../src/gate/index.js");
  const { executeSweepSharePost } = await import("../src/tools/sweep-share-post.js");
  const { renderProposalCard } = await import("../src/slack/proposal-render.js");

  const now = Date.UTC(2026, 8, 30, 14, 5);
  const store = createInMemoryCommitmentStore();
  const threadState = createInMemoryThreadState({ now: () => now });
  const root = "1790694000.000100";
  const id = raiseId(DM, ["Figma", "the code"], root);
  await store.addCommitments([
    {
      id,
      kind: "dm_disagreement",
      channel: DM,
      channelKind: "dm",
      threadTs: root,
      messageTs: "1790694060.000200",
      promiserId: MAYA,
      requesterId: MAYA,
      deadlineAt: null,
      dueAt: now - 1,
      state: "open",
      nudges: 0,
      snoozes: 0,
      confidence: 0.9,
      promisedAt: 1_790_694_060_000,
      detectedAt: now - 60_000,
      runDate: "2026-09-29",
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
    },
  ]);
  await store.saveText(id, { what: "the warning colour", bodies: {}, raise: { sources: ["Figma", "the code"], to: "plus-universal" } }, now + 86_400_000);
  const posts: string[] = [];
  const handler = dmAsksDue({
    store,
    slack: {
      post: async () => assert.fail("the raise is a card"),
      async postCard(_to: unknown, card: import("../src/turn/index.js").ProposalCard) {
        const text = renderProposalCard(card).text;
        posts.push(text);
        return { ok: true, ts: "1790776800.900001", text };
      },
    },
    threadState,
    proposalEvents: createInMemoryProposalEventLog(),
    channels: { plusDesign: DESIGN, plusUniversal: UNIVERSAL, unoBot: "C0UNOBOT" },
  });
  const action = await handler.due((await store.get(id))!, now, "2026-09-30");
  assert.equal(action.action, "nudged");

  const react = (userId: string, glyph = "white_check_mark") =>
    resolveSignal(
      { kind: "reaction", messageTs: "1790776800.900001", channel: DM, thread: root, glyph, userId },
      { threadState },
    );
  assert.equal((await react("U0STRANGER")).execute, undefined, "only the person the DM is with");
  const yes = await react(MAYA);
  assert.equal(yes.outcome, "won");
  const ops = yes.execute!.operations;
  assert.equal(ops.length, 1);

  const env = {
    SLACK_BOT_TOKEN: "xoxb-test",
    PLUS_DESIGN_CHANNEL_ID: DESIGN,
    PLUS_UNIVERSAL_CHANNEL_ID: UNIVERSAL,
    UNO_BOT_CHANNEL_ID: "C0UNOBOT",
  } as unknown as import("../src/types.js").Env;
  const result = JSON.parse(await executeSweepSharePost(env, ops[0]!.input)) as { ok: boolean };
  assert.equal(result.ok, true);

  assert.equal(sent.length, 1, "one post");
  assert.match(sent[0]!.url, /chat\.postMessage$/);
  const body = sent[0]!.body;
  assert.equal(body.channel, UNIVERSAL, "the design system's channel");
  const text = String(body.text);
  assert.match(text, /Figma and the code disagree on the warning colour/);
  assert.ok(posts[0]!.includes(String(ops[0]!.input.text)), "the card showed exactly this note");
  for (const leak of [MAYA, "<@", DM, "alert banner", "#FFB020"]) assert.equal(text.includes(leak), false, `no ${leak}`);
});

test("the raise card's batch result is tagged as uno-bot's own post; other results keep theirs", async () => {
  const { resultMetadataFor } = await import("../src/agent/resolve-proposal.js");
  const { raiseSlot, DM_RAISE_EVENT } = await import("../src/dm-sweep/index.js");
  assert.equal(resultMetadataFor({ supersedeKey: raiseSlot("D0MAYA:raise:abc:1.0") }).metadata?.event_type, DM_RAISE_EVENT);
  assert.equal(resultMetadataFor({ sweepRun: { key: "k" } as never }).metadata?.event_type, "uno_sweep_card");
  assert.deepEqual(resultMetadataFor({}), {});
  assert.deepEqual(resultMetadataFor({ supersedeKey: "sweep-share" }), {});
});

test("a raise id holds the DM and a hash of the source pair — no topic, no source name", async () => {
  const { raiseId } = await import("../src/dm-sweep/index.js");
  const a = raiseId(DM, ["Figma", "the code"], "1.0");
  assert.equal(a, raiseId(DM, ["code", "figma"], "1.0"), "the same pair, however named or ordered");
  assert.notEqual(a, raiseId(DM, ["Figma", "Storybook"], "1.0"));
  for (const named of [["the Figma library", "the codebase"], ["Figma file", "the repo"], ["the code base", "Figma designs"]] as const) {
    assert.equal(raiseId(DM, named, "1.0"), a, `${named.join(" / ")} is the same pair`);
  }
  assert.equal(raiseId(DM, ["the Storybook docs", "the service blueprint"], "1.0"), raiseId(DM, ["Storybook", "Blueprint"], "1.0"));
  assert.notEqual(raiseId(DM, ["the Brand deck", "Figma"], "1.0"), a, "an unknown name keeps its own normalised name");
  assert.equal(raiseId(DM, ["the Brand deck", "Figma"], "1.0"), raiseId(DM, ["brand deck", "figma"], "1.0"));
  assert.match(a, /^D0MAYA:raise:[0-9a-f]{8}:1\.0$/);
});
