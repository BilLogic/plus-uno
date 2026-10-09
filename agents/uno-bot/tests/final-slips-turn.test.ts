// The live r528 reply to the pain-points prompt, once the walk was gone: its
// intro line "Here is the scenario-by-scenario breakdown across the journey:"
// still stood over nothing, and the ⚠️ partial line posted twice. Driven
// across `runTurn`, then posted on the recording posting client the way the
// Slack path posts it.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall } from "../src/turn/index";
import { postTextVerified } from "../src/slack/delivery";
import { harness, request } from "./helpers/turn-harness";
import { recordingPosting } from "./helpers/recording-slack";

const cell = (n: number) => `https://plus-uno.netlify.app/blueprint/?cell=c-${n}`;

/** A blueprint search that came back partial. */
const PARTIAL = JSON.stringify({
  ok: true,
  query: "pain points",
  count: 2,
  truncated: true,
  rows: [1, 2].map((n) => ({ title: `Cell ${n}`, url: cell(n) })),
});

const LEAD =
  "**The main tutor pain points documented in `uno-blueprint` center around rigid onboarding gates, high call-off friction, in-session attention splitting and disconnected payroll entry.**";
const INTRO = "Here is the scenario-by-scenario breakdown across the journey:";
const FRESH =
  "I queried the service blueprint cells and exception paths across all journey phases just now, so these pain points and lane attributions are current.";
const PARTIAL_LINE = "Only part of the blueprint results came back, so something may be missing.";
const TABLE = [
  "Tutor Pain Points Summary Table",
  "",
  "| Phase | Scenario | Pain point |",
  "| --- | --- | --- |",
  "| Onboarding | Session Sign Up | Hard onboarding gate |",
  "| Pre-session | Call-off Request | Late call-offs |",
];

/** The walk as r528 wrote it: phase labels over 3 levels of bullets. */
const WALK = [1, 2, 3].flatMap((p) => [
  `Phase: Phase ${p}`,
  `• *\`Scenario\`: \`Scenario ${p}\`*`,
  `    ◦ *Pain Point — Friction ${p}:*`,
  `        ▪︎ In [Step ${p}](${cell(10 + p)}), tutors wait on a supervisor for reasons the blueprint records.`,
  `        ▪︎ In [Step ${p}b](${cell(20 + p)}), the same wait repeats at the next step.`,
  "",
]);

/** One turn: two partial searches, then `prose`; and the answer as Slack gets it. */
async function turn(prose: string) {
  const search = (q: string) => ({ toolCalls: [{ name: "search_blueprint", args: { query: q } }] });
  const h = harness({
    replies: [search("pain points"), search("exceptions"), { text: prose }],
    toolResultFor: () => PARTIAL,
  });
  await runTurn(request({ text: "What are the main tutor pain points in the blueprint, by scenario?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");

  const slack = recordingPosting();
  await postTextVerified(slack.deps({ streamingOn: false }), "D1", "100.1", answer.text, { userId: "U1", team: "T1" }, undefined, {
    ...(answer.presentation ? { presentation: answer.presentation } : {}),
  });
  const [message] = slack.of("message");
  return { prose: answer.text, presentation: answer.presentation, posted: JSON.stringify(message?.blockList ?? []) };
}

const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

test("the live r528 shape: an intro in its own paragraph over the removed walk goes with it", async () => {
  const prose = [LEAD, "", INTRO, "", ...WALK, ...TABLE, "", FRESH].join("\n");
  const { prose: posted } = await turn(prose);
  assert.equal(posted, [LEAD, "", ...TABLE, "", FRESH].join("\n"));
});

test("an intro ending in ':' goes when what it introduced went, though a confidence bullet stays below it", async () => {
  const clause = `• ${FRESH}`;
  const prose = [LEAD, "", INTRO, "", ...WALK, clause, "", ...TABLE].join("\n");
  const { prose: posted } = await turn(prose);
  assert.equal(posted, [LEAD, "", clause, "", ...TABLE].join("\n"));
});

test("the ⚠️ partial line posts once, though two lookups came back partial and the prose typed it too", async () => {
  const prose = [LEAD, "", ...TABLE, "", FRESH, "", `⚠️ ${PARTIAL_LINE}`].join("\n");
  const { prose: shipped, presentation, posted } = await turn(prose);

  assert.deepEqual(presentation?.warnings, [PARTIAL_LINE]);
  assert.doesNotMatch(shipped, /Only part of/, "the prose's own copy of the line comes out: code posts it beneath");
  assert.equal(count(posted, PARTIAL_LINE), 1, "once in the posted blocks");
});
