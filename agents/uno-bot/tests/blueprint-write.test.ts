// A staged blueprint revision, resolved through the Gate, written through the
// blueprint's authoring RPCs — or not written at all.
//
// THE SEAM. A revision card is staged in the in-memory ThreadState, a signal
// is resolved by `resolveSignal` exactly as a reaction or a button is, and the
// verdict is handed to `executeVerdict`, the production path that runs a won
// card's operations. What is asserted is what the blueprint would receive —
// the Supabase calls the fake fetch recorded — and what the thread is told.
//
// HOW THE WORLD IS FAKED. As in `execute-verdict.test.ts`: one routing stub
// on `globalThis.fetch` before anything imports `net.ts`, the module under
// test loaded lazily, and thread history into a fake Durable Object. The
// Supabase half of the stub plays the uno-blueprint project: the password
// grant mints a token, `upsert_cell_at_status` and `set_path_status` answer as
// plus-uno-blueprint `20261015120000` defines them, and a row can be told to
// fail or to have moved since the draft. `log` plays `authoring_changes` with
// that migration's trigger: a row appended under an `rpc_writer` JWT reads
// `author = uno-bot` with the token's `sub`, whoever appended it, and anyone
// else claiming `uno-bot` is refused.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { GateSignal, GateVerdict } from "../src/gate/index";
import type { PendingProposal } from "../src/thread-state/index";
import type { BlueprintRevision } from "../src/blueprint-write/index";

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
}

const SUPABASE = "https://blueprint.test";
const BOT_UID = "0b0b0b0b-0000-4000-8000-00000000b0b0";
const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
/** uno-bot's JWT as the password grant mints it: `app_metadata` set by the server. */
const TOKEN = `${b64url({ alg: "HS256" })}.${b64url({ sub: BOT_UID, role: "authenticated", app_metadata: { role: "rpc_writer" } })}.sig`;

interface LogRow {
  fn: string;
  author: string;
  author_id: string | null;
  agent_session_id: unknown;
}
let log: LogRow[] = [];

/** The claims of the bearer token a request carries, or null. */
function claims(headers: Record<string, string>): { sub?: string; app_metadata?: { role?: string } } | null {
  const jwt = headers.authorization?.replace(/^Bearer /, "");
  const payload = jwt?.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: string; app_metadata?: { role?: string } };
  } catch {
    return null;
  }
}

/** One append to `authoring_changes`, through the trigger `authoring_changes_name_uno_bot`. */
function append(headers: Record<string, string>, fn: string, author: string, sessionId: unknown = null): string | null {
  const who = claims(headers);
  if (who?.app_metadata?.role === "rpc_writer") {
    log.push({ fn, author: "uno-bot", author_id: who.sub ?? null, agent_session_id: sessionId });
  } else if (author === "uno-bot") {
    return "Only the uno-bot account writes as uno-bot";
  } else {
    log.push({ fn, author, author_id: who?.sub ?? null, agent_session_id: sessionId });
  }
  return null;
}

let calls: Call[] = [];
/** Slots (`lane:step`) whose write fails with a 500. */
let failing = new Set<string>();
/** Slots that already hold a cell, as `{content, status}` — a write there
 *  takes the update half and reports what stood before. */
let occupied = new Map<string, { id: string; content: string; status: string }>();
let pathStatus = "planned";
let minted = 0;

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const headers = Object.fromEntries(new Headers(init?.headers).entries());
  let body: Record<string, unknown> | null = null;
  if (typeof init?.body === "string") {
    try {
      body = JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      body = null;
    }
  }
  calls.push({ url, method: init?.method ?? "GET", headers, body });
  const reply = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });

  if (url === `${SUPABASE}/auth/v1/token?grant_type=password`) {
    minted += 1;
    return reply({ access_token: TOKEN, expires_in: 3600, token_type: "bearer" });
  }
  if (url === `${SUPABASE}/rest/v1/rpc/upsert_cell_at_status`) {
    const slot = `${String(body?.lane_id)}:${String(body?.step_id)}`;
    if (failing.has(slot)) return reply({ code: "XX000", message: "the database fell over" }, 500);
    const before = occupied.get(slot);
    const id = before?.id ?? `cell-${slot}`;
    occupied.set(slot, { id, content: String(body?.content), status: String(body?.status) });
    append(headers, "upsert_cell_at_status", body?.agent_session_id ? "agent" : "human", body?.agent_session_id ?? null);
    return reply({
      id,
      inserted: !before,
      change_id: `change-${calls.length}`,
      previous: before ? { id: before.id, content: before.content, status: before.status } : null,
    });
  }
  if (url === `${SUPABASE}/rest/v1/rpc/set_path_status`) {
    const previous = pathStatus;
    pathStatus = String(body?.status);
    append(headers, "set_path_status", body?.agent_session_id ? "agent" : "human", body?.agent_session_id ?? null);
    return reply({ id: body?.path_id, change_id: `change-${calls.length}`, previous: { status: previous } });
  }
  if (url === `${SUPABASE}/rest/v1/rpc/delete_cell`) {
    // One of the delete functions: archives into the log itself, as `human`.
    const slot = [...occupied.entries()].find(([, c]) => c.id === body?.cell_id)?.[0];
    if (!slot) return reply({ code: "P0001", message: "Unknown cell" }, 400);
    occupied.delete(slot);
    append(headers, "delete_cell", "human");
    return reply(`change-${calls.length}`);
  }
  if (url === `${SUPABASE}/rest/v1/rpc/add_step`) {
    // An older RPC: writes, and leaves its record to the caller.
    return reply(`step-${calls.length}`);
  }
  if (url === `${SUPABASE}/rest/v1/rpc/record_authoring_change`) {
    const refused = append(headers, String(body?.fn), String(body?.author ?? "human"), body?.agent_session_id ?? null);
    return refused ? reply({ code: "42501", message: refused }, 403) : reply(`change-${calls.length}`);
  }
  if (url.startsWith(SUPABASE)) return reply({ message: `no such route: ${url}` }, 404);
  if (url.startsWith("https://counted.test/")) return reply({});
  if (url.includes("slack.com/api/")) return reply({ ok: true, ts: "1700000000.999999" });
  throw new Error(`no stub route for ${url}`);
}) as typeof fetch;

// Loaded only now, once the stub above is in place: `net.ts` binds `fetch`
// when it is first evaluated, and the Gate's imports reach it.
const gate = () => import("../src/gate/index.js");
const stores = () => import("../src/thread-state/index.js");
async function resolveSignal(...args: Parameters<typeof import("../src/gate/index")["resolveSignal"]>) {
  return (await gate()).resolveSignal(...args);
}
async function createInMemoryThreadState(...args: Parameters<typeof import("../src/thread-state/index")["createInMemoryThreadState"]>) {
  return (await stores()).createInMemoryThreadState(...args);
}

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

function env(over: Partial<Record<string, string>> = {}): Env {
  return {
    SLACK_BOT_TOKEN: "xoxb-test",
    SUPABASE_URL: SUPABASE,
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_WRITE_EMAIL: "uno-bot@uno-blueprint.local",
    SUPABASE_WRITE_PASSWORD: "pw",
    BLUEPRINT_APP_URL: "https://plus-uno.netlify.app/blueprint",
    THREAD_STATE,
    ...over,
  } as unknown as Env;
}

const CHANNEL = "C0TEAM";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";
const OWNER = "U0OWNER001";
const BILL = "U0BILL0001";
const STANDING = ["U0STAND001"];

/** Two rows: a new `planned` cell, and an existing `planned` cell going `live`. */
const REVISION: BlueprintRevision = {
  pathId: "path-1",
  label: "Session › Happy path",
  rows: [
    { laneId: "lane-tutor", stepId: "step-3", content: "Tutor opens the reflection", from: null, to: "planned" },
    { laneId: "lane-system", stepId: "step-4", content: "Reflection saved", from: "planned", to: "live" },
  ],
};

function card(revision: BlueprintRevision = REVISION): PendingProposal {
  return {
    toolName: "blueprint_revise",
    input: revision as unknown as Record<string, unknown>,
    operations: [{ toolName: "blueprint_revise", input: revision as unknown as Record<string, unknown> }],
    channel: CHANNEL,
    threadTs: THREAD,
    replyTs: THREAD,
    userMsgTs: "1700000000.000190",
    proposalTs: CARD_TS,
    proposalText: "(the revision card)",
    requesterUserId: OWNER,
    confirmers: [OWNER, BILL],
    exclusiveConfirmers: true,
  };
}

const signal = (userId: string, glyph = "white_check_mark"): GateSignal => ({
  kind: "reaction",
  messageTs: CARD_TS,
  channel: CHANNEL,
  thread: THREAD,
  glyph,
  userId,
});

async function decide(
  userId: string,
  opts: { glyph?: string; revision?: BlueprintRevision; at?: () => number } = {},
): Promise<GateVerdict> {
  const threadState = await createInMemoryThreadState(opts.at ? { now: opts.at } : {});
  await threadState.putProposal(card(opts.revision));
  return resolveSignal(signal(userId, opts.glyph), { threadState, standingConfirmers: STANDING });
}

async function execute(verdict: GateVerdict, over: Partial<Record<string, string>> = {}) {
  const { executeVerdict } = await import("../src/agent/resolve-proposal.js");
  return executeVerdict(env(over), verdict);
}

const supabaseCalls = () => calls.filter((c) => c.url.startsWith(SUPABASE));
const rpcCalls = () =>
  supabaseCalls()
    .filter((c) => c.url.includes("/rest/v1/rpc/"))
    .map((c) => ({ fn: c.url.split("/rpc/")[1], args: c.body }));
const posted = () =>
  calls
    .filter((c) => c.url.includes("chat.postMessage"))
    .map((c) => String(c.body?.text ?? ""))
    .join("\n");

beforeEach(async () => {
  calls = [];
  appended = [];
  failing = new Set();
  occupied = new Map([["lane-system:step-4", { id: "cell-existing", content: "Reflection saved", status: "planned" }]]);
  pathStatus = "planned";
  minted = 0;
  log = [];
  const { forgetBlueprintSession } = await import("../src/blueprint-write/index.js");
  forgetBlueprintSession();
});

describe("✅ by a confirmer the card names", () => {
  it("writes every row through upsert_cell_at_status, as uno-bot, under one agent session", async () => {
    const verdict = await decide(OWNER);
    assert.equal(verdict.outcome, "won");
    await execute(verdict);

    const rpcs = rpcCalls();
    assert.deepEqual(
      rpcs.map((r) => [r.fn, r.args?.lane_id, r.args?.status]),
      [
        ["upsert_cell_at_status", "lane-tutor", "planned"],
        ["upsert_cell_at_status", "lane-system", "live"],
      ],
    );
    const sessions = new Set(rpcs.map((r) => r.args?.agent_session_id));
    assert.equal(sessions.size, 1, "one approval is one agent session");
    assert.match(String([...sessions][0]), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.deepEqual(rpcs[0]!.args, {
      path_id: "path-1",
      lane_id: "lane-tutor",
      step_id: "step-3",
      content: "Tutor opens the reflection",
      status: "planned",
      agent_session_id: rpcs[0]!.args?.agent_session_id,
    });
  });

  it("signs in as its own Auth user with the anon key and sends that user's token — never another key", async () => {
    await execute(await decide(BILL));
    const [signIn, ...writes] = supabaseCalls();
    assert.equal(signIn!.url, `${SUPABASE}/auth/v1/token?grant_type=password`);
    assert.deepEqual(signIn!.body, { email: "uno-bot@uno-blueprint.local", password: "pw" });
    assert.equal(signIn!.headers.apikey, "anon-key");
    for (const w of writes) {
      assert.equal(w.method, "POST");
      assert.equal(w.headers.apikey, "anon-key");
      assert.equal(w.headers.authorization, `Bearer ${TOKEN}`);
    }
    assert.ok(supabaseCalls().every((c) => c.url.includes("/rpc/") || c.url.includes("/auth/v1/token")), "RPCs only, no table");
  });

  it("signs in once and reuses the token for the next approval", async () => {
    await execute(await decide(OWNER));
    await execute(await decide(OWNER));
    assert.equal(minted, 1);
  });

  it("writes a path's status change after its rows", async () => {
    await execute(await decide(OWNER, { revision: { ...REVISION, path: { from: "planned", to: "live" } } }));
    assert.deepEqual(rpcCalls().map((r) => r.fn), ["upsert_cell_at_status", "upsert_cell_at_status", "set_path_status"]);
    assert.equal(pathStatus, "live");
  });

  it("tells the thread what it wrote, with a link to the blueprint", async () => {
    await execute(await decide(OWNER));
    assert.match(posted(), /Session › Happy path/);
    assert.match(appended.join("\n"), /wrote 2 rows/i);
    assert.match(appended.join("\n"), /plus-uno\.netlify\.app\/blueprint\/\?cell=/);
  });
});

describe("nothing is written", () => {
  it("when a standing confirmer the card does not name presses ✅", async () => {
    const verdict = await decide(STANDING[0]!);
    assert.equal(verdict.outcome, "none");
    await execute(verdict);
    assert.deepEqual(supabaseCalls(), []);
  });

  it("on ⛔", async () => {
    const verdict = await decide(OWNER, { glyph: "no_entry" });
    assert.equal(verdict.outcome, "won");
    assert.equal(verdict.decision, "cancel");
    await execute(verdict);
    assert.deepEqual(supabaseCalls(), []);
  });

  it("once the card has expired", async () => {
    let now = 1_700_000_000_000;
    const threadState = await createInMemoryThreadState({ now: () => now });
    await threadState.putProposal({ ...card(), ttlMs: 72 * 3_600_000 });
    now += 73 * 3_600_000;
    const verdict = await resolveSignal(signal(OWNER), { threadState, standingConfirmers: STANDING });
    assert.notEqual(verdict.outcome, "won");
    await execute(verdict);
    assert.deepEqual(supabaseCalls(), []);
  });

  it("by the press that lost the race", async () => {
    const threadState = await createInMemoryThreadState();
    await threadState.putProposal(card());
    const [first, second] = await Promise.all([
      resolveSignal(signal(OWNER), { threadState, standingConfirmers: STANDING }),
      resolveSignal(signal(BILL), { threadState, standingConfirmers: STANDING }),
    ]);
    const lost = first!.outcome === "won" ? second! : first!;
    assert.equal(lost.outcome, "stale");
    await execute(lost);
    assert.deepEqual(supabaseCalls(), []);
  });

  it("when the write identity is not set up, and the thread is told so", async () => {
    await execute(await decide(OWNER), { SUPABASE_WRITE_PASSWORD: "" });
    assert.deepEqual(supabaseCalls(), []);
    assert.match(appended.join("\n"), /SUPABASE_WRITE_PASSWORD/);
  });

  it("when the press cannot afford the write and its worst-case revert", async () => {
    const { runMetered, countedFetch } = await import("../src/net.js");
    await runMetered(async () => {
      for (let i = 0; i < 44; i++) await countedFetch(`https://counted.test/${i}`);
      await execute(await decide(OWNER));
    });
    assert.deepEqual(supabaseCalls(), []);
    assert.match(appended.join("\n"), /blueprint calls/);
  });
});

describe("a failure part-way", () => {
  it("takes back what was written, deleting the cell it made, and says so", async () => {
    // Row one is new and lands; row two fails. Row one is taken back through
    // the delete RPC, which records itself — no record call follows it.
    failing.add("lane-system:step-4");
    await execute(await decide(OWNER));
    assert.deepEqual(
      rpcCalls().map((r) => [r.fn, r.args?.lane_id ?? r.args?.cell_id, r.args?.status]),
      [
        ["upsert_cell_at_status", "lane-tutor", "planned"],
        ["upsert_cell_at_status", "lane-system", "live"],
        ["delete_cell", "cell-lane-tutor:step-3", undefined],
      ],
    );
    assert.equal(occupied.has("lane-tutor:step-3"), false, "the new cell is gone");
    const told = appended.join("\n");
    assert.match(told, /did NOT complete/);
    assert.match(told, /took back 1/i);
    assert.doesNotMatch(told, /deprecated/);
  });

  it("puts a changed cell back as it stood", async () => {
    // Row order reversed: the existing cell goes first and lands, the new one fails.
    failing.add("lane-tutor:step-3");
    await execute(await decide(OWNER, { revision: { ...REVISION, rows: [REVISION.rows[1]!, REVISION.rows[0]!] } }));
    const last = rpcCalls().at(-1)!;
    assert.deepEqual([last.fn, last.args?.lane_id, last.args?.content, last.args?.status], [
      "upsert_cell_at_status",
      "lane-system",
      "Reflection saved",
      "planned",
    ]);
    assert.equal(occupied.get("lane-system:step-4")?.status, "planned");
  });

  it("treats a cell that moved since the draft as a failure, and takes it back too", async () => {
    // The draft read the cell as `planned`; someone has since made it `built`.
    occupied.set("lane-system:step-4", { id: "cell-existing", content: "Reflection saved", status: "built" });
    await execute(await decide(OWNER));
    assert.equal(occupied.get("lane-system:step-4")?.status, "built");
    assert.equal(occupied.has("lane-tutor:step-3"), false, "the cell it made is deleted");
    assert.match(appended.join("\n"), /changed since the draft/);
  });
});

describe("attribution", () => {
  it("lands every row it causes in authoring_changes as uno-bot, under the bot's own user id", async () => {
    // A write, a failure and a delete: the three ways a revision touches the log.
    failing.add("lane-system:step-4");
    await execute(await decide(OWNER));
    assert.deepEqual(log.map((r) => r.fn), ["upsert_cell_at_status", "delete_cell"]);
    for (const row of log) {
      assert.equal(row.author, "uno-bot", `${row.fn} is attributed to uno-bot`);
      assert.equal(row.author_id, BOT_UID);
    }
  });

  it("follows an older RPC with record_authoring_change, as uno-bot under the approval's session", async () => {
    const { authoringCall, authoringCallCost, blueprintRpcFor } = await import("../src/blueprint-write/index.js");
    const deps = { rpc: blueprintRpcFor(env()), sessionId: "11111111-2222-4333-8444-555555555555" };
    await authoringCall(deps, "add_step", { scenario_id: "scn-1", label: "Reflect" }, { fn: "delete_step", args: {} });
    assert.deepEqual(rpcCalls().map((r) => r.fn), ["add_step", "record_authoring_change"]);
    assert.deepEqual(rpcCalls()[1]!.args, {
      fn: "add_step",
      args: { scenario_id: "scn-1", label: "Reflect" },
      revert: { fn: "delete_step", args: {} },
      author: "uno-bot",
      agent_session_id: "11111111-2222-4333-8444-555555555555",
    });
    assert.deepEqual(log, [
      { fn: "add_step", author: "uno-bot", author_id: BOT_UID, agent_session_id: "11111111-2222-4333-8444-555555555555" },
    ]);
    assert.equal(authoringCallCost("add_step"), 2, "the record is a second subrequest");
  });

  it("does not follow an RPC that records itself", async () => {
    const { authoringCallCost } = await import("../src/blueprint-write/index.js");
    for (const fn of ["upsert_cell_at_status", "set_path_status", "delete_cell"]) assert.equal(authoringCallCost(fn), 1, fn);
  });
});
