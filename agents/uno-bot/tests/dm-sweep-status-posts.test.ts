// uno-bot's status posts in a DM thread are never read back as its answers.
//
// The DM sweep's F6 asks "Did you get it?" about an answer uno-bot gave that
// said it could not find something. It tells an answer from uno-bot's other
// posts by their tag: a tagged bot post is context, never new (`isFresh`). So
// every post that is not an answer — a gate note, a card, the blueprint
// check's offer and the line it is edited to, the check's results, a
// narration line — goes up tagged as a status post.
//
// The thread replayed here is the one that went wrong: a PRD card staged and
// rejected, a blueprint check whose draft did not finish, and its results. The
// check's line "I couldn't draft a proposal from them" went up untagged, the
// sweep read it as an answer that came up empty, and four days later the
// person was asked "On Sat I couldn't find a proposal from them. Did you get
// it?" about a question they never asked.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import { detectDmItems } from "../src/dm-sweep/index";
import { checkedMessage, checkingMessage, checkOfferMessage, resultsMessage, stoppedMessage } from "../src/slack/blueprint-check";
import { deliveryAdapter } from "../src/slack/delivery-adapter";
import { STATUS_EVENT, statusTag, type StatusKind } from "../src/slack/status-tag";
import type { DmMessage } from "../src/sweep/index";
import { recordingSlack } from "./helpers/recording-slack";

const DM = "D0000001";
const ROOT = "1792264350.716089";
const PERSON = "U0000001";
const BOT = "U0000009";
const target = { channel: DM, replyTs: ROOT, userMsgTs: ROOT, userId: PERSON };

/** The recorded reply that flagged the check's line as an empty answer. */
const FLAGGED = JSON.stringify({
  unanswered: [{ answer_ts: "1792264391.282889", what: "a proposal from them", confidence: 0.85 }],
  disagreements: [],
  decisions: [],
});

/** The thread as Slack holds it, each bot post with the tag it went up with. */
function thread(tagOf: (kind: StatusKind) => DmMessage["tag"] | undefined): DmMessage[] {
  const bot = (ts: string, text: string, kind: StatusKind | null): DmMessage => {
    const tag = kind ? tagOf(kind) : undefined;
    return { ts, user: BOT, text, byBot: true, ...(tag ? { tag } : {}) };
  };
  return [
    {
      ts: ROOT,
      user: PERSON,
      text: '[live test 11, don\'t approve] Short PRD Roadmap card: tutors can mark a session "did not happen" from the session card without opening the reflection.',
      byBot: false,
    },
    bot("1792264374.729519", 'Ready to *create this card on the Roadmap board*: _Mark Session "Did Not Happen" from Session Card_', "card"),
    bot("1792264391.282889", "Checked *Session Reflection* against today's blueprint. The results are below; I couldn't draft a proposal from them.", "blueprint_check"),
    bot("1792264588.035979", "Rejected, so nothing runs.", "note"),
    bot("1792264654.577549", "*Beside today's blueprint* — this changes how Session Reflection › Session did not happen works.", "blueprint_check"),
  ];
}

const asTag = (m: { event_type: string; event_payload: Record<string, unknown> }) => ({ type: m.event_type, payload: m.event_payload });

describe("the thread that asked about a question never put", () => {
  it("with its status posts tagged, the check's line is never an answer, even when the model flags it", async () => {
    // The person's own message is new, so the model is still asked (it could
    // state a decision); the parse keeps no item on a tagged bot post.
    const provider = fakeProvider({ generateReplies: [FLAGGED] });
    const messages = thread((kind) => asTag(statusTag(kind)));
    const found = await detectDmItems(provider, { rootTs: ROOT, messages, since: "1792264000.000000" });
    assert.deepEqual(found, { ok: true, unanswered: [], disagreements: [], decisions: [] });
  });

  it("with only status posts new, the sweep asks the model nothing", async () => {
    const provider = fakeProvider({ generateReplies: [FLAGGED] });
    const messages = thread((kind) => asTag(statusTag(kind)));
    const found = await detectDmItems(provider, { rootTs: ROOT, messages, since: ROOT });
    assert.deepEqual(found, { ok: true, unanswered: [], disagreements: [], decisions: [] });
    assert.equal(provider.generated.length, 0, "no model call");
  });

  it("untagged, as they went up before, the check's line was read as an empty answer", async () => {
    const provider = fakeProvider({ generateReplies: [FLAGGED] });
    const found = await detectDmItems(provider, { rootTs: ROOT, messages: thread(() => undefined), since: "1792264000.000000" });
    assert.equal(found.ok, true);
    if (!found.ok) return;
    assert.deepEqual(found.unanswered.map((u) => u.what), ["a proposal from them"]);
  });
});

describe("the blueprint check's messages carry the status tag", () => {
  const offer = { scenario: "Session Reflection", cardTs: "1792264374.729519" };
  const each = {
    offer: checkOfferMessage({ scenario: "Session Reflection", expiresAt: 0, underCard: true }),
    checking: checkingMessage(offer, PERSON),
    stopped: stoppedMessage(offer),
    done: checkedMessage(offer, { kind: "done" }),
    undrafted: checkedMessage(offer, { kind: "undrafted" }),
    results: resultsMessage("1792264391.282889", { text: "*Beside today's blueprint* — this changes how it works.", action: null, expiresAt: 0 }),
  };
  for (const [name, message] of Object.entries(each)) {
    it(name, () => assert.equal(message.metadata?.event_type, STATUS_EVENT));
  }
});

describe("the Slack adapter's posts that are not answers go up tagged", () => {
  it("a gate note, a note, the check's offer, a narration line and a card", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), target);
    await delivery.postGateNote({ kind: "resolved", decision: "cancel", rejected: {} });
    await delivery.postNote("Which card did you mean?");
    await delivery.postCheckOffer({ scenario: "Session Reflection", expiresAt: 0, underCard: true });
    delivery.postInterim("Looking at the Roadmap board.");
    await delivery.card({
      kind: "confirm",
      verb: "create this card on the Roadmap board",
      fields: [{ label: "title", value: "Mark Session Did Not Happen" }],
      caveats: [],
      operations: [],
    });
    await new Promise((r) => setTimeout(r, 0));
    const messages = slack.of("message");
    assert.equal(messages.length, 5);
    for (const m of messages) assert.equal(m.metadata?.event_type, STATUS_EVENT, `tagged: ${m.text.slice(0, 40)}`);
  });

  it("the static checklist, posted where there is no thread to stream into", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(true), { channel: DM, userMsgTs: ROOT, userId: PERSON }).beginProgress("Working on it");
    const [checklist] = slack.of("message");
    assert.equal(checklist?.metadata?.event_type, STATUS_EVENT);
  });

  it("a card keeps a tag of its own", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(false), target).card({
      kind: "confirm",
      verb: "create a Notion page",
      fields: [],
      caveats: [],
      operations: [],
      tag: { eventType: "uno_sweep_card", payload: { card_key: "k" } },
    });
    assert.equal(slack.of("message")[0]!.metadata?.event_type, "uno_sweep_card");
  });

  it("a note keeps a tag of its own", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(false), target).postNote("Asked.", { eventType: "uno_dm_ask", payload: { id: "x" } });
    assert.equal(slack.of("message")[0]!.metadata?.event_type, "uno_dm_ask");
  });
});
