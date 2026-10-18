// The "which one?" pop-ups' routes on the interactive endpoint (#1342).
//
// `tests/which-card-popup.test.ts` drives the doors on named dependencies;
// this file sends Slack's own payloads through `handleInteraction`, so what is
// asserted is the wiring: Approve… and Cancel… each open their own pop-up, and
// an old Choose… the Cancel one; a Submit with nothing picked, or with a
// control that is not its pop-up's own, is answered with
// `response_action: "errors"` in the ack; a pick is acked with `update` and
// answered in the pop-up once decided; and a numbered button left on an old
// question is answered aside.
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

/** A button on the question, pressed: Cancel… unless named. */
async function opened(send: (p: Record<string, unknown>) => Promise<Response>, actionId = "uno_which_cancel", value = `cards:${CARD_B},${CARD_A}`) {
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

const submitWith = (send: (p: Record<string, unknown>) => Promise<Response>, callbackId: string, metadata: string, state: unknown) =>
  send({ type: "view_submission", user: { id: "U1" }, view: { id: "V1", callback_id: callbackId, private_metadata: metadata, state } });

test("Cancel… opens the Cancel pop-up on its trigger, then fills it with the cards", async () => {
  const { send } = await world();
  const view = await opened(send);
  assert.equal(slackCalls("views.open")[0]?.body?.trigger_id, "T1");
  assert.equal(view.callback_id, "uno_which_cancel_pick");
  assert.match(JSON.stringify(view.blocks), /Session reflections.*Backup tutor matching/);
  assert.match(JSON.stringify(view.blocks), /"checkboxes"/);
});

test("Approve… opens the Approve pop-up, a radio list", async () => {
  const { send } = await world();
  const view = await opened(send, "uno_which_approve");
  assert.equal(view.callback_id, "uno_which_approve_pick");
  assert.match(JSON.stringify(view.blocks), /"radio_buttons"/);
  assert.doesNotMatch(JSON.stringify(view.blocks), /"checkboxes"/);
});

test("an old Choose… opens the Cancel pop-up, whatever its value's prefix", async () => {
  const { send } = await world();
  const view = await opened(send, "uno_which_choose", `confirm:${CARD_B},${CARD_A}`);
  assert.equal(view.callback_id, "uno_which_cancel_pick");
  assert.match(JSON.stringify(view.blocks), /"checkboxes"/);
});

test("a Submit with nothing picked is answered in the ack with the error under the list", async () => {
  const { send } = await world();
  const view = await opened(send);
  const res = await submitWith(send, view.callback_id, view.private_metadata, { values: {} });
  assert.deepEqual(await res.json(), { response_action: "errors", errors: { uno_which_cards_cancel: "Tick at least one card to cancel." } });
  const approve = await opened(send, "uno_which_approve");
  const none = await submitWith(send, approve.callback_id, approve.private_metadata, { values: {} });
  assert.deepEqual(await none.json(), { response_action: "errors", errors: { uno_which_approve_card: "Pick the card to approve." } });
});

test("a Cancel Submit with a tick is acked with update, and the pop-up answered once the card is decided", async () => {
  const { send, store } = await world();
  const view = await opened(send);
  const state = { values: { uno_which_cards_cancel: { uno_which_cards_input: { selected_options: [{ value: CARD_A }] } } } };
  const res = await submitWith(send, view.callback_id, view.private_metadata, state);
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

// THE KIND IS THE VIEW'S, NEVER ITS METADATA'S. A Choose… on a phone once
// submitted the Approve list while the person meant Cancel: the decision rode
// the view's metadata, and the switch's press never arrived to change it. Now
// the button pressed fixes the pop-up's kind in its callback id, and a Submit
// decides nothing unless its state holds that kind's own control.

/** A view's metadata as a pop-up that once offered Approve carried it. */
const OLD_APPROVE_METADATA = JSON.stringify({ c: CHANNEL, q: QUESTION_TS, d: "confirm", k: [[CARD_B, "Session reflections"], [CARD_A, "Backup tutor matching"]] });
const METADATA = JSON.stringify({ c: CHANNEL, q: QUESTION_TS, k: [[CARD_B, "Session reflections"], [CARD_A, "Backup tutor matching"]] });
const notionCalls = () => calls.filter((c) => c.url.includes("api.notion.com"));
const TICK_A = { values: { uno_which_cards_cancel: { uno_which_cards_input: { type: "checkboxes", selected_options: [{ value: CARD_A }] } } } };
const PICK_A = { values: { uno_which_approve_card: { uno_which_approve_input: { type: "radio_buttons", selected_option: { value: CARD_A } } } } };

test("an Approve Submit with a pick is acked with update, and decides only that card", async () => {
  const { send, store } = await world();
  const view = await opened(send, "uno_which_approve");
  const res = await submitWith(send, view.callback_id, view.private_metadata, PICK_A);
  const ack = (await res.json()) as { response_action: string; view: { blocks: unknown[] } };
  assert.equal(ack.response_action, "update");
  assert.match(JSON.stringify(ack.view.blocks), /Approving…/);
  assert.match(JSON.stringify(lastView().blocks), /Backup tutor matching\*: /);
  assert.notEqual((await store.getProposalByTs(CARD_A)).state, "found", "the card picked is decided");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found", "the card not picked stays live");
});

test("a Submit under a view opened before the two pop-ups is refused and decides nothing, whatever its state or metadata", async () => {
  const { send, store } = await world();
  const states = [
    TICK_A,
    PICK_A,
    { values: { uno_which_cards_confirm: { uno_which_cards_input: { type: "radio_buttons", selected_option: { value: CARD_A } } } } },
    {
      values: {
        uno_which_decision_cancel: { uno_which_decision: { type: "radio_buttons", selected_option: { value: "cancel" } } },
        ...TICK_A.values,
      },
    },
  ];
  for (const state of states) {
    for (const metadata of [OLD_APPROVE_METADATA, METADATA]) {
      const res = await submitWith(send, "uno_which_pick", metadata, state);
      const ack = (await res.json()) as { response_action: string; errors?: Record<string, string> };
      assert.equal(ack.response_action, "errors", JSON.stringify(state));
      assert.deepEqual(Object.values(ack.errors ?? {}).map((e) => /Open the question again/.test(e)), [true]);
    }
  }
  assert.deepEqual(notionCalls(), []);
  assert.equal((await store.getProposalByTs(CARD_A)).state, "found", "the card still waits");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found");
});

test("a Submit whose control is not its pop-up's own is refused and decides nothing", async () => {
  const { send, store } = await world();
  const cases: Array<[string, unknown]> = [
    ["uno_which_approve_pick", TICK_A],
    ["uno_which_approve_pick", { values: { ...PICK_A.values, ...TICK_A.values } }],
    ["uno_which_cancel_pick", PICK_A],
    ["uno_which_cancel_pick", { values: { ...TICK_A.values, ...PICK_A.values } }],
  ];
  for (const [callbackId, state] of cases) {
    for (const metadata of [OLD_APPROVE_METADATA, METADATA]) {
      const res = await submitWith(send, callbackId, metadata, state);
      assert.equal(((await res.json()) as { response_action: string }).response_action, "errors", `${callbackId} ${JSON.stringify(state)}`);
    }
  }
  assert.deepEqual(notionCalls(), []);
  assert.equal((await store.getProposalByTs(CARD_A)).state, "found");
  assert.equal((await store.getProposalByTs(CARD_B)).state, "found");
});

test("a Submit with no state for its list is refused, whatever the metadata says", async () => {
  const { send, store } = await world();
  const states = [undefined, {}, { values: {} }, { values: { uno_which_cards_cancel: {} } }, { values: { uno_which_cards_cancel: { uno_which_cards_input: { value: CARD_A } } } }];
  for (const state of states) {
    for (const callbackId of ["uno_which_cancel_pick", "uno_which_approve_pick"]) {
      const res = await submitWith(send, callbackId, OLD_APPROVE_METADATA, state);
      assert.equal(((await res.json()) as { response_action: string }).response_action, "errors", JSON.stringify(state));
    }
  }
  assert.deepEqual(notionCalls(), []);
  assert.equal((await store.getProposalByTs(CARD_A)).state, "found");
});
