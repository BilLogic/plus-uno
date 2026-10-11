// The Slack sweep's key decisions get a Decisions DB row on the rules the
// Figma comment read keeps (#891): whole sweep days through the sweep
// harness, asserting what a fix's Review would run.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import { runSweepJob } from "../src/sweep/index";
import type { DecisionRow } from "../src/integrations/notion";
import { at, DESIGN, drift, msg, notionPage, reply, ROADMAP_DB, sweepHarness, ts, type FakeChannel } from "./helpers/sweep-harness";

const END_OF_DAY: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };
const MORNING: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };

const CARD = notionPage("cccccccccccccccccccccccccccccccc", { title: "Goal Setting", parentDatabaseId: ROADMAP_DB, parentType: "database_id" });
const ADE_N = "a0000000000000000000000000000001";
const BEA_N = "b0000000000000000000000000000002";
const ROW: DecisionRow = { id: "row1", url: "https://www.notion.so/row1", name: "Launch date", status: "Accepted", signOff: [] };

/** Ade proposes the new date with the card linked; Bea agrees. */
function channel(kind: FakeChannel["kind"]): Record<string, FakeChannel> {
  const root = msg("U0ADE", ts(29, 15), `Let's move launch to Nov 1 <${CARD.url}|card>`, { reply_count: 1, latest_reply: ts(29, 16) });
  return {
    [DESIGN]: {
      kind,
      history: [root],
      threads: { [root.ts]: [root, msg("U0BEA", ts(29, 16), "Agreed — Nov 1.", { thread_ts: root.ts })] },
      members: ["U0ADE", "U0BEA"],
    },
  };
}

const KEY = {
  ...drift({ source: CARD, evidence: [ts(29, 15), ts(29, 16)], claimedBy: "U0ADE" }),
  row: { name: "Launch on November 1", stage: "Accepted", proposer: "U0ADE", approvers: ["<@U0BEA>"], relation: "supersede", row_id: "row1", card_url: CARD.url },
};

async function day(kind: FakeChannel["kind"]) {
  const h = sweepHarness({
    channels: channel(kind),
    sources: [CARD],
    detectorReplies: [reply(KEY)],
    now: at(29, 22),
    ...(kind === "public" ? {} : { privateAllowlist: [DESIGN] }),
    decisions: { rows: { [CARD.url]: [ROW] }, notion: { [ADE_N]: "U0ADE", [BEA_N]: "U0BEA" } },
  });
  await runSweepJob(END_OF_DAY, h.deps);
  h.clock.now = at(30, 13);
  await runSweepJob(MORNING, h.deps);
  return h;
}

test("a key decision in a thread drafts its row beside the fix, with the thread's permalink as Evidence", async () => {
  const h = await day("public");
  assert.match(String((h.provider.generated[0] as { prompt?: string }).prompt), /\[row row1\] Launch date · Accepted/);
  assert.equal(h.staged.length, 1);
  const [fix, create, mark] = h.staged[0]!.operations!;
  assert.equal(fix!.toolName, "notion_update");
  const evidence = `https://plus.slack.com/archives/${DESIGN}/p${ts(29, 15).replace(".", "")}`;
  assert.deepEqual(create, {
    toolName: "notion_create",
    input: {
      surface: "decision",
      title: "Launch on November 1",
      properties: { roadmap_card: CARD.url, status: "Accepted", evidence, owner: [ADE_N], sign_off: [BEA_N] },
      sections: [
        { heading: "Decision", body: "Launch moved to November 1." },
        { heading: "Source / Evidence", body: evidence },
        { heading: "Supersedes", body: ROW.url },
      ],
    },
  });
  assert.deepEqual(mark, {
    toolName: "notion_update",
    input: { page_url: ROW.url, properties: { Status: "Superseded" }, append: { text: `Superseded 2026-09-30 by: Launch moved to November 1. Evidence: ${evidence}` } },
  });
  assert.match(h.staged[0]!.proposalText, /Decisions DB: new row "Launch on November 1" · Accepted, superseding "Launch date"/);
});

test("a decision from a private channel stays out of the Decisions DB", async () => {
  const h = await day("private");
  assert.equal(h.staged.length, 1);
  assert.deepEqual(
    h.staged[0]!.operations!.map((o) => o.toolName),
    ["notion_update"],
  );
});
