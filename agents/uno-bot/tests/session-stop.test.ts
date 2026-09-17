// Slack's stop button: what the press comes to, on both surfaces.
//
// The press cannot be observed from here — the event subscription has to be
// pasted into the live app by hand (`apps.manifest.update` is refused on this
// app), so nothing in this repo has ever seen the button. What CAN be pinned is
// everything the handler decides once the event arrives, and that is all of it:
// the module is results-only, so each case drives a real signal through
// `resolveStop` against the in-memory ThreadState and asserts the cancel flag
// the running loop would read, the status the session settles to, and the line
// the thread gets.
//
// The two properties worth the file are the two that are easy to get wrong:
//
//   1. THE CANCEL LANDS ON THE KEY THE LOOP READS. `run-agent.ts` derives
//      `cancelThread` as the CONVERSATION key — the thread root in a channel,
//      the constant "dm" for a loose DM ask — and a flag written anywhere else
//      is a stop that silently does nothing, which is the bug `/stop` shipped
//      with (see commands.ts). So the assertions consume the flag through the
//      same `consumeCancel(ref)` the loop calls, at that key.
//   2. THE HANDLER AND THE TURN AGREE ON THE SETTLE. Both write the session
//      status, so they are made to compute it by one rule rather than raced:
//      a thread holding a live card settles `suspended` from either writer.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { resolveStop } from "../src/slack/session-stop";
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

describe("the stop button stops the run it is looking at", () => {
  it("flags the channel thread the loop reads, not the person who pressed", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // The asker's run is in this channel thread; the PRESSER has their own,
    // unrelated run elsewhere. Resolving a channel press by person would stop
    // the wrong one and leave this thread running.
    await state.setActiveRun(PRESSER, { channel: "C_OTHER", thread: "1700000000.000900" });

    await resolveStop({ channel: CHANNEL, threadTs: THREAD, userId: PRESSER }, state);

    assert.equal(await state.consumeCancel({ channel: CHANNEL, thread: THREAD }), true);
    assert.equal(
      await state.consumeCancel({ channel: "C_OTHER", thread: "1700000000.000900" }),
      false,
      "a bystander's own run elsewhere is left alone",
    );
  });

  it("flags the conversation key in a DM, which is 'dm' and not the thread", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // What a loose DM ask records: the reply thread is per-ask, the
    // conversation the loop cancels against is the constant.
    await state.setActiveRun(ASKER, { channel: DM, thread: "dm" });

    await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);

    assert.equal(await state.consumeCancel({ channel: DM, thread: "dm" }), true);
  });

  it("falls back to the DM thread when the active-run pointer knows nothing", async () => {
    const state: ThreadState = createInMemoryThreadState();
    // A hand-threaded DM whose pointer has aged out: the thread ref is the
    // remaining candidate, and it is the right one on that surface.
    await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);

    assert.equal(await state.consumeCancel({ channel: DM, thread: DM_THREAD }), true);
  });
});

describe("the session leaves the working state by the turn's own rule", () => {
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

describe("the confirmation says who stopped it", () => {
  it("names the presser, who in a channel need not be the asker", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const verdict = await resolveStop(
      { channel: CHANNEL, threadTs: THREAD, userId: PRESSER },
      state,
    );
    assert.match(verdict.text, new RegExp(`<@${PRESSER}>`));
    assert.doesNotMatch(verdict.text, new RegExp(`<@${ASKER}>`));
  });

  it("promises the step in flight finishes, because cancellation is cooperative", async () => {
    const state: ThreadState = createInMemoryThreadState();
    const verdict = await resolveStop({ channel: DM, threadTs: DM_THREAD, userId: ASKER }, state);
    assert.match(verdict.text, /finish the step I'm on/);
    assert.match(verdict.text, /already confirmed stays done/);
  });
});

// ── The subscription and the dispatcher agree ────────────────────────────────
//
// Two files that have to match, and the failure is silent in the worse
// direction: an event the app subscribes to with no `case` in the dispatcher
// arrives, logs `[slack] unhandled event type:` and is dropped. That log line
// exists to report a SLACK-SIDE SURPRISE — an event we stopped asking for that
// arrived anyway — so a subscription of our own landing in it spends the one
// signal that was supposed to mean something else.
//
// Read as text rather than imported: `events.ts` names `Env` and the Durable
// Object bindings, which this Node build has no runtime for. Parsed with a
// regex rather than a YAML dependency, for the reason `shortcuts.test.ts`
// gives — a test that needs a parser is a test people delete.
function manifestBotEvents(): string[] {
  const yaml = readFileSync(resolve(process.cwd(), "slack-app-manifest.yaml"), "utf8");
  const section = yaml.split("\n    bot_events:")[1]?.split("\n  interactivity:")[0] ?? "";
  return [...section.matchAll(/^\s+- (\S+)$/gm)].map((m) => m[1]!);
}

function dispatcherCases(): Set<string> {
  const src = readFileSync(resolve(process.cwd(), "src/slack/events.ts"), "utf8");
  return new Set([...src.matchAll(/case "([a-z_.]+)":/g)].map((m) => m[1]!));
}

// The `message.*` family all arrive as one inner event type.
const dispatchedAs = (event: string): string =>
  event.startsWith("message.") ? "message" : event;

// Subscribed on the app and deliberately unread, recorded here rather than
// left to be rediscovered: both predate this guard and both land in the
// unhandled log every time they fire. `emoji_changed` was subscribed for a
// custom-emoji feature that was never built; `reaction_removed` is the other
// half of the gate's `reaction_added` and taking a ✅ back off a card resolves
// nothing, since the claim already happened. Either is a fair thing to drop
// from the subscription list on the next hand-paste of the manifest.
const SUBSCRIBED_AND_UNREAD = new Set(["emoji_changed", "reaction_removed"]);

describe("the stop subscription reaches a handler", () => {
  it("declares agent_session_stopped on the app", () => {
    assert.ok(
      manifestBotEvents().includes("agent_session_stopped"),
      "without the subscription Slack renders no stop button at all",
    );
  });

  it("gives every subscribed event a case, or records why it has none", () => {
    const cases = dispatcherCases();
    for (const event of manifestBotEvents()) {
      if (SUBSCRIBED_AND_UNREAD.has(event)) continue;
      assert.ok(
        cases.has(dispatchedAs(event)),
        `the manifest subscribes to ${event} and the dispatcher has no case for it`,
      );
    }
  });
});
