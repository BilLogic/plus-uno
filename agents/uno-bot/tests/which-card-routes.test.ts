// The "which one?" pop-up's routes on the interactive endpoint (#1342).
//
// `tests/which-card-popup.test.ts` drives the doors on named dependencies;
// this file sends Slack's own payloads through `handleInteraction`, so what is
// asserted is the wiring: Choose… opens the pop-up, a Submit with nothing
// picked is answered with `response_action: "errors"` in the ack, a pick is
// acked with `update` and answered in the pop-up once decided, and a numbered
// button left on an old question is answered aside.
//
// HOW THE WORLD IS FAKED. One stub on `globalThis.fetch` before anything
// imports `net.ts`, recording every Slack call; the modules under test loaded
// lazily; and the Durable Object binding a proxy onto the in-memory
// ThreadState, which ignores the clock argument the adapter appends.
import { test } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { PendingProposal, ThreadState } from "../src/thread-state/index";

interface Call {
  url: string;
  body: Record<string, unknown> | null;
}
let calls: Call[] = [];

globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input);
  const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
  calls.push({ url, body });
  return new Response(JSON.stringify({ ok: true, ts: "1.000001", view: { id: "V1" } }), { headers: { "content-type": "application/json" } });
}) as typeof fetch;

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const RESPONSE_URL = "https://hooks.slack.test/actions/1";
const now = Date.now();
const QUESTION_TS = `${Math.floor(now / 1000)}.000500`;
const CARD_A = `${Math.floor(now / 1000) - 60}.000100`;
const CARD_B = `${Math.floor(now / 1000) - 30}.000200`;

/** A card in its own reply thread, so staging the second does not retire the
 *  first, as two unthreaded asks in one DM stand. */
function card(ts: string, title: string, thread: string): PendingProposal {
  return {
    toolName: "notion_create",
    input: { surface: "prd", title, summary: "A summary." },
    channel: CHANNEL,
    threadTs: thread,
    replyTs: thread,
    userMsgTs: "1700000000.000190",
    proposalTs: ts,
    proposalText: `About to create ${title}`,
    requesterUserId: "U1",
  };
}

async function world() {
  calls = [];
  const { createInMemoryThreadState } = await import("../src/thread-state/index.js");
  const store: ThreadState = createInMemoryThreadState();
  await store.putProposal(card(CARD_A, "Backup tutor matching", THREAD));
  await store.putProposal(card(CARD_B, "Session reflections", "1700000000.000150"));
  const stub = new Proxy({}, { get: (_t, name) => (...args: unknown[]) => (store as unknown as Record<string, (...a: unknown[]) => unknown>)[String(name)]!(...args) });
  const env = { SLACK_BOT_TOKEN: "xoxb-test", THREAD_STATE: { idFromName: () => "thread-state", get: () => stub } } as unknown as Env;
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void pending.push(p), passThroughOnException: () => {} } as unknown as ExecutionContext;
  const { handleInteraction } = await import("../src/slack/interactive.js");
  const send = async (payload: Record<string, unknown>) => {
    const res = await handleInteraction(env, payload as unknown as Parameters<typeof handleInteraction>[1], ctx);
    while (pending.length) await pending.shift();
    return res;
  };
  return { send, store };
}

const slackCalls = (method: string) => calls.filter((c) => c.url === `https://slack.com/api/${method}`);

/** The pop-up as `views.update` last drew it. */
function lastView(): { private_metadata: string; blocks: Array<Record<string, unknown>> } {
  return slackCalls("views.update").at(-1)!.body!.view as { private_metadata: string; blocks: Array<Record<string, unknown>> };
}

async function opened(send: (p: Record<string, unknown>) => Promise<Response>) {
  await send({
    type: "block_actions",
    trigger_id: "T1",
    user: { id: "U1" },
    channel: { id: CHANNEL },
    response_url: RESPONSE_URL,
    message: { ts: QUESTION_TS, text: "2 cards are waiting, nothing ran yet.", blocks: [] },
    actions: [{ action_id: "uno_which_choose", value: `cancel:${CARD_B},${CARD_A}` }],
  });
  return lastView();
}

test("Choose… opens the pop-up on its trigger, then fills it with the cards", async () => {
  const { send } = await world();
  const view = await opened(send);
  assert.equal(slackCalls("views.open")[0]?.body?.trigger_id, "T1");
  assert.match(JSON.stringify(view.blocks), /Session reflections.*Backup tutor matching/);
});

test("a Submit with nothing picked is answered in the ack with the error under the list", async () => {
  const { send } = await world();
  const view = await opened(send);
  const res = await send({ type: "view_submission", user: { id: "U1" }, view: { id: "V1", callback_id: "uno_which_pick", private_metadata: view.private_metadata, state: { values: {} } } });
  assert.deepEqual(await res.json(), { response_action: "errors", errors: { uno_which_cards_cancel: "Tick at least one card to cancel." } });
});

test("a Submit with a pick is acked with update, and the pop-up answered once the card is decided", async () => {
  const { send, store } = await world();
  const view = await opened(send);
  const state = { values: { uno_which_cards_cancel: { uno_which_cards_input: { selected_options: [{ value: CARD_A }] } } } };
  const res = await send({ type: "view_submission", user: { id: "U1" }, view: { id: "V1", callback_id: "uno_which_pick", private_metadata: view.private_metadata, state } });
  const ack = (await res.json()) as { response_action: string; view: { blocks: unknown[] } };
  assert.equal(ack.response_action, "update");
  assert.match(JSON.stringify(ack.view.blocks), /Canceling…/);
  assert.match(JSON.stringify(lastView().blocks), /Backup tutor matching\*: Canceled\./);
  assert.notEqual((await store.getProposalByTs(CARD_A)).state, "found");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found", "the card not picked stays live");
});

test("a numbered button on a question posted before the pop-up is answered aside", async () => {
  const { send } = await world();
  const { LEGACY_WHICH_REPLY } = await import("../src/slack/which-card.js");
  await send({
    type: "block_actions",
    user: { id: "U1" },
    channel: { id: CHANNEL },
    response_url: RESPONSE_URL,
    message: { ts: QUESTION_TS },
    actions: [{ action_id: "uno_which_confirm_0", value: CARD_A }],
  });
  const reply = calls.find((c) => c.url === RESPONSE_URL);
  assert.equal(reply?.body?.response_type, "ephemeral");
  assert.equal(reply?.body?.text, LEGACY_WHICH_REPLY);
});
