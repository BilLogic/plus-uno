// The app's Slack subscriptions, against the dispatcher that has to handle them.
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
// IT LIVED IN `session-stop.test.ts` while `agent_session_stopped` was the
// newest subscription and the one at risk. It is not a claim about the stop
// control — it is a claim about every subscription — and that file is now a
// behavioural suite that drives the three stop doors, with nothing left in it
// that reads source (#593). So the check moved rather than being deleted.
//
// Read as text rather than imported: `events.ts` names `Env` and the Durable
// Object bindings, which this Node build has no runtime for. Parsed with a
// regex rather than a YAML dependency, for the reason `shortcuts.test.ts`
// gives — a test that needs a parser is a test people delete.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
