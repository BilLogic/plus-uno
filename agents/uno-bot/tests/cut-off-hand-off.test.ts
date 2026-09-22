// The Worker's half of the alarm's look: the hand-off the ThreadState alarm is
// built with, and the AgentRunner job it enqueues.
//
// Both are bound to `Env`, so they are driven here on a stubbed one — an
// AgentRunner namespace whose enqueue answers as the test says, and a
// ThreadState namespace that records what it was asked. What the job then does
// with a take is `tellCutOffRun`, driven on its own in `cut-off-run.test.ts`.
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { handOffCutOffRunsFor, onRunnerJob } from "../src/slack/events";
import type { Execution, PendingProposal } from "../src/thread-state/index";
import type { Env } from "../src/types";

const PROPOSAL: PendingProposal = {
  toolName: "notion_create",
  input: { title: "One" },
  channel: "C1",
  threadTs: "1700.1",
  userMsgTs: "1700.0",
  proposalTs: "1700.2",
  proposalText: "Create the card?",
  requesterUserId: "U1",
};

const execution = (proposalTs: string): Execution => ({
  proposal: { ...PROPOSAL, proposalTs },
  startedAt: 0,
  settled: [],
});

interface Enqueued {
  threadKey: string;
  job: unknown;
}

/** An `Env` with an AgentRunner namespace that records each enqueue and
 *  answers with `answer(threadKey)`, and a ThreadState namespace that records
 *  each take and finds nothing to take. */
function stubEnv(answer: (threadKey: string) => Response | Error) {
  const enqueued: Enqueued[] = [];
  const takes: string[] = [];
  const env = {
    AGENT_RUNNER: {
      idFromName: (name: string) => name,
      get: (threadKey: string) => ({
        async fetch(_url: string, init: { body: string }) {
          const result = answer(threadKey);
          if (result instanceof Error) throw result;
          enqueued.push({ threadKey, job: (JSON.parse(init.body) as { job: unknown }).job });
          return result;
        },
      }),
    },
    THREAD_STATE: {
      idFromName: (name: string) => name,
      get: () => ({
        async takeCutOffExecution(proposalTs: string) {
          takes.push(proposalTs);
          return null;
        },
      }),
    },
  } as unknown as Env;
  return { env, enqueued, takes };
}

// Nothing here may reach Slack: a failed cut-off enqueue has nobody to tell.
let slackCalls: string[] = [];
const realFetch = globalThis.fetch;
beforeEach(() => {
  slackCalls = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    slackCalls.push(String(input instanceof Request ? input.url : input));
    return new Response(JSON.stringify({ ok: true }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("the ThreadState alarm's hand-off", () => {
  it("enqueues one cut-off job per run, keyed on its card", async () => {
    const { env, enqueued } = stubEnv(() => new Response(null, { status: 202 }));
    await handOffCutOffRunsFor(env)([execution("1700.2"), execution("1700.3")]);
    assert.deepEqual(enqueued, [
      { threadKey: "C1:1700.2", job: { kind: "cut-off", proposalTs: "1700.2" } },
      { threadKey: "C1:1700.3", job: { kind: "cut-off", proposalTs: "1700.3" } },
    ]);
  });

  it("one enqueue that throws does not keep the rest from their runners", async () => {
    const { env, enqueued } = stubEnv((key) =>
      key === "C1:1700.2" ? new Error("stub unavailable") : new Response(null, { status: 202 }),
    );
    await handOffCutOffRunsFor(env)([execution("1700.2"), execution("1700.3")]);
    assert.deepEqual(enqueued.map((e) => e.threadKey), ["C1:1700.3"]);
  });

  it("a refused cut-off enqueue posts nothing: the alarm hands it over again", async () => {
    const { env } = stubEnv(() => new Response(null, { status: 500 }));
    await handOffCutOffRunsFor(env)([execution("1700.2")]);
    assert.deepEqual(slackCalls, []);
  });
});

describe("the AgentRunner's cut-off job", () => {
  it("takes the run through ThreadState, and is handled when there is nothing to tell", async () => {
    const { env, takes } = stubEnv(() => new Response(null, { status: 202 }));
    assert.equal(await onRunnerJob(env, { kind: "cut-off", proposalTs: "1700.2" }), "handled");
    assert.deepEqual(takes, ["1700.2"]);
    assert.deepEqual(slackCalls, []);
  });
});
