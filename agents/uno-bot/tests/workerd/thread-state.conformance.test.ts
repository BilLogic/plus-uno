// The conformance suite, run against the DURABLE OBJECT adapter under workerd.
//
// Same suite, same source file, same assertions as the in-memory run
// (tests/thread-state-in-memory.test.ts) — only the factory differs. That is
// the claim the whole module rests on: the in-memory fake the loop, Turn and
// Gate will be tested against answers exactly as the production store does, and
// this is the run that would catch it if it stopped.
//
// Why this one file pays for workerd: what is under test here is real Durable
// Object RPC, real SQLite storage and the real input gate. `claimProposal`
// returning true exactly once across eight concurrent claims is a property of
// that gate, and no amount of mocking is evidence about it.
//
// Each test gets its own Durable Object instance (`instance:` below) so the
// suite's "a FRESH, empty store per test" contract holds against durable
// storage. The adapter's production keying — one global `idFromName("uno-bot")`
// instance — is what runs when nobody passes it.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { internalSubrequestsUsed, runMetered } from "../../src/net";
import { createDurableObjectThreadState } from "../../src/thread-state/durable-object";
import { runThreadStateConformance } from "../helpers/thread-state-conformance";

// `cloudflare:test`'s env is the wrangler config's bindings; the namespace is
// typed by the adapter's own deps, so this cast is the only untyped step.
const namespace = (env as { THREAD_STATE: Parameters<typeof createDurableObjectThreadState>[0]["namespace"] })
  .THREAD_STATE;

let instanceCounter = 0;

runThreadStateConformance(
  "durable-object",
  (deps) =>
    createDurableObjectThreadState({
      ...deps,
      namespace,
      instance: `conformance-${instanceCounter++}`,
    }),
  { it: (name, fn) => it(name, fn) },
);

// ADR-022, at the only place a stub call happens. The old client charged one
// subrequest per hop inside `call()`; the adapter charges one per hop inside
// `hop()`, and this is the test that says so — a hop that stopped being charged
// would make the budget gate report headroom the invocation does not have,
// which is the 👀-then-silence failure.
describe("[durable-object] the subrequest charge", () => {
  it("charges the internal counter exactly once per hop", async () => {
    const store = createDurableObjectThreadState({
      namespace,
      instance: `charge-${instanceCounter++}`,
    });

    const spent = await runMetered(async () => {
      const before = internalSubrequestsUsed();
      await store.appendHistory({ channel: "C1", thread: "1700.1" }, {
        role: "user",
        content: "one",
      });
      return internalSubrequestsUsed() - before;
    });
    expect(spent).toBe(1);
  });

  it("charges every hop, so three calls cost three", async () => {
    const store = createDurableObjectThreadState({
      namespace,
      instance: `charge-${instanceCounter++}`,
    });

    const spent = await runMetered(async () => {
      const ref = { channel: "C1", thread: "1700.1" };
      await store.readHistory(ref);
      await store.requestCancel(ref);
      await store.consumeCancel(ref);
      return internalSubrequestsUsed();
    });
    expect(spent).toBe(3);
  });
});
