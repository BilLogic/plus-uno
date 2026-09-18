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
// same outcome, the same note, and one execution between all four.
// Past the verdict, the reaction door (#592) and the button door (#654) are
// driven too — they take their dependencies by name, so the whole door runs
// here on the recording Delivery rather than being read with a regex.
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
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  resolveSignal,
  runReactionDoor,
  type GateSignal,
  type GateVerdict,
  type ReactionDoorTarget,
} from "../src/gate/index";
import {
  CANCEL_REACTIONS,
  CONFIRM_REACTIONS,
  GATE_RESERVED,
  mapReaction,
  typedEmojiDecision,
} from "../src/gate/reactions";
import {
  PROPOSAL_TTL_MS,
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";
import {
  recordingDelivery,
  withWorkingSignal,
  type RecordingDelivery,
  type TurnSettlement,
} from "../src/turn/index";
import { runButtonDoor, type ButtonDoorTarget } from "../src/slack/button-door";

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
  it("wins, posts the same verdict, and executes the same tool on every door", async () => {
    const verdicts: GateVerdict[] = [];
    for (const door of DOORS) {
      verdicts.push(await resolveSignal(door.signal, { threadState: await staged() }));
    }

    for (const [i, verdict] of verdicts.entries()) {
      const where = DOORS[i]!.name;
      assert.equal(verdict.outcome, "won", where);
      assert.equal(verdict.decision, "confirm", where);
      assert.equal(verdict.proposal?.proposalTs, CARD_TS, where);
      // The verdict, and where it goes: `replyTs`, never `threadTs` — see
      // PendingProposal for the DM that swallowed an approved write.
      assert.deepEqual(
        verdict.post,
        { note: { kind: "resolved", decision: "confirm" }, replyTs: THREAD },
        where,
      );
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
    assert.deepEqual(verdict.post?.note, { kind: "said", text: "Filing it now." });
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
      assert.deepEqual(lost[0]?.post?.note, { kind: "already-resolved" }, second.name);
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
      assert.deepEqual(after.post?.note, { kind: "already-resolved" }, second.kind);
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
      assert.deepEqual(
        verdict.post,
        { note: { kind: "resolved", decision: "cancel" }, replyTs: THREAD },
        signal.kind,
      );
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
    assert.deepEqual(verdict.post?.note, { kind: "expired" });
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
    assert.deepEqual(verdict.post?.note, { kind: "already-resolved" });
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
    assert.deepEqual(verdict.post?.note, { kind: "superseded" });
    assert.equal(verdict.execute, undefined);
  });

  it("says the same thing through the button door", async () => {
    const { threadState } = await twoCards();
    const verdict = await resolveSignal(button(), { threadState });
    assert.equal(verdict.outcome, "stale");
    assert.deepEqual(verdict.post?.note, { kind: "superseded" });
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

  // The DM regression this grain exists for: `threadTs` is the constant "dm"
  // there, so two independent asks share a conversation key. Retiring by
  // conversation would tell the second ✅ its proposal "was replaced by a newer
  // one" — untrue, a different request — and leave the first ask unresolvable.
  it("leaves an unrelated ask in the same DM resolvable", async () => {
    const threadState = createInMemoryThreadState();
    const first = { ...PROPOSAL, channel: "D1", threadTs: "dm", replyTs: "1700000000.000100" };
    const second = {
      ...PROPOSAL,
      channel: "D1",
      threadTs: "dm",
      replyTs: "1700000000.000200",
      proposalTs: "1700000000.000295",
      input: { title: "Something else entirely" },
    };
    await threadState.putProposal(first);
    await threadState.putProposal(second);

    for (const card of [first, second]) {
      const verdict = await resolveSignal(
        reaction({ messageTs: card.proposalTs, channel: "D1", thread: "dm" }),
        { threadState },
      );
      assert.equal(verdict.outcome, "won", card.proposalTs);
      assert.deepEqual(verdict.execute?.input, card.input, card.proposalTs);
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
    // The verdict names the gesture, the person and the live card; the
    // SENTENCE that points them at it is `slack/gate-note.ts`'s (#623).
    assert.deepEqual(verdict.post?.note, {
      kind: "not-on-the-card",
      toolName: "notion_create",
      glyph: "white_check_mark",
      userId: "U2",
    });
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

// ── the reaction door ────────────────────────────────────────────────────────
//
// A reaction resolves a card without a Turn, and runs the confirmed tool for as
// long as any turn would — so the door raises and settles the working signal
// Turn owns, on the same `withWorkingSignal` pairing.
//
// This suite used to READ the door's source and match a regex for that, because
// a door whose one argument was an `Env` was a door this suite had nothing to
// call. It takes its dependencies by name now — the Delivery port, ThreadState, the thread-root
// read, the bot's own id, the confirmed tool — so the whole door runs here on
// the recording adapter, and the orderings are asserted rather than
// pattern-matched.

describe("the reaction door", () => {
  const kindsOf = (delivery: RecordingDelivery): string[] => delivery.calls.map((c) => c.kind);

  /** What the clear told the surface the thread now needs. */
  const clearedWith = (delivery: RecordingDelivery): TurnSettlement | undefined =>
    delivery.calls.find((c) => c.kind === "working-clear")?.settlement;

  /** Drive the real door against one staged card, on the recording adapter. */
  async function drive(
    opts: {
      threadState?: ThreadState;
      glyph?: string;
      messageTs?: string;
      userId?: string;
      applyVerdict?: (verdict: GateVerdict) => Promise<void>;
    } = {},
  ) {
    const threadState = opts.threadState ?? (await staged());
    const delivery = recordingDelivery();
    const ran: GateVerdict[] = [];
    /** What the door had already said by the time the tool ran. */
    let saidBeforeRunning: string[] | undefined;
    const targets: ReactionDoorTarget[] = [];
    const reads: string[] = [];

    await runReactionDoor(
      {
        channel: CHANNEL,
        messageTs: opts.messageTs ?? CARD_TS,
        glyph: opts.glyph ?? "white_check_mark",
        userId: opts.userId ?? "U2",
      },
      {
        threadState,
        delivery: (target) => {
          targets.push(target);
          return delivery;
        },
        async threadRootOf(channel, reactedTs) {
          reads.push(`root ${channel} ${reactedTs}`);
          return THREAD;
        },
        async botUserId() {
          reads.push("identity");
          return "UBOT";
        },
        async applyVerdict(verdict) {
          saidBeforeRunning = kindsOf(delivery);
          ran.push(verdict);
          if (opts.applyVerdict) await opts.applyVerdict(verdict);
        },
      },
    );

    return { delivery, ran, targets, reads, threadState, saidBeforeRunning };
  }

  it("speaks the verdict, runs the tool, and leaves nothing up", async () => {
    const { delivery, ran, saidBeforeRunning } = await drive();

    // The raise sits inside the pairing, the answer follows it, and the settle
    // comes last — one clear, and the door never writes it by hand.
    assert.deepEqual(kindsOf(delivery), ["working", "gate-note", "working-clear"]);
    // The verdict as a MEANING — what it reads as in Slack is asserted in
    // `tests/replaced-card-message.test.ts` against the one renderer (#623).
    assert.deepEqual(delivery.gateNotes, [{ kind: "resolved", decision: "confirm" }]);
    // A door resolving a card leaves nobody waiting on anybody, and it states
    // that rather than inheriting it: the mapper is a required argument, so a
    // door cannot get an answer it never thought about (#575).
    assert.equal(clearedWith(delivery), "idle");

    // The tool runs AFTER the verdict is posted — the person sees the
    // acknowledgement before the work, the same order every door keeps.
    assert.deepEqual(saidBeforeRunning, ["working", "gate-note"]);
    assert.equal(ran.length, 1);
    assert.deepEqual(ran[0]?.execute?.input, { title: "Reflection redesign" });
  });

  it("posts where the verdict said, against the person's own message", async () => {
    const { targets } = await drive();
    assert.deepEqual(targets, [
      { channel: CHANNEL, replyTs: THREAD, userMsgTs: PROPOSAL.userMsgTs, userId: "U2" },
    ]);
  });

  it("settles the signal when the tool dies, and says so in the thread", async () => {
    // The failure this whole path fights: a ✅ that did nothing and said
    // nothing (live 2026-07-13). The door answers in the thread, and the
    // indicator comes down either way — which is why the clear is a `finally`
    // and not a line after the work.
    const { delivery } = await drive({
      applyVerdict: async () => {
        throw new Error("notion 502");
      },
    });

    assert.deepEqual(kindsOf(delivery), ["working", "gate-note", "gate-note", "working-clear"]);
    // The door says it caught THIS gesture and could not run it — the glyph is
    // on the verdict, and the sentence carrying it is the adapter's (#623).
    assert.deepEqual(delivery.gateNotes[1], {
      kind: "resolve-failed",
      glyph: "white_check_mark",
    });
    assert.equal(clearedWith(delivery), "idle");
  });

  it("costs nothing for a reaction the gate does not read", async () => {
    // Every 🎉 in every channel the bot is in arrives here, and the thread-root
    // read is a subrequest spent on nothing.
    const { delivery, reads, threadState } = await drive({ glyph: "tada" });
    assert.deepEqual(reads, []);
    assert.deepEqual(kindsOf(delivery), []);
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "found");
  });

  it("never resolves the bot's own card", async () => {
    const { delivery, ran, threadState } = await drive({ userId: "UBOT" });
    assert.deepEqual(kindsOf(delivery), []);
    assert.deepEqual(ran, []);
    assert.equal((await threadState.getProposalByTs(CARD_TS)).state, "found");
  });

  it("stays silent, and raises nothing, when the verdict has nothing to say", async () => {
    // A ✅ used as ordinary punctuation in a thread holding no card: no post,
    // and so no working signal to strand either.
    const { delivery, ran } = await drive({
      threadState: createInMemoryThreadState(),
      messageTs: "1700000000.000999",
    });
    assert.deepEqual(kindsOf(delivery), []);
    assert.deepEqual(ran, []);
  });
});

// ── the other door outside Turn ──────────────────────────────────────────────

describe("the button door", () => {
  const kindsOf = (delivery: RecordingDelivery): string[] => delivery.calls.map((c) => c.kind);

  /** What the clear told the surface the thread now needs. */
  const clearedWith = (delivery: RecordingDelivery): TurnSettlement | undefined =>
    delivery.calls.find((c) => c.kind === "working-clear")?.settlement;

  /** Drive the real door against one staged card, on the recording adapter. */
  async function drive(
    opts: {
      threadState?: ThreadState;
      decision?: "confirm" | "cancel";
      messageTs?: string;
      userId?: string;
      applyVerdict?: (verdict: GateVerdict) => Promise<void>;
    } = {},
  ) {
    const threadState = opts.threadState ?? (await staged());
    const delivery = recordingDelivery();
    const ran: GateVerdict[] = [];
    /** What the door had already said by the time the tool ran. */
    let saidBeforeRunning: string[] | undefined;
    const targets: ButtonDoorTarget[] = [];
    const ephemerals: string[] = [];
    const replacements: Array<{ text: string; note: string }> = [];

    await runButtonDoor(
      {
        channel: CHANNEL,
        messageTs: opts.messageTs ?? CARD_TS,
        decision: opts.decision ?? "confirm",
        userId: opts.userId ?? "U2",
      },
      {
        threadState,
        delivery: (target) => {
          targets.push(target);
          return delivery;
        },
        async applyVerdict(verdict) {
          saidBeforeRunning = kindsOf(delivery);
          ran.push(verdict);
          if (opts.applyVerdict) await opts.applyVerdict(verdict);
        },
        async replyEphemeral(text) {
          ephemerals.push(text);
        },
        async replaceCard(text, note) {
          replacements.push({ text, note });
        },
      },
    );

    return { delivery, ran, targets, ephemerals, replacements, threadState, saidBeforeRunning };
  }

  it("speaks the verdict, runs the tool, and leaves nothing up", async () => {
    const { delivery, ran, saidBeforeRunning, replacements } = await drive();

    // The raise sits inside the pairing, the answer follows it, and the settle
    // comes last — one clear, and the door never writes it by hand.
    assert.deepEqual(kindsOf(delivery), ["working", "gate-note", "working-clear"]);
    assert.deepEqual(delivery.gateNotes, [{ kind: "resolved", decision: "confirm" }]);
    // A door resolving a card leaves nobody waiting on anybody, and it states
    // that rather than inheriting it: the mapper is a required argument, so a
    // door cannot get an answer it never thought about (#575).
    assert.equal(clearedWith(delivery), "idle");
    assert.notEqual(clearedWith(delivery), "waiting-on-person");

    // The tool runs AFTER the verdict is posted — the person sees the
    // acknowledgement before the work, the same order every door keeps.
    assert.deepEqual(saidBeforeRunning, ["working", "gate-note"]);
    assert.equal(ran.length, 1);
    assert.deepEqual(ran[0]?.execute?.input, { title: "Reflection redesign" });
    assert.deepEqual(replacements, [
      {
        text: PROPOSAL.proposalText,
        note: ":white_check_mark: Approved by <@U2>",
      },
    ]);
  });

  it("posts where the verdict said, against the person's own message", async () => {
    const { targets } = await drive();
    assert.deepEqual(targets, [
      { channel: CHANNEL, replyTs: THREAD, userMsgTs: PROPOSAL.userMsgTs, userId: "U2" },
    ]);
  });

  it("answers a losing press where the person is looking, and raises nothing", async () => {
    // Expired, already resolved, or a press that lost the race. Never silence,
    // and never a working signal to strand either.
    const { delivery, ran, ephemerals, replacements } = await drive({
      threadState: createInMemoryThreadState(),
    });
    assert.deepEqual(kindsOf(delivery), []);
    assert.deepEqual(ran, []);
    assert.deepEqual(ephemerals, [STALE_POST]);
    assert.deepEqual(replacements, []);
  });

  it("lets the throw out rather than answering in the thread, and still settles", async () => {
    // Unlike the reaction door, this one does not catch: the pairing is what
    // brings the indicator down, and the settlement the clear carries is the
    // wrapper's own `"idle"` — a run that threw never produced a result to map.
    const threadState = await staged();
    const delivery = recordingDelivery();
    await assert.rejects(
      runButtonDoor(
        { channel: CHANNEL, messageTs: CARD_TS, decision: "confirm", userId: "U2" },
        {
          threadState,
          delivery: () => delivery,
          applyVerdict: async () => {
            throw new Error("notion 502");
          },
          replyEphemeral: async () => {},
          replaceCard: async () => {},
        },
      ),
      /notion 502/,
    );
    assert.deepEqual(kindsOf(delivery), ["working", "gate-note", "working-clear"]);
    assert.equal(clearedWith(delivery), "idle");
    assert.notEqual(clearedWith(delivery), "waiting-on-person");
  });

  it("keeps the indicator's clear on the exit that rethrows", async () => {
    // The pairing itself, independent of either door: a throw never reaches
    // the mapper, so a door that wrote `() => "waiting-on-person"` still
    // settles idle. The test above drives the button door; this one pins the
    // wrapper the door uses.
    const delivery = recordingDelivery();
    await assert.rejects(
      withWorkingSignal(
        delivery,
        async (d) => {
          await d.setWorking({ status: "is working on that…" });
          throw new Error("notion 502");
        },
        // Never reached, and deliberately the OTHER settlement, so a wrapper
        // that consulted it anyway fails here.
        () => "waiting-on-person",
      ),
      /notion 502/,
    );
    assert.deepEqual(
      delivery.calls.map((c) => c.kind),
      ["working", "working-clear"],
    );
    assert.equal(delivery.calls.find((c) => c.kind === "working-clear")?.settlement, "idle");
  });
});

// ── Slack stays on the other side of the seam (#623) ─────────────────────────

describe("Gate imports no Slack module", () => {
  const files = readdirSync(resolve(process.cwd(), "src/gate")).filter((f) => f.endsWith(".ts"));

  for (const file of files) {
    it(`src/gate/${file} does not import from slack/`, () => {
      const src = readFileSync(resolve(process.cwd(), "src/gate", file), "utf8");
      assert.equal(
        /from ["']\.\.\/slack\//.test(src),
        false,
        `${file} still imports a Slack module`,
      );
    });
  }
});
