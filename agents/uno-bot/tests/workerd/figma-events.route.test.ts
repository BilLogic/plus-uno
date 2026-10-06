// POST /figma/events through the Worker's own fetch handler, on real KV and the
// real AgentRunner storage (#895; #891 § Seam 3).
//
// Why this one pays for workerd: what is under test is the Worker's entry —
// `src/index.ts`, which Node cannot load — routing to the route, the claim the
// AgentRunner makes under its input gate, and KV's own handling of the notes.
// The route's every branch is tests/figma-events.test.ts, on fakes; this file
// is the three acceptance cases against the real bindings.
//
// The job's own entry is gone as soon as the runner's alarm has run it, so a
// queued job is read off its claim: the `seen:` mark the runner keeps for two
// days, one per event.
import { createExecutionContext, env, runInDurableObject, waitOnExecutionContext } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import worker from "../../src/index";
import type { Env } from "../../src/types";

// `cloudflare:test`'s env is the wrangler config's bindings, plus the
// passcode vitest.workerd.config.mts sets for this file.
const workerEnv = env as unknown as Env;
const PASSCODE = "workerd-test-passcode";

const comment = (id: string, passcode = PASSCODE) => ({
  event_type: "FILE_COMMENT",
  passcode,
  timestamp: "2026-10-03T16:00:00Z",
  webhook_id: "3301",
  file_key: `FILE${id}`,
  file_name: "Goal Setting / Card 2482 / Meryem",
  comment: [{ text: "Keep the progress bar hidden" }],
  comment_id: id,
  parent_id: "",
  created_at: "2026-10-03T16:00:00Z",
  resolved_at: "",
  mentions: [],
  triggered_by: { id: "1500001", handle: "sarah" },
});

async function deliver(body: unknown): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(
    new Request("https://uno-bot.test/figma/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    workerEnv,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
}

/** The events the figma/events runner has claimed. */
async function claimed(): Promise<string[]> {
  const stub = workerEnv.AGENT_RUNNER.get(workerEnv.AGENT_RUNNER.idFromName("figma/events"));
  return runInDurableObject(stub, async (_instance: unknown, state: DurableObjectState) => [
    ...(await state.storage.list({ prefix: "seen:" })).keys(),
  ]);
}

describe("POST /figma/events, through the Worker", () => {
  it("answers a wrong passcode 401, and queues and writes nothing", async () => {
    const res = await deliver(comment("9100001", "not-it"));
    expect(res.status).toBe(401);
    expect(await claimed()).not.toContain("seen:comment:9100001");
    expect(await workerEnv.HARNESS_KV!.get("figma-notify:commented:2026-10-03:FILE9100001")).toBeNull();
  });

  it("queues a new event once and writes its note; a redelivery is 200 and does nothing", async () => {
    const first = await deliver(comment("9100002"));
    expect(first.status).toBe(200);
    expect((await claimed()).filter((k) => k === "seen:comment:9100002")).toHaveLength(1);
    const key = "figma-notify:commented:2026-10-03:FILE9100002";
    expect(await workerEnv.HARNESS_KV!.get(key, "json")).toEqual({ at: "2026-10-03T16:00:00Z" });

    // Remove the note, so a redelivery that wrote again would show.
    await workerEnv.HARNESS_KV!.delete(key);
    const again = await deliver(comment("9100002"));
    expect(again.status).toBe(200);
    expect((await claimed()).filter((k) => k === "seen:comment:9100002")).toHaveLength(1);
    expect(await workerEnv.HARNESS_KV!.get(key)).toBeNull();
  });
});
