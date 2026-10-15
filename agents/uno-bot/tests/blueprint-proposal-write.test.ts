// A proposal offer, ✅'d by the person who asked, drawn on the blueprint as
// `proposed` rows — or nothing drawn at all.
//
// THE SEAM. The offer is staged as the turn stages it (`stagedProposalOffer`
// over a drafted proposal) in the in-memory ThreadState, a signal is resolved
// by `resolveSignal` exactly as a reaction is, and the verdict is handed to
// `executeVerdict`, the production path that runs a won card. What is asserted
// is what the blueprint would receive (the Supabase calls a fake fetch
// recorded), what the thread is told, and the thread → rows record written to
// the usage database.
//
// HOW THE WORLD IS FAKED. As in `blueprint-write.test.ts`: one routing stub on
// `globalThis.fetch` before anything imports `net.ts`, the modules under test
// loaded lazily, and thread history into a fake Durable Object. `USAGE_DB` is a
// fake that keeps each statement and its bound values; the SQL itself is the
// workerd suite's (`tests/workerd/proposal-records.conformance.test.ts`).
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { GateSignal, GateVerdict } from "../src/gate/index";
import type { PendingProposal } from "../src/thread-state/index";
import type { Comparison } from "../src/blueprint-upkeep/milestone";

interface Call {
  url: string;
  body: Record<string, unknown> | null;
}

const SUPABASE = "https://blueprint.test";
let calls: Call[] = [];
let failing = new Set<string>();

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  calls.push({ url, body });
  const reply = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
  if (url === `${SUPABASE}/auth/v1/token?grant_type=password`) {
    return reply({ access_token: "jwt", expires_in: 3600, token_type: "bearer" });
  }
  if (url === `${SUPABASE}/rest/v1/rpc/upsert_cell_at_status`) {
    const slot = `${String(body?.lane_id)}:${String(body?.step_id)}`;
    if (failing.has(slot)) return reply({ message: "the database fell over" }, 500);
    return reply({ id: `cell-${slot}`, inserted: true, change_id: `change-${calls.length}`, previous: null });
  }
  if (url.startsWith(SUPABASE)) return reply({ message: `no such route: ${url}` }, 404);
  if (url.includes("slack.com/api/")) return reply({ ok: true, ts: "1700000000.999999" });
  throw new Error(`no stub route for ${url}`);
}) as typeof fetch;

const gate = () => import("../src/gate/index.js");
const stores = () => import("../src/thread-state/index.js");
const upkeep = () => import("../src/blueprint-upkeep/index.js");

let appended: string[] = [];
const THREAD_STATE = {
  idFromName: () => "thread-state",
  get: () => ({
    appendHistory: async (_ref: unknown, turn: { content: string }) => {
      appended.push(turn.content);
      return { length: 1 };
    },
    settleOperation: async () => ({ taken: false }),
    endExecution: async () => {},
  }),
};

/** Each statement the usage database was sent, with its bound values. */
let statements: Array<{ sql: string; values: unknown[] }> = [];
const USAGE_DB = {
  prepare: (sql: string) => ({
    bind: (...values: unknown[]) => ({
      run: async () => {
        statements.push({ sql, values });
        return { meta: { changes: 1 } };
      },
      first: async () => null,
      all: async () => {
        statements.push({ sql, values });
        return { results: [] };
      },
    }),
  }),
};

function env(): Env {
  return {
    SLACK_BOT_TOKEN: "xoxb-test",
    SUPABASE_URL: SUPABASE,
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_WRITE_EMAIL: "uno-bot@uno-blueprint.local",
    SUPABASE_WRITE_PASSWORD: "pw",
    BLUEPRINT_APP_URL: "https://plus-uno.netlify.app/blueprint",
    THREAD_STATE,
    USAGE_DB,
  } as unknown as Env;
}

const CHANNEL = "C0TEAM";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";
const REQUESTER = "U0MAYA";
const BILL = "U0BILL0001";
const STANDING = ["U0STAND001"];

const COMPARISON: Comparison = {
  milestone: "prd",
  scenario: "Call-off",
  path: "Standard",
  cellId: "cell-2",
  quote: "Tutors post their own call-off and the first free tutor claims it.",
  text: "(the comparison)",
  today: {
    pathId: "path-1",
    scenario: "Call-off",
    path: "Standard",
    status: "live",
    lanes: [
      { id: "l-tutor", name: "Tutor" },
      { id: "l-sup", name: "Supervisor" },
    ],
    steps: [
      { id: "s-1", name: "Call off a session" },
      { id: "s-2", name: "Find a fill-in" },
    ],
    cells: [{ id: "cell-2", laneId: "l-sup", stepId: "s-2", content: "Supervisor asks around in Slack", status: "live" }],
  },
};

const DRAFT = JSON.stringify({
  rows: [
    { change: "added", step_id: "s-2", lane_id: "l-tutor", content: "Free tutor claims the posted call-off" },
    { change: "added", step_id: "s-1", lane_id: "l-sup", content: "Supervisor sees the call-off on the board" },
  ],
  new_steps_or_lanes: [],
  confidence: 0.7,
  gaps: [],
});

async function offer(): Promise<PendingProposal> {
  const { readProposalDraft, stagedProposalOffer } = await upkeep();
  const draft = readProposalDraft(DRAFT, COMPARISON, { title: "Self-serve call-offs", text: COMPARISON.quote });
  assert.ok(draft);
  return stagedProposalOffer(draft, {
    channel: CHANNEL,
    threadTs: THREAD,
    replyTs: THREAD,
    userMsgTs: "1700000000.000190",
    requesterUserId: REQUESTER,
    proposalTs: CARD_TS,
    proposalText: "(the offer card)",
  });
}

const signal = (userId: string, glyph = "white_check_mark"): GateSignal => ({
  kind: "reaction",
  messageTs: CARD_TS,
  channel: CHANNEL,
  thread: THREAD,
  glyph,
  userId,
});

async function decide(userId: string, glyph?: string, ageMs = 0): Promise<GateVerdict> {
  let now = 1_700_000_000_000;
  const threadState = (await stores()).createInMemoryThreadState({ now: () => now });
  await threadState.putProposal(await offer());
  now += ageMs;
  return (await gate()).resolveSignal(signal(userId, glyph), { threadState, standingConfirmers: STANDING });
}

async function execute(verdict: GateVerdict) {
  const { executeVerdict } = await import("../src/agent/resolve-proposal.js");
  return executeVerdict(env(), verdict);
}

const rpcCalls = () =>
  calls.filter((c) => c.url.includes("/rest/v1/rpc/")).map((c) => ({ fn: c.url.split("/rpc/")[1], args: c.body }));
const recorded = () => statements.filter((s) => /INSERT INTO blueprint_proposals/.test(s.sql));

beforeEach(async () => {
  calls = [];
  appended = [];
  statements = [];
  failing = new Set();
  const { forgetBlueprintSession } = await import("../src/blueprint-write/index.js");
  forgetBlueprintSession();
});

describe("✅ by the person who asked", () => {
  it("writes each drafted row as `proposed` on an empty slot, through the gated writer", async () => {
    const verdict = await decide(REQUESTER);
    assert.equal(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(
      rpcCalls().map((r) => [r.fn, r.args?.path_id, r.args?.step_id, r.args?.lane_id, r.args?.status]),
      [
        ["upsert_cell_at_status", "path-1", "s-2", "l-tutor", "proposed"],
        ["upsert_cell_at_status", "path-1", "s-1", "l-sup", "proposed"],
      ],
    );
  });

  it("tells the thread, with a link into the blueprint app", async () => {
    await execute(await decide(REQUESTER));
    assert.match(appended.join("\n"), /wrote 2 rows/i);
    assert.match(appended.join("\n"), /plus-uno\.netlify\.app\/blueprint\/\?cell=/);
  });

  it("keeps the thread → rows record: the card, its thread, who asked, the path and the slots", async () => {
    await execute(await decide(REQUESTER));
    const [insert] = recorded();
    assert.ok(insert, "one record");
    const [proposalTs, channel, threadTs, replyTs, requester, pathId, rows, writtenAt, cardId] = insert.values;
    assert.deepEqual([proposalTs, channel, threadTs, replyTs, requester, pathId, cardId], [CARD_TS, CHANNEL, THREAD, THREAD, REQUESTER, "path-1", null]);
    assert.deepEqual(JSON.parse(String(rows)), [
      { laneId: "l-tutor", stepId: "s-2" },
      { laneId: "l-sup", stepId: "s-1" },
    ]);
    assert.equal(typeof writtenAt, "number");
  });
});

describe("nothing is written or recorded", () => {
  it("when Bill, who confirms revisions of shipped work, presses ✅", async () => {
    const verdict = await decide(BILL);
    assert.notEqual(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
    assert.deepEqual(recorded(), []);
  });

  it("when a standing confirmer presses ✅", async () => {
    const verdict = await decide(STANDING[0]!);
    assert.notEqual(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
  });

  it("on ⛔", async () => {
    const verdict = await decide(REQUESTER, "no_entry");
    assert.equal(verdict.decision, "cancel");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
    assert.deepEqual(recorded(), []);
  });

  it("once the card has gone unanswered past its day", async () => {
    const verdict = await decide(REQUESTER, undefined, 25 * 3_600_000);
    assert.notEqual(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
    assert.deepEqual(recorded(), []);
  });

  it("when the write fails part-way: it is taken back, and no record is kept", async () => {
    failing.add("l-sup:s-1");
    await execute(await decide(REQUESTER));
    assert.match(appended.join("\n"), /did NOT complete|not written/i);
    assert.deepEqual(recorded(), []);
  });
});
