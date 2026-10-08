// The ⚠️ line: a context line under the answer, beside the footer, for what the
// reader must not miss. Code adds it when the turn already knows a lookup was
// partial, a source failed, the lookup budget ran out, the data is past its
// freshness cutoff or the absence check fired; the model may add one for an
// estate conflict, through `present`, never by typing ⚠️ into its prose.
//
// Driven across `runTurn` on the Turn harness, then the presentation Delivery
// was handed is posted on the recording posting client, which holds it to the
// block rules Slack holds it to.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall, type Presentation } from "../src/turn/index";
import { postTextVerified } from "../src/slack/delivery";
import { harness, request } from "./helpers/turn-harness";
import { recordingPosting } from "./helpers/recording-slack";

type Call = { name: string; args: Record<string, unknown> };
type HarnessOpts = NonNullable<Parameters<typeof harness>[0]>;

const SEARCH: Call = { name: "search_blueprint", args: { query: "goal cycles" } };
const ROADMAP: Call = { name: "roadmap_query", args: { title: "goal cycle" } };

const blueprintRows = (extra: Record<string, unknown> = {}, rows: unknown[] = [{ title: "Goal Setting", url: "https://blueprint.example/goal" }]) =>
  JSON.stringify({ ok: true, query: "goal cycles", count: rows.length, rows, ...extra });

const roadmapCards = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    ok: true,
    hits: 1,
    cards: [{ title: "Goal cycle resets per session", url: "https://notion.example/2569", card_number: 2569, design_status: "Need PRD" }],
    ...extra,
  });

/** Run one turn: each batch of lookups as one model reply, then the prose. */
async function turn(
  batches: Call[][],
  results: Record<string, string>,
  opts: Omit<HarnessOpts, "replies" | "toolResultFor"> & { prose?: string } = {},
) {
  const { prose, ...rest } = opts;
  const h = harness({
    replies: [
      ...batches.map((toolCalls) => ({ toolCalls })),
      { text: prose ?? "**Goal cycles reset weekly today.** A tutor reviews progress in the session wrap-up." },
    ],
    toolResultFor: (name) => results[name] ?? JSON.stringify({ ok: true, rows: [] }),
    ...rest,
  });
  await runTurn(request({ text: "how do goal cycles work today?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  const told = h.provider.transcript
    .flatMap((e) => (e.kind === "results" ? e.results : []))
    .filter((r) => r.name === "present")
    .map((r) => JSON.parse(r.text) as Record<string, unknown>);
  return { h, answer, warnings: answer.presentation?.warnings ?? [], told };
}

type Block = { type: string; elements?: Array<{ type: string; text?: string }> };

/** Post the prose and its presentation as the Slack path does. */
async function posted(prose: string, presentation: Presentation | undefined) {
  const slack = recordingPosting();
  await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", prose, { userId: "U1", team: "T1" }, undefined, {
    ...(presentation ? { presentation } : {}),
  });
  const [message] = slack.of("message");
  return { message: message!, blocks: (message?.blockList ?? []) as Block[] };
}

const contextTexts = (blocks: Block[]) =>
  blocks.filter((b) => b.type === "context").map((b) => b.elements?.map((e) => e.text).join("") ?? "");

test("a partial lookup leaves one ⚠️ line, posted as a context line above the footer and in the text", async () => {
  const { answer, warnings } = await turn([[SEARCH]], { search_blueprint: blueprintRows({ truncated: true, matched: 40 }) });

  assert.deepEqual(warnings, ["Only part of the blueprint results came back, so something may be missing."]);

  const { blocks, message } = await posted(answer.text, answer.presentation);
  assert.deepEqual(blocks.map((b) => b.type), ["markdown", "context", "context"]);
  assert.deepEqual(contextTexts(blocks), [
    "⚠️ Only part of the blueprint results came back, so something may be missing.",
    "_LLM-written · check before acting_",
  ]);
  assert.match(message.text, /\n\n⚠️ Only part of the blueprint results came back, so something may be missing\.$/);
});

test("a clean turn carries no ⚠️ line", async () => {
  const { answer, warnings } = await turn([[SEARCH], [ROADMAP]], { search_blueprint: blueprintRows(), roadmap_query: roadmapCards() });

  assert.deepEqual(warnings, []);
  assert.equal(answer.presentation?.warnings, undefined);
  const { blocks, message } = await posted(answer.text, answer.presentation);
  assert.ok(!contextTexts(blocks).some((t) => t.includes("⚠")));
  assert.doesNotMatch(message.text, /⚠/);
});

test("partial lookups of two sources are still one line, naming both", async () => {
  const { warnings } = await turn([[SEARCH], [ROADMAP]], {
    search_blueprint: blueprintRows({ truncated: true }),
    roadmap_query: roadmapCards({ truncated: true }),
  });

  assert.deepEqual(warnings, ["Only part of the blueprint and Roadmap results came back, so something may be missing."]);
});

test("a source that errored leaves one line; a retry that came back whole clears it", async () => {
  const down = JSON.stringify({ ok: false, error: "Notion 502: bad gateway" });
  const failed = await turn([[ROADMAP]], { roadmap_query: down });
  assert.deepEqual(failed.warnings, ["The Roadmap board could not be read just now, so this answer goes without it."]);

  const timedOut = await turn([[SEARCH]], {
    search_blueprint: JSON.stringify({ ok: false, error: "The operation timed out", reason: "unreachable" }),
  });
  assert.deepEqual(timedOut.warnings, ["The blueprint could not be read just now, so this answer goes without it."]);

  let calls = 0;
  const h = harness({
    replies: [{ toolCalls: [ROADMAP] }, { toolCalls: [ROADMAP] }, { text: "**Goal cycle resets per session is in Need PRD.**" }],
    toolResultFor: () => (++calls === 1 ? down : roadmapCards()),
  });
  await runTurn(request({ text: "where is the goal cycle card?" }), h.deps);
  const retried = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.equal(retried?.presentation?.warnings, undefined, "the retry answered, so nothing is missing");
});

test("a lookup the model asked badly is no warning: the argument was its to fix", async () => {
  const { warnings } = await turn([[ROADMAP]], {
    roadmap_query: JSON.stringify({ ok: false, error: '"In Review" is not a Design Status on the Roadmap board' }),
  });

  assert.deepEqual(warnings, []);
});

const BUDGET_LINE = "This answer stopped before every lookup finished, so some sources went unchecked.";

test("the lookup budget leaves one line, whether it refused a lookup, cut one short or ended the loop", async () => {
  const budgetError = new Error("subrequest budget");
  const refusing = await turn([[SEARCH], [ROADMAP]], {}, {
    budget: {
      used: () => 0,
      trips: () => 0,
      withLookupLimit: () => Promise.reject(budgetError),
      isBudgetError: (err) => err === budgetError,
      breakdown: () => "test",
    },
  });
  assert.deepEqual(refusing.warnings, [BUDGET_LINE], "two refusals, one line");

  let trips = 0;
  const cutting = await turn([[SEARCH]], { search_blueprint: blueprintRows() }, {
    budget: {
      used: () => 0,
      trips: () => trips,
      withLookupLimit: async (_limit, fn) => {
        const out = await fn();
        trips += 1;
        return out;
      },
      isBudgetError: () => false,
      breakdown: () => "test",
    },
  });
  assert.deepEqual(cutting.warnings, [BUDGET_LINE]);

  const spent = await turn([], {}, {
    budget: { used: () => 1_000, trips: () => 0, withLookupLimit: (_l, fn) => fn(), isBudgetError: () => false, breakdown: () => "test" },
  });
  assert.deepEqual(spent.warnings, [BUDGET_LINE], "the synthesis pass is a budget cut-off too");
});

test("blueprint rows older than the freshness cutoff leave one line; fresh ones none", async () => {
  const now = () => Date.parse("2026-10-08T12:00:00Z");
  const rows = (at: string) => blueprintRows({}, [{ title: "Goal Setting", updatedAt: at }, { title: "Goal Review", updatedAt: "2024-01-01" }]);

  const stale = await turn([[SEARCH]], { search_blueprint: rows("2026-01-15") }, { now });
  assert.deepEqual(stale.warnings, ["The blueprint rows behind this answer were last updated over 6 months ago, so they may be out of date."]);

  const fresh = await turn([[SEARCH]], { search_blueprint: rows("2026-09-30") }, { now });
  assert.deepEqual(fresh.warnings, [], "the newest row is what counts");
});

test("the absence check firing leaves one line, scoped to what was searched", async () => {
  const { warnings } = await turn([[{ name: "slack_search", args: { query: "deadline" } }]], {}, {
    absence: { visibility: "public-only", searchedSurfaces: "public channels" },
    prose: "No one has mentioned a hard deadline for the reflection redesign.",
  });

  assert.deepEqual(warnings, ["I searched only public Slack channels, so finding nothing there does not mean it was never said."]);
});

const CONFLICT = "The blueprint says goal cycles reset weekly; Roadmap card #2569 plans to count sessions instead.";
const conflict = (line: unknown): Call => ({ name: "present", args: { shape: "conflict", line } });

test("the model's conflict goes through present and posts as a ⚠️ line it never typed", async () => {
  const { answer, warnings, told } = await turn([[SEARCH], [ROADMAP], [conflict(`⚠️ ${CONFLICT}`)]], {
    search_blueprint: blueprintRows(),
    roadmap_query: roadmapCards(),
  });

  assert.deepEqual(warnings, [CONFLICT], "the sign the model typed is dropped; code places it");
  assert.equal(told.at(-1)?.warning_attached, true);
  const { message } = await posted(answer.text, answer.presentation);
  assert.match(message.text, /\n\n⚠️ The blueprint says goal cycles reset weekly; Roadmap card #2569 plans to count sessions instead\.$/);
});

test("a conflict line is refused unless two sources answered, and must be one sentence with no emoji", async () => {
  for (const [batches, line, why] of [
    [[[SEARCH]], CONFLICT, /two sources/],
    [[[SEARCH], [ROADMAP]], "The blueprint says weekly. The card says sessions.", /One sentence/],
    [[[SEARCH], [ROADMAP]], "The blueprint says weekly 🙃 but the card says sessions.", /No emoji/],
  ] as const) {
    const { warnings, told } = await turn([...batches, [conflict(line)]] as Call[][], {
      search_blueprint: blueprintRows(),
      roadmap_query: roadmapCards(),
    });
    assert.deepEqual(warnings, []);
    assert.equal(told.at(-1)?.warning_attached, false);
    assert.match(String(told.at(-1)?.error), why);
  }
});

test("a third line is dropped: two lines at most, in the order their triggers were met", async () => {
  const { answer, warnings, told } = await turn(
    [[SEARCH], [ROADMAP], [conflict(CONFLICT)]],
    {
      search_blueprint: blueprintRows({ truncated: true }),
      roadmap_query: JSON.stringify({ ok: false, error: "Notion 503: service unavailable" }),
    },
  );

  assert.deepEqual(warnings, [
    "Only part of the blueprint results came back, so something may be missing.",
    "The Roadmap board could not be read just now, so this answer goes without it.",
  ]);
  assert.equal(told.at(-1)?.warning_attached, false, "the model hears its line will not show");

  const third = await turn([[SEARCH], [ROADMAP]], {
    search_blueprint: blueprintRows({ truncated: true }),
    roadmap_query: JSON.stringify({ ok: false, error: "Notion 503: service unavailable" }),
  }, {
    absence: { visibility: "public-only", searchedSurfaces: "public channels" },
    prose: "No one has mentioned a hard deadline.",
  });
  assert.equal(third.warnings.length, 2, "the absence line, met last, is the one dropped");

  const { blocks } = await posted(answer.text, answer.presentation);
  assert.equal(contextTexts(blocks).filter((t) => t.startsWith("⚠️")).length, 2);
});
