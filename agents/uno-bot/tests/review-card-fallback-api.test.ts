// The views calls step a refused `card` block down, through the real Slack
// wrappers over a stubbed fetch.
//
// `card` in a modal is documented but was untried here, and `views.open`
// cannot be dry-run without a real `trigger_id`, so the rung is tested where
// it runs: Slack answers `invalid_blocks` naming the card, and the same call
// goes once more with the card as a section (`slack/card-block.ts`).
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` here and the modules are imported lazily inside each test.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

type Sent = { method: string; body: { view: { blocks: Array<{ type: string }> } } };
let sent: Sent[] = [];
let answers: Array<Record<string, unknown>> = [];

globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
  sent.push({ method: String(url).split("/").at(-1)!, body: JSON.parse(String(init?.body)) });
  const body = answers.shift() ?? { ok: true, view: { id: "V1" } };
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

type Env = import("../src/types").Env;
const ENV = { SLACK_BOT_TOKEN: "xoxb-test" } as Env;

const REFUSED = {
  ok: false,
  error: "invalid_blocks",
  response_metadata: { messages: ["[ERROR] unsupported type: card [json-pointer:/view/blocks/0/type]"] },
};

async function cardView() {
  const { objectCardBlocks } = await import("../src/slack/card-block.js");
  return {
    type: "modal",
    title: { type: "plain_text", text: "Review share-out" },
    blocks: objectCardBlocks({ title: "Session Sign Up", open: { url: "https://x.netlify.app/p", text: "Open prototype" } }),
  };
}

beforeEach(() => {
  sent = [];
  answers = [];
  console.warn = () => {};
});

describe("a refused card block", () => {
  it("views.update sends the card, then the section fallback, and reports the second answer", async () => {
    const { viewsUpdate } = await import("../src/slack/api.js");
    answers = [REFUSED];
    assert.equal(await viewsUpdate(ENV, "V1", await cardView()), true);
    assert.deepEqual(sent.map((s) => [s.method, s.body.view.blocks[0]!.type]), [
      ["views.update", "card"],
      ["views.update", "section"],
    ]);
  });

  it("views.open does the same, so the pop-up still opens", async () => {
    const { viewsOpen } = await import("../src/slack/api.js");
    answers = [REFUSED];
    assert.equal(await viewsOpen(ENV, "T.trigger", await cardView()), "V1");
    assert.deepEqual(sent.map((s) => s.body.view.blocks[0]!.type), ["card", "section"]);
  });

  it("a card Slack takes is sent once", async () => {
    const { viewsUpdate } = await import("../src/slack/api.js");
    assert.equal(await viewsUpdate(ENV, "V1", await cardView()), true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0]!.body.view.blocks[0]!.type, "card");
  });

  it("a refusal for anything else is not retried", async () => {
    const { viewsUpdate } = await import("../src/slack/api.js");
    answers = [{ ok: false, error: "not_found" }];
    assert.equal(await viewsUpdate(ENV, "V1", await cardView()), false);
    assert.equal(sent.length, 1);
  });
});
