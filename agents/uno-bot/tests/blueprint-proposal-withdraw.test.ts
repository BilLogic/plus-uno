// A drawn proposal withdrawn on its requester's ✅: its cells deleted, then
// its `proposed` path, through the delete RPCs as uno-bot — or nothing deleted.
//
// THE SEAM. The removal card is staged as the Worker stages it
// (`stagedWithdrawal` over a drawn proposal's record), a signal is resolved by
// `resolveSignal` exactly as a reaction is, and the verdict is handed to
// `executeVerdict`, the production path that runs a won card. What is asserted
// is what the blueprint would receive (the Supabase calls a fake fetch
// recorded), what the thread is told, and the withdrawal marked on the record.
//
// HOW THE WORLD IS FAKED. As in `blueprint-proposal-write.test.ts`: one routing
// stub on `globalThis.fetch` before anything imports `net.ts`, the modules
// under test loaded lazily, thread history into a fake Durable Object, and a
// `USAGE_DB` that keeps each statement and answers the record's read.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { GateSignal, GateVerdict } from "../src/gate/index";
import type { DrawnProposal } from "../src/blueprint-upkeep/proposal-records";

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
  if (url === `${SUPABASE}/rest/v1/rpc/delete_cell`) {
    if (failing.has(String(body?.cell_id))) return reply({ message: "cell not found" }, 400);
    return reply("archive-cell");
  }
  if (url === `${SUPABASE}/rest/v1/rpc/delete_path`) {
    if (failing.has("path")) return reply({ message: "the database fell over" }, 500);
    return reply("archive-path");
  }
  if (url.startsWith(SUPABASE)) return reply({ message: `no such route: ${url}` }, 404);
  if (url.includes("slack.com/api/")) return reply({ ok: true, ts: "1700000000.999999" });
  throw new Error(`no stub route for ${url}`);
}) as typeof fetch;

const gate = () => import("../src/gate/index.js");
const stores = () => import("../src/thread-state/index.js");
const cleanup = () => import("../src/blueprint-upkeep/proposal-cleanup.js");

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

const CHANNEL = "C0TEAM";
const THREAD = "1700000000.000100";
const PROPOSAL_TS = "1700000000.000500";
const CARD_TS = "1700000000.000800";
const REQUESTER = "U0MAYA";
const BILL = "U0BILL0001";
const STANDING = ["U0STAND001"];

const DRAWN: DrawnProposal = {
  proposalTs: PROPOSAL_TS,
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  requesterId: REQUESTER,
  pathId: "path-new",
  todayPathId: "path-1",
  cellIds: ["cell-a", "cell-b"],
  writtenAt: 1_690_000_000_000,
  cardId: null,
};

/** What the record reads back as: its card and its marks. */
let row: { card_id: string | null; withdrawn_at: number | null } = { card_id: null, withdrawn_at: null };
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
        if (/FROM blueprint_proposals WHERE proposal_ts = \?1/.test(sql)) {
          return {
            results: [
              {
                proposal_ts: PROPOSAL_TS,
                channel_id: CHANNEL,
                thread_ts: THREAD,
                reply_ts: THREAD,
                requester_id: REQUESTER,
                path_id: "path-new",
                today_path_id: "path-1",
                cell_ids: JSON.stringify(DRAWN.cellIds),
                written_at: DRAWN.writtenAt,
                card_id: row.card_id,
                offered_at: null,
                withdrawn_at: row.withdrawn_at,
              },
            ],
          };
        }
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

const signal = (userId: string, glyph = "white_check_mark"): GateSignal => ({
  kind: "reaction",
  messageTs: CARD_TS,
  channel: CHANNEL,
  thread: THREAD,
  glyph,
  userId,
});

async function decide(reason: "asked" | "aged", userId: string, glyph?: string, ageMs = 0): Promise<GateVerdict> {
  const { stagedWithdrawal } = await cleanup();
  let now = 1_700_000_000_000;
  const threadState = (await stores()).createInMemoryThreadState({ now: () => now });
  await threadState.putProposal(stagedWithdrawal(DRAWN, reason, { ts: CARD_TS, text: "(the removal card)" }));
  now += ageMs;
  return (await gate()).resolveSignal(signal(userId, glyph), { threadState, standingConfirmers: STANDING });
}

async function execute(verdict: GateVerdict) {
  const { executeVerdict } = await import("../src/agent/resolve-proposal.js");
  return executeVerdict(env(), verdict);
}

const rpcCalls = () =>
  calls.filter((c) => c.url.includes("/rest/v1/rpc/")).map((c) => [c.url.split("/rpc/")[1], c.body?.cell_id ?? c.body?.path_id]);
const withdrawals = () => statements.filter((s) => /SET withdrawn_at/.test(s.sql));

beforeEach(async () => {
  calls = [];
  appended = [];
  statements = [];
  failing = new Set();
  row = { card_id: null, withdrawn_at: null };
  const { forgetBlueprintSession } = await import("../src/blueprint-write/index.js");
  forgetBlueprintSession();
});

describe("✅ by the person who drew it", () => {
  for (const reason of ["asked", "aged"] as const) {
    it(`deletes its cells, then its path, through the delete RPCs (${reason})`, async () => {
      const verdict = await decide(reason, REQUESTER);
      assert.equal(verdict.outcome, "won");
      await execute(verdict);
      assert.deepEqual(rpcCalls(), [
        ["delete_cell", "cell-a"],
        ["delete_cell", "cell-b"],
        ["delete_path", "path-new"],
      ]);
      assert.ok(!calls.some((c) => c.url.includes("record_authoring_change")), "each delete records itself, as uno-bot");
      assert.ok(!calls.some((c) => JSON.stringify(c.body ?? {}).includes("path-1")), "today's path is never touched");
    });
  }

  it("marks the record withdrawn and tells the thread", async () => {
    await execute(await decide("asked", REQUESTER));
    assert.equal(withdrawals().length, 1);
    assert.equal(withdrawals()[0]!.values[0], PROPOSAL_TS);
    assert.match(appended.join("\n"), /Removed the proposal from the blueprint as uno-bot: its 2 cells and its proposed path/);
  });

  it("a cell already gone does not stop the path's deletion, and is named", async () => {
    failing.add("cell-a");
    await execute(await decide("asked", REQUESTER));
    assert.deepEqual(rpcCalls().map((c) => c[0]), ["delete_cell", "delete_cell", "delete_path"]);
    assert.equal(withdrawals().length, 1);
    assert.match(appended.join("\n"), /cell-a/);
  });

  it("a path that cannot be deleted leaves the record standing and says so", async () => {
    failing.add("path");
    await execute(await decide("asked", REQUESTER));
    assert.deepEqual(withdrawals(), []);
    assert.match(appended.join("\n"), /not removed/i);
  });
});

describe("nothing is deleted", () => {
  it("when Bill presses ✅", async () => {
    const verdict = await decide("aged", BILL);
    assert.notEqual(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
  });

  it("when a standing confirmer presses ✅", async () => {
    const verdict = await decide("aged", STANDING[0]!);
    assert.notEqual(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
  });

  it("on ⛔: the proposal is kept", async () => {
    const verdict = await decide("aged", REQUESTER, "no_entry");
    assert.equal(verdict.decision, "cancel");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
    assert.deepEqual(withdrawals(), []);
  });

  it("when the offer goes unanswered past its window: the proposal is kept", async () => {
    const { WITHDRAWAL_CARD_TTL_MS } = await cleanup();
    const verdict = await decide("aged", REQUESTER, undefined, WITHDRAWAL_CARD_TTL_MS.aged + 3_600_000);
    assert.notEqual(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(rpcCalls(), []);
  });

  it("when it was already withdrawn", async () => {
    row.withdrawn_at = 1_699_000_000_000;
    await execute(await decide("asked", REQUESTER));
    assert.deepEqual(rpcCalls(), []);
    assert.match(appended.join("\n"), /already/i);
  });

  it("when an aged offer's proposal was linked to a Roadmap card since: linked proposals are never removed by the check", async () => {
    row.card_id = "page-a";
    await execute(await decide("aged", REQUESTER));
    assert.deepEqual(rpcCalls(), []);
    assert.deepEqual(withdrawals(), []);
  });
});

describe("the press's budget", () => {
  it("counts each cell's deletion and the path's", async () => {
    const { readWithdrawal, withdrawalWriteCalls, stagedWithdrawal } = await cleanup();
    const staged = stagedWithdrawal(DRAWN, "asked", { ts: CARD_TS, text: "" });
    const w = readWithdrawal(staged.input);
    assert.ok(!("error" in w));
    assert.equal(withdrawalWriteCalls(w), 3);
  });
});
