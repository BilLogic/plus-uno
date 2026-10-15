// A Figma @uno ask on its production wiring (#903): no Slack call at all.
//
// The ask's deps come from `figmaAskDepsFor(env)` and its turn from the real
// `buildTurnDeps` on the Figma wiring (`figmaTurnWiring`), so everything the
// Worker would bind for the turn is bound here. Only the model is scripted
// (the turn harness's loop, which proposes a write) and Figma is in memory.
// Every network call goes through the `fetch` stub below, which records it.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

/** Every request the turn sent, by URL. */
const sent: string[] = [];
globalThis.fetch = (async (input: RequestInfo | URL) => {
  sent.push(String(input));
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

const FILE = "FILEKEY1";
const SARAH = { id: "1500001", handle: "sarah" };
const NOW = Date.parse("2026-10-09T15:00:00Z");

describe("a Figma ask on its production wiring", () => {
  it("that proposes a write makes no Slack call: one Figma reply, answered, nothing staged", async () => {
    const { figmaAskDepsFor, figmaTurnWiring } = await import("../src/figma-ask/env.js");
    const { answerFigmaAsk } = await import("../src/figma-ask/job.js");
    const { createInMemoryFigma } = await import("../src/figma/in-memory.js");
    const { buildTurnDeps } = await import("../src/turn/env-deps.js");
    const { runTurn } = await import("../src/turn/index.js");
    const { harness } = await import("./helpers/turn-harness.js");

    const kv = new Map<string, string>();
    const env = {
      FIGMA_ACCESS_TOKEN: "figd_test",
      SLACK_BOT_TOKEN: "xoxb-test",
      PLUS_DESIGN_CHANNEL_ID: "C03FC8AS69K",
      FIGMA_ASK_CHANNEL_ID: "D0APTB20SK0",
      LEAD_USER_ID: "ULEAD",
      HARNESS_KV: {
        get: async (key: string, type?: string) => {
          const v = kv.get(key) ?? null;
          return v !== null && type === "json" ? JSON.parse(v) : v;
        },
        put: async (key: string, value: string) => void kv.set(key, value),
      },
      THREAD_STATE: {},
    } as unknown as Env;

    const base = figmaAskDepsFor(env);
    assert.ok(base);
    const figma = createInMemoryFigma({ me: { id: "900000001", handle: "Bill" }, now: () => NOW });
    figma.seedFile(FILE, {
      name: "Goal Setting / Card 2482 / Meryem",
      creator: SARAH,
      comments: [
        {
          id: "100",
          file_key: FILE,
          parent_id: "",
          user: SARAH,
          created_at: "2026-10-09T14:59:00Z",
          resolved_at: null,
          message: "@uno please add to the PRD: hide the bar until the first goal",
          client_meta: { node_id: "12:34", node_offset: { x: 0, y: 0 } },
        },
      ],
    });
    // The model alone is scripted: it proposes a Roadmap card.
    const h = harness({ replies: [{ text: "Drafting it.", toolCalls: [{ name: "notion_create", args: { title: "Hide the bar until the first goal" } }] }] });
    const outcomes: string[] = [];
    await answerFigmaAsk(
      { fileKey: FILE, commentId: "100" },
      {
        ...base,
        figma,
        people: async () => ({ [SARAH.id]: "USARAH" }),
        threadState: h.threadState,
        answer: async (request, delivery, asker) => {
          const deps = buildTurnDeps(env, request, figmaTurnWiring(h.threadState, delivery, asker));
          const outcome = await runTurn(request, { ...deps, runAgent: h.deps.runAgent, reviewDraft: h.deps.reviewDraft });
          outcomes.push(outcome.disposition);
          return outcome;
        },
        now: () => NOW,
      },
    );

    assert.deepEqual(sent.filter((url) => url.includes("slack.com")), [], "no Slack call");
    assert.deepEqual(figma.writes().map((w) => w.method), ["replyToComment"]);
    assert.match(String(figma.writes()[0]!.args[2]), /^🐐: I can't make changes from a Figma comment/);
    assert.deepEqual(outcomes, ["answered"]);
    assert.equal(await h.threadState.getProposalByThread({ channel: "C03FC8AS69K", thread: `figma:${FILE}:100` }), null);
  });
});
