// The four ways to resolve a proposal agree with each other.
//
// This file used to assert a glyph table and call itself "the three
// confirmation paths agree" — it proved that ✅ means confirm, which was never
// the part that broke. What broke was the paths: each door looked the proposal
// up differently, and `slack/gate.ts` threw the claim's answer away, so a
// reaction that LOST a race still announced the winner's action as its own.
//
// So every case here drives a real signal through `resolveSignal` against one
// staged proposal in the in-memory ThreadState, and asserts the VERDICT: the
// same outcome, the same text to post, and one execution between all four.
//
// Slack devoli/C0ARJ2A3A69 p1787296549114929, 2026-08-21: Bryan typed "sure go
// ahead" and the bot asked a second time. The fix on 2026-08-22 was to delete
// the phrase lists — a typed reply in words goes to the model, which reads it
// with the proposal in context and calls `proposal_resolve`. The last two
// describes below pin what stays deterministic: an emoji has exactly one
// meaning whether it is reacted, pressed or typed, and nothing typed in words
// resolves without the model.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  EXPIRED_POST,
  STALE_POST,
  SUPERSEDED_POST,
  resolveSignal,
  type GateSignal,
  type GateVerdict,
} from "../src/gate/index";
import {
  CANCEL_REACTIONS,
  CONFIRM_REACTIONS,
  GATE_RESERVED,
  mapReaction,
  typedEmojiDecision,
} from "../src/slack/gate-reactions";
import {
  PROPOSAL_TTL_MS,
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";
import { recordingDelivery, withWorkingSignal } from "../src/turn/index";

// ── one staged proposal, and the four signals that resolve it ────────────────

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const CARD_TS = "1700000000.000195";

const PROPOSAL: PendingProposal = {
  toolName: "notion_create",
  input: { title: "Reflection redesign" },
  channel: CHANNEL,
  threadTs: THREAD,
  replyTs: THREAD,
  userMsgTs: "1700000000.000190",
  proposalTs: CARD_TS,
  proposalText: "(the staged card)",
  requesterUserId: "U1",
};

/** A store with the card staged, and a clock the cases can move. */
async function staged(opts: { at?: () => number } = {}): Promise<ThreadState> {
  const store = createInMemoryThreadState(opts.at ? { now: opts.at } : {});
  await store.putProposal(PROPOSAL);
  return store;
}

const reaction = (over: Partial<Extract<GateSignal, { kind: "reaction" }>> = {}): GateSignal => ({
  kind: "reaction",
  messageTs: CARD_TS,
  channel: CHANNEL,
  thread: THREAD,
  glyph: "white_check_mark",
  userId: "U2",
  ...over,
});

const button = (decision: "confirm" | "cancel" = "confirm"): GateSignal => ({
  kind: "button",
  messageTs: CARD_TS,
  decision,
  userId: "U2",
});

const typed = (text = "✅"): GateSignal => ({
  kind: "typed",
  channel: CHANNEL,
  thread: THREAD,
  text,
  userId: "U2",
});

const model = (messageToUser?: string): GateSignal => ({
  kind: "model",
  pending: PROPOSAL,
  decision: "confirm",
  ...(messageToUser ? { messageToUser } : {}),
});

/** Every door, each against its own freshly staged card. */
const DOORS: Array<{ name: string; signal: GateSignal }> = [
  { name: "reaction on the card", signal: reaction() },
  { name: "the card's ✅ button", signal: button() },
  { name: "the emoji typed alone", signal: typed() },
  { name: "the model's proposal_resolve", signal: model() },
];

describe("four signals, one verdict", () => {
  it("wins, posts the same text, and executes the same tool on every door", async () => {
    const verdicts: GateVerdict[] = [];
    for (const door of DOORS) {
      verdicts.push(await resolveSignal(door.signal, { threadState: await staged() }));
    }

    for (const [i, verdict] of verdicts.entries()) {
      const where = DOORS[i]!.name;
      assert.equal(verdict.outcome, "won", where);
      assert.equal(verdict.decision, "confirm", where);
      assert.equal(verdict.proposal?.proposalTs, CARD_TS, where);
      // The text, and where it goes: `replyTs`, never `threadTs` — see
      // PendingProposal for the DM that swallowed an approved write.
      assert.deepEqual(verdict.post, { text: "Got it — kicking that off.", replyTs: THREAD }, where);
      assert.deepEqual(
        verdict.execute,
        {
          operations: [
            { toolName: "notion_create", input: { title: "Reflection redesign" } },
          ],
          toolName: "notion_create",
          input: { title: "Reflection redesign" },
          channel: CHANNEL,
          threadTs: THREAD,
          userMsgTs: PROPOSAL.userMsgTs,
          requesterUserId: "U1",
        },
        where,
      );
    }

    // Not "each looks right" but "all four are the same verdict".
    for (const verdict of verdicts.slice(1)) {
      assert.deepEqual(verdict, verdicts[0]);
    }
  });

  it("carries the model's own words when it brought some", async () => {
    const verdict = await resolveSignal(model("Filing it now."), { threadState: await staged() });
    assert.equal(verdict.post?.text, "Filing it now.");
  });

  it("lets exactly one of two racing confirmers win, and tells the other", async () => {
    // The race the claim exists for: someone reacts ✅ and then, unsure it
    // registered, types one too — two handlers that each loaded the same
    // record, and `notion_create` is not idempotent.
    for (const second of DOORS) {
      const threadState = await staged();
      const verdicts = await Promise.all([
        resolveSignal(reaction(), { threadState }),
        resolveSignal(second.signal, { threadState }),
      ]);

      const won = verdicts.filter((v) => v.outcome === "won");
      const lost = verdicts.filter((v) => v.outcome === "stale");
      assert.equal(won.length, 1, second.name);
      assert.equal(lost.length, 1, second.name);
      // Only the winner is told to run anything, and the loser is told why.
      assert.notEqual(won[0]?.execute, undefined, second.name);
      assert.equal(lost[0]?.execute, undefined, second.name);
      assert.equal(lost[0]?.post?.text, STALE_POST, second.name);
    }
  });

  it("tells a confirmer that arrives after the card is already gone", async () => {
    // Not a race but a latecomer: the record is claimed, so there is nothing
    // to look up. Each door that is unambiguously ABOUT a card still answers.
    for (const second of [button(), typed(), model()]) {
      const threadState = await staged();
      assert.equal((await resolveSignal(reaction(), { threadState })).outcome, "won");

      const after = await resolveSignal(second, { threadState });
      assert.equal(after.outcome, "stale", second.kind);
      assert.equal(after.execute, undefined, second.kind);
      assert.equal(after.post?.text, STALE_POST, second.kind);
    }
  });

  it("stays silent for a late REACTION, which may be punctuation", async () => {
    // The one door that is allowed to mean nothing: a ✅ dropped on an old
    // message in a settled thread is agreement with the conversation, not a
    // command, and the bot speaking there was noise.
    const threadState = await staged();
    assert.equal((await resolveSignal(reaction(), { threadState })).outcome, "won");

    const late = await resolveSignal(reaction(), { threadState });
    assert.equal(late.outcome, "none");
    assert.equal(late.post, null);
    assert.equal(late.execute, undefined);
  });

  it("declines without executing anything", async () => {
    const doors: GateSignal[] = [
      reaction({ glyph: "no_entry" }),
      button("cancel"),
      typed("⛔"),
      { kind: "model", pending: PROPOSAL, decision: "cancel" },
    ];
    for (const signal of doors) {
      const verdict = await resolveSignal(signal, { threadState: await staged() });
      assert.equal(verdict.outcome, "won", signal.kind);
      assert.equal(verdict.decision, "cancel", signal.kind);
      assert.deepEqual(verdict.post, { text: "Cancelled.", replyTs: THREAD }, signal.kind);
      // The whole point of a decline: there is nothing for the caller to run.
      assert.equal(verdict.execute, undefined, signal.kind);
    }
  });
});

describe("a card that is no longer there", () => {
  it("reports an expired proposal as stale, in the expired wording", async () => {
    let clock = 1_000_000;
    const threadState = await staged({ at: () => clock });
    clock += PROPOSAL_TTL_MS + 1;

    const verdict = await resolveSignal(reaction(), { threadState });
    assert.equal(verdict.outcome, "stale");
    assert.equal(verdict.post?.text, EXPIRED_POST);
    assert.equal(verdict.execute, undefined);
    // Expiry is the store's answer, not a second clock in the gate — and the
    // by-thread fallback must not resurrect an aged-out card either.
    const byThread = await resolveSignal(typed(), { threadState });
    assert.equal(byThread.outcome, "stale");
    assert.equal(byThread.execute, undefined);
  });

  it("answers a button press on a card that is gone", async () => {
    const verdict = await resolveSignal(button(), { threadState: createInMemoryThreadState() });
    assert.equal(verdict.outcome, "stale");
    assert.equal(verdict.post?.text, STALE_POST);
  });

  it("stays silent when a reaction lands in a thread holding nothing", async () => {
    // A ✅ used as ordinary punctuation must not make the bot speak.
    const verdict = await resolveSignal(reaction({ messageTs: "1700000000.000999" }), {
      threadState: createInMemoryThreadState(),
    });
    assert.equal(verdict.outcome, "none");
    assert.equal(verdict.post, null);
  });
});

describe("a card a revision replaced", () => {
  /** Two cards in one thread: the one the person pushed back on, then its
   *  revision. */
  async function twoCards(): Promise<{ threadState: ThreadState; revisedTs: string }> {
    const revisedTs = "1700000000.000295";
    const threadState = await staged();
    await threadState.putProposal({
      ...PROPOSAL,
      proposalTs: revisedTs,
      input: { title: "Reflection redesign, tutors only" },
      proposalText: "(the revised card)",
    });
    return { threadState, revisedTs };
  }

  // The bug this closes (#573): the older card stayed live for its full hour,
  // so a ✅ on it ran the very input the person was pushing back on.
  it("tells a ✅ on the older card it was replaced, and executes nothing", async () => {
    const { threadState } = await twoCards();
    const verdict = await resolveSignal(reaction(), { threadState });
    assert.equal(verdict.outcome, "stale");
    assert.equal(verdict.post?.text, SUPERSEDED_POST);
    assert.equal(verdict.execute, undefined);
  });

  it("says the same thing through the button door", async () => {
    const { threadState } = await twoCards();
    const verdict = await resolveSignal(button(), { threadState });
    assert.equal(verdict.outcome, "stale");
    assert.equal(verdict.post?.text, SUPERSEDED_POST);
    assert.equal(verdict.execute, undefined);
  });

  it("declines on the older card without executing or resolving the newer one", async () => {
    const { threadState, revisedTs } = await twoCards();
    const verdict = await resolveSignal(reaction({ glyph: "no_entry" }), { threadState });
    assert.equal(verdict.outcome, "stale");
    assert.equal(verdict.execute, undefined);
    // ⛔ on a retired card is not a decision about the live one.
    assert.equal((await threadState.getProposalByTs(revisedTs)).state, "found");
  });

  it("resolves the newest card normally, through both doors", async () => {
    for (const door of ["reaction", "button"] as const) {
      const { threadState, revisedTs } = await twoCards();
      const signal =
        door === "reaction" ? reaction({ messageTs: revisedTs }) : { ...button(), messageTs: revisedTs };
      const verdict = await resolveSignal(signal as GateSignal, { threadState });
      assert.equal(verdict.outcome, "won", door);
      assert.equal(verdict.proposal?.proposalTs, revisedTs, door);
      assert.deepEqual(verdict.execute?.input, { title: "Reflection redesign, tutors only" }, door);
    }
  });

  it("sends a typed ✅ to the newest card, not the one it replaced", async () => {
    const { threadState, revisedTs } = await twoCards();
    const verdict = await resolveSignal(typed(), { threadState });
    assert.equal(verdict.outcome, "won");
    assert.equal(verdict.proposal?.proposalTs, revisedTs);
  });
});

describe("lookup: by card ts, then by thread", () => {
  it("finds the conversation's live card when the ts is unknown", async () => {
    const threadState = await staged();
    // A reaction on a message that is not the card — a superseded card, or a
    // nearby reply. The by-thread lookup FINDS the live proposal…
    const verdict = await resolveSignal(reaction({ messageTs: "1700000000.000123" }), {
      threadState,
    });
    assert.equal(verdict.proposal?.proposalTs, CARD_TS);
    // …and points at it rather than resolving it: a reaction resolves the card
    // it was placed ON, or it resolves nothing. React ✅ on a superseded card
    // and the fallback used to fire the NEWER proposal — you confirmed one
    // thing and got another.
    assert.equal(verdict.outcome, "none");
    assert.equal(verdict.execute, undefined);
    assert.match(verdict.post?.text ?? "", /not on the proposal I am holding/);
    assert.match(verdict.post?.text ?? "", /notion_create/);
    // And the card is still claimable afterwards, by the door that is actually on it.
    assert.equal((await resolveSignal(reaction(), { threadState })).outcome, "won");
  });

  it("is the only lookup a typed emoji has, and it resolves through it", async () => {
    // A typed message carries no card ts at all.
    const verdict = await resolveSignal(typed(), { threadState: await staged() });
    assert.equal(verdict.outcome, "won");
    assert.equal(verdict.proposal?.proposalTs, CARD_TS);
  });

  it("does not reach a live card in another conversation", async () => {
    // The by-thread lookup is scoped to the conversation the message arrived
    // in: a ✅ typed somewhere else resolves nothing, however live the card is.
    const elsewhere = await resolveSignal(
      { kind: "typed", channel: CHANNEL, thread: "1700000000.000777", text: "✅", userId: "U2" },
      { threadState: await staged() },
    );
    assert.equal(elsewhere.outcome, "stale");
    assert.equal(elsewhere.execute, undefined);
  });
});

describe("a signal that carries no decision", () => {
  it("costs nothing and says nothing for an ordinary reaction", async () => {
    for (const glyph of ["tada", "heart", "eyes", "-1", "thumbsdown"]) {
      const verdict = await resolveSignal(reaction({ glyph }), { threadState: await staged() });
      assert.equal(verdict.outcome, "none", glyph);
      assert.equal(verdict.decision, undefined, glyph);
      assert.equal(verdict.post, null, glyph);
    }
  });

  it("leaves words to the model, with the card still staged", async () => {
    const threadState = await staged();
    for (const text of ["yes", "sure go ahead", "ok", "👍 but rename it", "thanks"]) {
      const verdict = await resolveSignal(typed(text), { threadState });
      // No decision is the caller's signal to fall through to the model.
      assert.equal(verdict.decision, undefined, text);
      assert.equal(verdict.post, null, text);
    }
    // Nothing was claimed by any of them.
    assert.equal((await resolveSignal(typed(), { threadState })).outcome, "won");
  });
});

// ── the vocabulary itself ────────────────────────────────────────────────────

describe("a typed emoji is the reaction, typed", () => {
  it("confirms on the glyphs the card names", () => {
    for (const text of ["✅", "👍", "✔️", ":white_check_mark:", ":+1:", ":thumbsup:", " ✅ ", "✅✅"]) {
      assert.equal(typedEmojiDecision(text), "confirm", JSON.stringify(text));
    }
  });

  it("cancels on the glyphs the card names", () => {
    for (const text of ["⛔", "❌", "❎", "🚫", ":no_entry:", ":x:"]) {
      assert.equal(typedEmojiDecision(text), "cancel", JSON.stringify(text));
    }
  });

  it("tolerates a skin tone on the thumbs-up", () => {
    assert.equal(typedEmojiDecision("👍🏽"), "confirm");
  });

  it("agrees with the reaction path on every name", () => {
    assert.equal(mapReaction("white_check_mark"), typedEmojiDecision(":white_check_mark:"));
    assert.equal(mapReaction("no_entry"), typedEmojiDecision(":no_entry:"));
    assert.equal(mapReaction("+1"), typedEmojiDecision("👍"));
    assert.equal(mapReaction("x"), typedEmojiDecision("❌"));
  });
});

describe("the gate's emoji are off-limits to the bot", () => {
  it("reserves exactly the union of the two sets", () => {
    for (const name of CONFIRM_REACTIONS) assert.ok(GATE_RESERVED.has(name), name);
    for (const name of CANCEL_REACTIONS) assert.ok(GATE_RESERVED.has(name), name);
    assert.equal(GATE_RESERVED.size, CONFIRM_REACTIONS.size + CANCEL_REACTIONS.size);
  });

  it("leaves the bot's own state signals free", () => {
    for (const name of ["eyes", "hourglass_flowing_sand", "warning", "handshake", "wave", "pray", "raised_hands"]) {
      assert.ok(!GATE_RESERVED.has(name), name);
    }
  });
});

// ── the two doors that resolve a card without a Turn ─────────────────────────
//
// A reaction and a button press run the confirmed tool exactly as a turn would,
// and for as long — but neither goes through Turn, so neither inherited the
// working signal Turn raises and settles. A ✅ in a channel thread therefore
// ran its tool in silence, and a thread that DID have the indicator up kept it
// after the run, because the only clear lived in the message handler.
//
// The pairing itself is `withWorkingSignal`, and it is what both doors use: one
// set, one clear, whatever the run does in between.

describe("the doors outside Turn raise and settle the working signal", () => {
  const signalOf = (delivery: ReturnType<typeof recordingDelivery>): string[] =>
    delivery.calls
      .filter((c) => c.kind === "working" || c.kind === "working-clear")
      .map((c) => c.kind);

  it("posts the verdict, runs the tool, and leaves nothing up", async () => {
    const delivery = recordingDelivery();
    const ran: string[] = [];

    await withWorkingSignal(delivery, async (d) => {
      await d.setWorking({ status: "is working on that…" });
      await d.postNote("Got it — kicking that off.");
      ran.push("executeVerdict");
    });

    assert.deepEqual(ran, ["executeVerdict"]);
    assert.deepEqual(signalOf(delivery), ["working", "working-clear"]);
  });

  it("settles it when the tool dies — the door that swallows and the door that rethrows", async () => {
    // The reaction door catches and answers in the thread; the button door lets
    // the throw out. The indicator comes down either way, which is the whole
    // reason the clear is a `finally` and not a line after the work.
    const swallowed = recordingDelivery();
    await withWorkingSignal(swallowed, async (d) => {
      await d.setWorking({ status: "is working on that…" });
      try {
        throw new Error("notion 502");
      } catch {
        await d.postNote(":warning: hit a snag executing it — give it another go.");
      }
    });
    assert.deepEqual(signalOf(swallowed), ["working", "working-clear"]);

    const rethrown = recordingDelivery();
    await assert.rejects(
      withWorkingSignal(rethrown, async (d) => {
        await d.setWorking({ status: "is working on that…" });
        throw new Error("notion 502");
      }),
      /notion 502/,
    );
    assert.deepEqual(signalOf(rethrown), ["working", "working-clear"]);
  });

  // Both door files name `Env` and the Slack client, so this suite's compile
  // cannot reach them (`tsconfig.test.json` types only Node). Read them instead
  // — the agreement being checked is one line long and the failure is silent:
  // a door that stops wrapping its run still works, and still strands the
  // indicator. Same move as the manifest check in `shortcuts.test.ts`.
  for (const door of ["src/slack/gate.ts", "src/slack/interactive.ts"]) {
    it(`${door} runs its verdict inside the pairing`, () => {
      const src = readFileSync(resolve(process.cwd(), door), "utf8");
      const wrapped = src.slice(src.indexOf("withWorkingSignal("));
      assert.ok(src.includes("withWorkingSignal"), "the door uses the pairing");
      assert.ok(wrapped.includes("setWorking("), "it raises the signal inside the pairing");
      assert.ok(wrapped.includes("executeVerdict("), "and runs the verdict inside it");
      // No second owner: the door never takes the signal down by hand.
      assert.ok(!src.includes("clearWorking("), "the clear is the pairing's, not the door's");
    });
  }
});
