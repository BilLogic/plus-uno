// The Slack envelope for the alarm's look at a cut-off run: `Env` becomes the
// named dependencies `gate/cut-off-sweep.ts` takes, and `tellCutOffRun` does
// the rest — the take, the note and the re-staged card every look shares.
//
// Two halves, because the alarm that finds the run is not where it is told.
// The ThreadState alarm hands each record over (`handOffCutOffRunsFor`, bound
// by the Worker entry that exports the class), and the hand-off enqueues a job
// on the card's AgentRunner. The runner's alarm is a Worker invocation of its
// own: a fresh subrequest budget, and a ThreadState stub that is not a call
// from the Durable Object back into itself.
//
// `Env` enters here and stops here.

import type { Env } from "../types";
import { tellCutOffRun } from "../gate/index";
import type { Execution } from "../thread-state/index";
import { threadStateFor } from "../thread-state/production";
import { restageFor } from "../turn/env-deps";
import { slackDelivery } from "./slack-delivery";
import type { RunnerJobPayload } from "./types";

/** The AgentRunner job for one cut-off run, keyed as a reaction on the card
 *  is — so the alarm's look and a ✅ on the stuck card take turns. */
export function cutOffRunJob(execution: Execution): { job: RunnerJobPayload; threadKey: string } {
  const { channel, proposalTs } = execution.proposal;
  return { job: { kind: "cut-off", proposalTs }, threadKey: `${channel}:${proposalTs}` };
}

/** What the runner's alarm does with that job. */
export async function handleCutOffRun(env: Env, proposalTs: string): Promise<void> {
  const threadState = threadStateFor(env);
  const outcome = await tellCutOffRun(proposalTs, {
    threadState,
    delivery: (target) => slackDelivery(env, target),
    restage: restageFor(env, threadState),
  });
  console.log(`[gate] cut-off sweep on ${proposalTs}: ${outcome}`);
}
