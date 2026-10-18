// The "which one?" pop-up's routes on the interactive endpoint.
//
// `tests/which-card-popup.test.ts` drives the doors on named dependencies;
// this file sends Slack's own payloads through `handleInteraction`, so what is
// asserted is the wiring: Review opens the Review cards pop-up, and so does
// every button an earlier question carries (Choose…, Approve…, Cancel…); Show
// draft redraws it under the view's hash; Done is acked with `update` and
// decides each card by its own row; a Done under an older pop-up's callback
// id is refused in the ack; and a numbered button left on an old question is
// answered aside.
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

type SentView = { callback_id: string; private_metadata: string; blocks: Array<Record<string, unknown>> };

/** The pop-up as `views.update` last drew it. */
function lastView(): SentView {
  return slackCalls("views.update").at(-1)!.body!.view as SentView;
}

/** A button on the question, pressed: Review unless named. */
async function opened(send: (p: Record<string, unknown>) => Promise<Response>, actionId = "uno_which_review", value = `cards:${CARD_B},${CARD_A}`) {
  await send({
    type: "block_actions",
    trigger_id: "T1",
    user: { id: "U1" },
    channel: { id: CHANNEL },
    response_url: RESPONSE_URL,
    message: { ts: QUESTION_TS, text: "2 cards are waiting, nothing ran yet.", blocks: [] },
    actions: [{ action_id: actionId, value }],
  });
  return lastView();
}

const submitWith = (send: (p: Record<string, unknown>) => Promise<Response>, callbackId: string, metadata: string, state: unknown, blocks?: unknown[]) =>
  send({ type: "view_submission", user: { id: "U1" }, view: { id: "V1", callback_id: callbackId, private_metadata: metadata, state, ...(blocks ? { blocks } : {}) } });

/** One row's radio pick, as Slack sends it under that card's own block. */
const choice = (ts: string, value: string) => ({ [`uno_which_choice_${ts}`]: { uno_which_choice: { type: "radio_buttons", selected_option: { value } } } });
const notionCalls = () => calls.filter((c) => c.url.includes("api.notion.com"));

test("Review opens the Review cards pop-up on its trigger, then fills it with a row per card", async () => {
  const { send } = await world();
  const view = await opened(send);
  assert.equal(slackCalls("views.open")[0]?.body?.trigger_id, "T1");
  assert.equal(view.callback_id, "uno_which_review_cards");
  assert.match(JSON.stringify(view.blocks), /Session reflections.*Backup tutor matching/);
  assert.ok(view.blocks.some((b) => b.block_id === `uno_which_choice_${CARD_B}`));
  assert.ok(view.blocks.some((b) => b.block_id === `uno_which_choice_${CARD_A}`));
  assert.doesNotMatch(JSON.stringify(view.blocks), /"checkboxes"/);
});

test("every button an earlier question carries opens the same pop-up, whatever its value's prefix", async () => {
  for (const [actionId, value] of [
    ["uno_which_choose", `confirm:${CARD_B},${CARD_A}`],
    ["uno_which_approve", `cards:${CARD_B},${CARD_A}`],
    ["uno_which_cancel", `cards:${CARD_B},${CARD_A}`],
  ] as const) {
    const { send } = await world();
    const view = await opened(send, actionId, value);
    assert.equal(view.callback_id, "uno_which_review_cards", actionId);
  }
});

test("Show draft redraws the pop-up under the view's hash, keeping the choices", async () => {
  const { send } = await world();
  const view = await opened(send);
  await send({
    type: "block_actions",
    user: { id: "U1" },
    view: { id: "V1", hash: "H1", callback_id: view.callback_id, private_metadata: view.private_metadata, state: { values: choice(CARD_A, "cancel") } },
    actions: [{ action_id: "uno_which_show", value: CARD_A }],
  });
  const update = slackCalls("views.update").at(-1)!.body!;
  assert.equal(update.hash, "H1");
  const blocks = (update.view as SentView).blocks;
  const row = blocks.find((b) => b.block_id === `uno_which_choice_${CARD_A}`) as { element: { initial_option: { value: string } } };
  assert.equal(row.element.initial_option.value, "cancel");
  assert.match(JSON.stringify(blocks), /Hide draft/);
});

test("Done with every row on Leave is acked with a notice and decides nothing", async () => {
  const { send, store } = await world();
  const view = await opened(send);
  const before = calls.length;
  const res = await submitWith(send, view.callback_id, view.private_metadata, { values: { ...choice(CARD_A, "leave"), ...choice(CARD_B, "leave") } });
  const ack = (await res.json()) as { response_action: string; view: { blocks: unknown[] } };
  assert.equal(ack.response_action, "update");
  assert.match(JSON.stringify(ack.view.blocks), /Nothing changed/);
  assert.deepEqual(calls.slice(before), [], "no call at all");
  assert.equal((await store.getProposalByTs(CARD_A)).state, "found");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found");
});

test("Done with a Cancel is acked with update, and the pop-up answered once the card is decided", async () => {
  const { send, store } = await world();
  const view = await opened(send);
  const res = await submitWith(send, view.callback_id, view.private_metadata, { values: { ...choice(CARD_A, "cancel"), ...choice(CARD_B, "leave") } });
  const ack = (await res.json()) as { response_action: string; view: { blocks: unknown[] } };
  assert.equal(ack.response_action, "update");
  assert.match(JSON.stringify(ack.view.blocks), /Deciding…/);
  assert.match(JSON.stringify(lastView().blocks), /Backup tutor matching\*: Canceled\./);
  assert.notEqual((await store.getProposalByTs(CARD_A)).state, "found");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found", "the card left stays live");
});

test("Done with an Approve decides only that card", async () => {
  const { send, store } = await world();
  const view = await opened(send);
  const res = await submitWith(send, view.callback_id, view.private_metadata, { values: choice(CARD_A, "approve") });
  assert.equal(((await res.json()) as { response_action: string }).response_action, "update");
  assert.match(JSON.stringify(lastView().blocks), /Backup tutor matching\*: /);
  assert.notEqual((await store.getProposalByTs(CARD_A)).state, "found", "the card chosen is decided");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found", "the card left stays live");
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

// A Choose… on a phone once submitted an Approve while the person meant
// Cancel: the decision rode the view's metadata, and the switch's press never
// arrived to change it. A view opened before this pop-up decides nothing,
// whatever its state or metadata holds, and no Done reads the metadata for a
// decision.

/** A view's metadata as a pop-up that once offered Approve carried it. */
const OLD_APPROVE_METADATA = JSON.stringify({ c: CHANNEL, q: QUESTION_TS, d: "confirm", k: [[CARD_B, "Session reflections"], [CARD_A, "Backup tutor matching"]] });
const METADATA = JSON.stringify({ c: CHANNEL, q: QUESTION_TS, k: [[CARD_B, "Session reflections"], [CARD_A, "Backup tutor matching"]] });
const TICK_A = { values: { uno_which_cards_cancel: { uno_which_cards_input: { type: "checkboxes", selected_options: [{ value: CARD_A }] } } } };
const PICK_A = { values: { uno_which_approve_card: { uno_which_approve_input: { type: "radio_buttons", selected_option: { value: CARD_A } } } } };

test("Done under an older pop-up's callback id is refused and decides nothing, whatever its state or metadata", async () => {
  const { send, store } = await world();
  const states = [TICK_A, PICK_A, { values: choice(CARD_A, "approve") }];
  // As an old view drew itself: its list an input, or only its switch, in
  // an actions block, which Slack will not take an error under.
  const withInput = [
    { type: "actions", block_id: "uno_which_decision_cancel", elements: [{ type: "radio_buttons", action_id: "uno_which_decision" }] },
    { type: "input", block_id: "uno_which_cards_cancel", element: { type: "checkboxes", action_id: "uno_which_cards_input" } },
  ];
  const actionsOnly = [withInput[0]];
  for (const callbackId of ["uno_which_pick", "uno_which_approve_pick", "uno_which_cancel_pick"]) {
    for (const state of states) {
      for (const metadata of [OLD_APPROVE_METADATA, METADATA]) {
        const res = await submitWith(send, callbackId, metadata, state, withInput);
        const ack = (await res.json()) as { response_action: string; errors?: Record<string, string> };
        assert.equal(ack.response_action, "errors", `${callbackId} ${JSON.stringify(state)}`);
        assert.match(ack.errors!.uno_which_cards_cancel!, /Open the question again/);
        const bare = await submitWith(send, callbackId, metadata, state, actionsOnly);
        const notice = (await bare.json()) as { response_action: string; view?: { blocks: unknown[] } };
        assert.equal(notice.response_action, "update", "no input to key an error to: a notice instead");
        assert.match(JSON.stringify(notice.view?.blocks), /Open the question again/);
      }
    }
  }
  assert.deepEqual(notionCalls(), []);
  assert.equal((await store.getProposalByTs(CARD_A)).state, "found", "the card still waits");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found");
});

test("Done never reads a decision from the metadata: an old \"d\" in it, with no row chosen, decides nothing", async () => {
  const { send, store } = await world();
  await opened(send);
  const res = await submitWith(send, "uno_which_review_cards", OLD_APPROVE_METADATA, { values: {} });
  assert.match(JSON.stringify(await res.json()), /Nothing changed/);
  assert.deepEqual(notionCalls(), []);
  assert.equal((await store.getProposalByTs(CARD_A)).state, "found");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found");
});
