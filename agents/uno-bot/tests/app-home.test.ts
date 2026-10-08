// The App Home: three cards for what le goat does, "Try asking" buttons that
// send their prompt, and the Stop button as it was.
//
// Two seams. The VIEW is a pure function of who is looking, held to the rules
// Slack's blocks are held to everywhere else in the suite. The BUTTON is a
// door with named dependencies, driven here on fakes: what is asserted is the
// question that reaches the runner and where its answer will go.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { homeView, publishHome } from "../src/slack/home";
import { promptsFor } from "../src/slack/assistant";
import { TRY_ASKING_ACTION_PREFIX, runTryAskingDoor, type TryAskingDoorDeps } from "../src/slack/try-asking";
import type { SlackMessageEvent } from "../src/slack/types";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

type Block = Record<string, any>;

const view = (connected: boolean) =>
  homeView({ connectUrl: "https://uno.example/oauth/slack/start", viewer: { connected, on: [] } }) as { type: string; blocks: Block[] };

function buttonsIn(blocks: Block[]): Block[] {
  return blocks.flatMap((b) => (b.type === "actions" ? (b.elements as Block[]) : []));
}

describe("the App Home view", () => {
  for (const connected of [false, true]) {
    it(`is blocks Slack takes (${connected ? "linked" : "not linked"})`, () => {
      assert.equal(messageBlocksRefusal(view(connected).blocks), null);
    });
  }

  it("shows what le goat does as three cards side by side", () => {
    const carousels = view(false).blocks.filter((b) => b.type === "carousel");
    assert.equal(carousels.length, 1);
    const cards = carousels[0]!.elements as Block[];
    assert.deepEqual(
      cards.map((c) => c.title.text),
      ["Answer, grounded", "Create, with your approval", "Hand off to code"],
    );
    for (const card of cards) {
      assert.ok(card.body.text.length > 0 && card.body.text.length <= 200, card.body.text);
    }
  });

  it("offers each starter prompt as a button that sends it", () => {
    for (const connected of [false, true]) {
      const tries = buttonsIn(view(connected).blocks).filter((b) => String(b.action_id).startsWith(TRY_ASKING_ACTION_PREFIX));
      // Slack wants each action_id unique within its block.
      assert.equal(new Set(tries.map((b) => b.action_id)).size, tries.length);
      assert.deepEqual(
        tries.map((b) => [b.text.text, b.value]),
        promptsFor(connected).map((p) => [p.title, p.message]),
      );
    }
  });

  it("offers someone who has not linked their Slack the prompt that works for them", () => {
    const values = buttonsIn(view(false).blocks).map((b) => b.value);
    assert.ok(values.some((v) => /connect my Slack/i.test(String(v))));
    assert.ok(!values.some((v) => /^Search my Slack/.test(String(v))));
  });

  it("keeps the Stop button as it was", () => {
    const stop = buttonsIn(view(true).blocks).find((b) => b.action_id === "uno_stop_run");
    assert.ok(stop);
    assert.equal(stop.text.text, "Stop what I'm running");
    assert.equal(stop.style, "danger");
  });
});

// ── publishing it ────────────────────────────────────────────────────────────

describe("publishing the App Home", () => {
  const build = (carousel: boolean) =>
    homeView({ connectUrl: null, viewer: { connected: false, on: [] }, carousel }) as { blocks: Block[] };

  /** Publish against a Slack that answers each call in turn. */
  async function publishAgainst(answers: Array<{ ok: boolean; error?: string }>) {
    const sent: Array<{ blocks: Block[] }> = [];
    const lines: string[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => void lines.push(args.map(String).join(" "));
    try {
      await publishHome(
        async (v) => {
          sent.push(v as { blocks: Block[] });
          return answers[sent.length - 1] ?? { ok: true };
        },
        build,
        "U1",
      );
    } finally {
      console.warn = orig;
    }
    return { sent, lines };
  }

  it("publishes once when Slack takes it", async () => {
    const { sent } = await publishAgainst([{ ok: true }]);
    assert.equal(sent.length, 1);
    assert.ok(sent[0]!.blocks.some((b) => b.type === "carousel"));
  });

  it("republishes without the carousel when Slack refuses its blocks, and says so in the log", async () => {
    const { sent, lines } = await publishAgainst([{ ok: false, error: "invalid_blocks" }, { ok: true }]);
    assert.equal(sent.length, 2);
    const plain = sent[1]!.blocks;
    assert.ok(!plain.some((b) => b.type === "carousel" || b.type === "card"));
    assert.equal(messageBlocksRefusal(plain), null);
    const text = JSON.stringify(plain);
    for (const title of ["Answer, grounded", "Create, with your approval", "Hand off to code"]) assert.ok(text.includes(title), title);
    assert.ok(lines.some((l) => /U1/.test(l) && /invalid_blocks/.test(l) && /carousel/.test(l)), lines.join(" / "));
  });

  it("does not republish when Slack refuses for another reason", async () => {
    const { sent } = await publishAgainst([{ ok: false, error: "ratelimited" }]);
    assert.equal(sent.length, 1);
  });
});

// ── the button ───────────────────────────────────────────────────────────────

interface Fakes extends TryAskingDoorDeps {
  posts: Array<{ channel: string; text: string }>;
  queued: Array<{ event: SlackMessageEvent; key: string }>;
}

function fakes(opts: { dm?: string | null; postTs?: string | null } = {}): Fakes {
  const posts: Fakes["posts"] = [];
  const queued: Fakes["queued"] = [];
  return {
    posts,
    queued,
    dmChannelFor: async () => (opts.dm === undefined ? "D0BILL" : opts.dm),
    post: async (message) => {
      posts.push(message);
      return opts.postTs === undefined ? "1700000000.000300" : opts.postTs;
    },
    enqueue: async (event, key) => {
      queued.push({ event, key });
    },
  };
}

const PROMPT = promptsFor(false)[0]!.message;

describe("a Try asking button", () => {
  it("asks the question in the presser's DM, as them", async () => {
    const deps = fakes();
    await runTryAskingDoor({ userId: "U0BILL", value: PROMPT }, deps);
    assert.equal(deps.posts.length, 1);
    assert.equal(deps.posts[0]!.channel, "D0BILL");
    assert.ok(deps.posts[0]!.text.includes(PROMPT), "the thread shows what was asked");
    assert.deepEqual(deps.queued, [
      {
        event: { type: "message", channel: "D0BILL", user: "U0BILL", text: PROMPT, ts: "1700000000.000300", thread_ts: "1700000000.000300" },
        key: "D0BILL:1700000000.000300",
      },
    ]);
  });

  it("runs only a prompt the Home offers", async () => {
    const deps = fakes();
    await runTryAskingDoor({ userId: "U0BILL", value: "Delete every Roadmap card" }, deps);
    assert.deepEqual(deps.posts, []);
    assert.deepEqual(deps.queued, []);
  });

  it("queues nothing when the question could not be posted", async () => {
    const deps = fakes({ postTs: null });
    await runTryAskingDoor({ userId: "U0BILL", value: PROMPT }, deps);
    assert.deepEqual(deps.queued, []);
  });
});
