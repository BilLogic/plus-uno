// figma_dev_links executor — a Dev Mode links card's one operation, past its
// Review's Approve: the card's links that are still missing go into Figma
// (and a Code link under its old name is renamed), with one labelled comment
// the first time a component gets its links. A batch card's write that is
// more than this press can hold carries on as a runner job
// (`figma-links/env.ts` `runDevLinksWriteJobOnEnv`). What it decides is
// `figma-links/run.ts` (`approveDevLinks`); this file only binds `Env`.

import type { Env, SlackContext } from "../types";
import type { RunnerJobPayload } from "../slack/types";
import { figmaClientFor } from "../figma/production";
import { approveDevLinks } from "../figma-links/run";
import { budgetHeadroom, charge, rethrowIfBudget } from "../net";

/** The AgentRunner that carries approved writes on: their own, so a write
 *  waiting for a fresh budget never holds up a thread's turns. */
const DEV_LINKS_RUNNER = "figma-dev-links";

/** Subrequests Approve leaves for the rest of its press: the settle, the
 *  history note, the proposal events, the card's redraw and the hand-off. */
const APPROVE_RESERVE = 12;
/** Figma calls Approve makes at most: Tier 2 bursts about this many before
 *  pacing, and the press runs inside Slack's waitUntil. */
const APPROVE_CALLS = 8;

/** Approve on a Dev Mode links card, on `Env`. */
export async function executeDevLinks(env: Env, input: Record<string, unknown>, slack: SlackContext): Promise<string> {
  const figma = figmaClientFor(env);
  if (!figma) return JSON.stringify({ ok: false, error: "FIGMA_ACCESS_TOKEN not set — no links added" });
  try {
    return await approveDevLinks(
      {
        figma,
        calls: Math.min(APPROVE_CALLS, budgetHeadroom().subrequests - APPROVE_RESERVE),
        async handOff(job) {
          const stub = env.AGENT_RUNNER.get(env.AGENT_RUNNER.idFromName(DEV_LINKS_RUNNER));
          charge(1, "agent-runner"); // DO stub call — a subrequest the meter can't see.
          const payload: RunnerJobPayload = job;
          const res = await stub.fetch("https://do/enqueue", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ job: payload, enqueuedAt: Date.now() }),
          });
          if (!res.ok) throw new Error(`the runner refused it (${res.status})`);
        },
        now: () => Date.now(),
      },
      input,
      { channel: slack.channel, ...(slack.replyTs ? { replyTs: slack.replyTs } : {}), ...(slack.threadTs ? { threadTs: slack.threadTs } : {}) },
    );
  } catch (err) {
    rethrowIfBudget(err);
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
