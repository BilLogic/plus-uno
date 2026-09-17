// Slack's stop control: what the press comes to, on both surfaces.
//
// The press cannot be observed from here — the event subscription has to be
// pasted into the live app by hand (`apps.manifest.update` is refused on this
// app), so nothing in this repo has ever seen the control. What CAN be pinned
// is everything the handler decides once the event arrives, and that is all of
// it: the decision module is results-only, so each case drives a real signal
// through `resolveStop` against the in-memory ThreadState and asserts the
// cancel flag the running loop would read, the status the session settles to,
// and the line the thread gets.
//
// The properties worth the file are the ones that are easy to get wrong, and
// three of them were wrong in the first cut:
//
//   1. THE CANCEL LANDS ON THE KEYS THE LOOP READS, AND NOWHERE ELSE.
//      `run-agent.ts` derives `cancelThread` as the CONVERSATION key — the
//      thread root in a channel, the constant "dm" for a loose DM ask — so a
//      flag written anywhere else is a stop that silently does nothing, the
//      bug `/stop` shipped with. And resolving by PERSON reaches outside this
//      conversation entirely: `setActiveRun` keeps one record per person,
//      overwritten by every turn they start anywhere, so it can name a channel
//      run while the person is pressing stop in a DM.
//   2. THE HANDLER AND THE TURN AGREE ON THE SETTLE, on every ending that
//      consults the card: both compute `settledStatus` over the same live-card
//      question rather than racing two literals.
//   3. THE ADAPTER'S ORDER IS THE INVARIANT. The settle has to survive a
//      refused post and has to follow its own read with no Slack call in
//      between — neither of which any behavioural test can see, since a
//      reordered pair still typechecks and still passes everything else. So
//      the adapter is asserted at the source, the way `working-signal.test.ts`
//      already asserts `assistant.ts`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  NOTHING_UNDONE,
  STOPPING_PROMISE,
  resolveStop,
} from "../src/slack/session-stop";
import {
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadState,
} from "../src/thread-state/index";

const CHANNEL = "C1";
const THREAD = "1700000000.000100";
const DM = "D1";
const DM_THREAD = "1700000000.000200";
const ASKER = "U_ASKER";
const PRESSER = "U_PRESSER";

function cardIn(channel: string, threadTs: string, conversation: string): PendingProposal {
  return {
    toolName: "notion_create",
    input: { title: "Reflection redesign" },
    channel,
    threadTs: conversation,
    replyTs: threadTs,
    userMsgTs: "1700000000.000090",
    proposalTs: "1700000000.000095",
    proposalText: "Create a Roadmap card for the reflection redesign?",
    requesterUserId: ASKER,
  };
}

describe("the stop control stops the run it was pressed on", () => {
  it("flags the channel thread the loop reads", async () => {
    const state: ThreadState = createInMemoryThreadState();
    await resolveStop({ channel: CHANNEL, threadTs: THREAD, userId: PRESSER }, state);
    assert.equal(await state.consumeCancel({ channel: CHANNEL, thread: THREAD }), true);
  });

  it("reaches no conversation but the one the event names", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // The person pressing has their own, unrelated run somewhere else — the
    // shape that breaks person-resolution, since `setActiveRun` keeps one
    // record per person and the latest turn wins. A press here must not touch
    // it, and must not depend on it either.
    await state.setActiveRun(PRESSER, { channel: "C_OTHER", thread: "1700000000.000900" });

    await resolveStop({ channel: CHANNEL, threadTs: THREAD, userId: PRESSER }, state);

    assert.equal(await state.consumeCancel({ channel: CHANNEL, thread: THREAD }), true);
    assert.equal(
      await state.consumeCancel({ channel: "C_OTHER", thread: "1700000000.000900" }),
      false,
      "a run in another conversation is left alone",
    );
  });

  it("stops the DM whichever key its run is filed under", async () => {
    // A DM ask lives under the constant "dm" when it was typed in the composer
    // and under its own thread ts when the person threaded it by hand, and the
    // event cannot say which. Both are inside the conversation the event named,
    // so both are written.
    const state: ThreadState = createInMemoryThreadState();
    await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);

    assert.equal(await state.consumeCancel({ channel: DM, thread: "dm" }), true);
    assert.equal(await state.consumeCancel({ channel: DM, thread: DM_THREAD }), true);
  });

  it("stops a DM run when the person is also running somewhere else", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // Ask in the DM, then ask in a channel: the person's active-run pointer now
    // names the CHANNEL. Pressing stop on the DM must stop the DM and leave the
    // channel run alone — the exact sequence person-resolution got backwards.
    await state.setActiveRun(ASKER, { channel: DM, thread: "dm" });
    await state.setActiveRun(ASKER, { channel: "C_LATER", thread: "1700000000.000800" });

    await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);

    assert.equal(await state.consumeCancel({ channel: DM, thread: "dm" }), true);
    assert.equal(
      await state.consumeCancel({ channel: "C_LATER", thread: "1700000000.000800" }),
      false,
      "the channel run the pointer happened to name keeps going",
    );
  });
});

describe("the session leaves the working state by the turn's own card rule", () => {
  it("settles active when the thread holds nothing to decide", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const verdict = await resolveStop(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      state,
    );
    assert.equal(verdict.settleTo, "active");
  });

  it("settles suspended over a live card, as a finished turn would", async () => {
    const state: ThreadState = createInMemoryThreadState();
    await state.putProposal(cardIn(CHANNEL, THREAD, THREAD));

    const verdict = await resolveStop(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      state,
    );
    assert.equal(verdict.settleTo, "suspended");
    assert.match(verdict.text, /still waiting/);
  });

  it("finds a DM card filed under the 'dm' conversation key", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // Staged by a loose DM ask: conversation key "dm", reply thread its own ts.
    await state.putProposal(cardIn(DM, DM_THREAD, "dm"));

    const verdict = await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);
    assert.equal(verdict.settleTo, "suspended");
  });

  it("leaves another ask's card in the same DM out of it", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // A card staged under a DIFFERENT ask in the same DM shares the "dm"
    // conversation key. The grain is the reply thread, so stopping this ask
    // settles active and the other ask keeps its own suspension.
    await state.putProposal(cardIn(DM, "1700000000.000300", "dm"));

    const verdict = await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);
    assert.equal(verdict.settleTo, "active");
  });
});

describe("the confirmation says who stopped it, in the words the other doors use", () => {
  it("names the presser, who in a channel need not be the asker", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const verdict = await resolveStop(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      state,
    );
    assert.match(verdict.text, new RegExp(`<@${PRESSER}>`));
    assert.doesNotMatch(verdict.text, new RegExp(`<@${ASKER}>`));
  });

  it("makes the same two promises, from the same two constants", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const verdict = await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);
    assert.ok(verdict.text.includes(STOPPING_PROMISE), "the cooperative-cancel promise, verbatim");
    assert.ok(verdict.text.includes(NOTHING_UNDONE), "the not-an-undo reassurance, verbatim");
  });

  it("is the same wording the other two doors read", () => {
    // The constants are only worth having if the doors actually read them: a
    // door that re-types the sentence is how the three drifted the first time.
    for (const door of ["src/slack/commands.ts", "src/slack/interactive.ts"]) {
      const src = readFileSync(resolve(process.cwd(), door), "utf8");
      assert.match(src, /STOPPING_PROMISE/, `${door} reads the shared promise`);
      assert.match(src, /NOTHING_UNDONE/, `${door} reads the shared reassurance`);
      assert.ok(
        !src.includes("I'll finish the step I'm on"),
        `${door} keeps no second copy of the promise`,
      );
    }
  });
});

// ── The adapter's order, asserted at the source ─────────────────────────────
//
// `assistant.ts` names `Env`, so this is the same genre of check
// `working-signal.test.ts` runs against the same file: read the module and
// assert on what it does, because the properties here are ORDERINGS and a
// reordered pair typechecks, runs, and passes every behavioural test in the
// repo while leaving a session in `processing` for Slack's full hour — the
// artefact #574 removed.
describe("the stop handler settles before it speaks, and settles regardless", () => {
  const src = readFileSync(resolve(process.cwd(), "src/slack/assistant.ts"), "utf8");
  const handler = src.slice(src.indexOf("export async function handleSessionStopped"));

  it("settles with the verdict's status rather than a literal", () => {
    assert.match(handler, /setSessionStatus\(env, channel, thread_ts, verdict\.settleTo\)/);
  });

  it("catches the confirmation post, so a refused post cannot skip the settle", () => {
    assert.match(handler, /postMessage\(env, \{ channel, thread_ts, text: verdict\.text \}\)\.catch\(/);
  });

  it("puts the settle above the post, with no Slack call between read and write", () => {
    const settleAt = handler.indexOf("setSessionStatus(");
    const postAt = handler.indexOf("postMessage(");
    assert.ok(settleAt > 0 && postAt > 0, "both calls are present");
    assert.ok(
      settleAt < postAt,
      "the settle runs first: a post in between gives the in-flight turn a whole " +
        "round trip to stage a card and settle suspended, after which this lands active and wrong",
    );
  });

  it("reports the malformed-payload drop rather than returning in silence", () => {
    const guard = handler.slice(0, handler.indexOf("resolveStop("));
    assert.match(guard, /\[stop\]/, "the early return logs");
  });
});

// ── The subscription and the dispatcher agree ────────────────────────────────
//
// Two files that have to match, and the failure is silent in the worse
// direction: an event the app subscribes to with no `case` in the dispatcher
// arrives, logs `[slack] unhandled event type:` and is dropped. That log exists
// to report a SLACK-SIDE SURPRISE — an event we stopped asking for that arrived
// anyway — so a subscription of our own landing in it spends the one signal it
// was supposed to carry.
//
// ABSOLUTE, WITH NO EXEMPTION LIST. `emoji_changed` and `reaction_removed` were
// in exactly that state and are removed from the manifest instead (#576); a
// list here would have had no owner, no date, and no visibility to whoever
// edits the YAML next, and the next unhandled subscription would have been one
// `.add` away from green.
//
// Read as text rather than imported: `events.ts` names `Env` and the Durable
// Object bindings, which this Node build has no runtime for. Parsed with a
// regex rather than a YAML dependency, for the reason `shortcuts.test.ts`
// gives — a test that needs a parser is a test people delete.
function manifestBotEvents(): string[] {
  const yaml = readFileSync(resolve(process.cwd(), "slack-app-manifest.yaml"), "utf8");
  const after = yaml.split("\n    bot_events:")[1];
  assert.ok(after !== undefined, "the manifest still has a bot_events block under this anchor");
  const section = after.split("\n  interactivity:")[0];
  assert.ok(
    section !== undefined && section.length < after.length,
    "the bot_events block still ends at the interactivity anchor",
  );
  const events = [...section.matchAll(/^\s+- (\S+)$/gm)].map((m) => m[1]!);
  // The guard below is a loop over this list, so an empty or truncated parse
  // passes it VACUOUSLY — which is the silent direction this whole section
  // exists to close, reappearing one level up in the test's own plumbing.
  // Both anchors can move; neither may take the assertions with it.
  assert.ok(events.length >= 8, `parsed only ${events.length} bot_events — the anchors moved`);
  assert.ok(events.includes("app_mention"), "the parse finds a known subscription");
  return events;
}

function dispatcherCases(): Set<string> {
  const src = readFileSync(resolve(process.cwd(), "src/slack/events.ts"), "utf8");
  const cases = new Set([...src.matchAll(/case "([a-z_.]+)":/g)].map((m) => m[1]!));
  assert.ok(cases.has("message"), "the parse finds a known dispatcher case");
  return cases;
}

// The `message.*` family all arrive as one inner event type.
const dispatchedAs = (event: string): string => (event.startsWith("message.") ? "message" : event);

describe("every subscription reaches a handler", () => {
  it("declares agent_session_stopped on the app", () => {
    assert.ok(
      manifestBotEvents().includes("agent_session_stopped"),
      "without the subscription Slack offers no stop control at all",
    );
  });

  it("gives every subscribed event a case in the dispatcher", () => {
    const cases = dispatcherCases();
    for (const event of manifestBotEvents()) {
      assert.ok(
        cases.has(dispatchedAs(event)),
        `the manifest subscribes to ${event} and the dispatcher has no case for it`,
      );
    }
  });

});
