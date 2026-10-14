// Dispatch the existing figma-implement.yml workflow.
//
// Payload contract verified against .github/workflows/figma-implement.yml:
//   { component, notion_prd_id?, notion_prd_url?, thread_ts, channel, message_ts }
// The workflow uses message_ts for its own :gear: / :white_check_mark: reactions
// on the user's original message — we pass userMsgTs there.
//
// A designer's ask ("implement Badge") names one component and needs its
// Notion PRD — pasted, or read off a thread root that links one.

import type { Env } from "../types";
import { repositoryDispatch } from "./github-dispatch";
import type { SlackContext } from "../types";
import { extractNotionPrdFromText } from "../slack/notion-prd";
import { fetchThreadTranscript, withThreadTranscript } from "../slack/thread-transcript";

/** A DS component name: a plain PascalCase identifier (Badge, CardSurface). */
const COMPONENT_NAME = /^[A-Za-z][A-Za-z0-9]{0,49}$/;

/** What a dispatch would send, or why it is refused. */
export type ImplementPayload =
  | { ok: true; component: string; payload: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * The `client_payload` a confirmed implement sends, before the thread
 * transcript is added — pure, so the gate tests can hold the payload itself.
 *
 * Every component name is held to the identifier shape: the value flows into a
 * GitHub Actions client_payload, and a free-form value would be a CI-injection
 * vector (defence in depth alongside the workflow's env: bindings). `notes` is
 * length-capped for the same reason.
 *
 * @param input - The operation's input
 * @param slack - Where the card was approved
 */
export function implementPayload(input: Record<string, unknown>, slack: SlackContext): ImplementPayload {
  const raw = typeof input.component === "string" ? input.component.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes.slice(0, 2000) : undefined;
  const inputPrdUrl = typeof input.notion_prd_url === "string" ? input.notion_prd_url.trim() : "";
  if (!raw) return { ok: false, error: "missing 'component' in input" };
  if (!COMPONENT_NAME.test(raw)) {
    return {
      ok: false,
      error: `invalid component name '${raw}' — expected a plain DS component identifier like 'Badge' or 'CardSurface'.`,
    };
  }
  const component = raw;

  const base = {
    component,
    notes,
    thread_ts: slack.threadTs,
    channel: slack.channel,
    message_ts: slack.userMsgTs,
  };

  // A designer's implement is tied to a Notion PRD: one on the thread root, or
  // one they pasted. With neither, refuse so the bot asks for it rather than
  // implementing blind.
  const fromInput = inputPrdUrl ? extractNotionPrdFromText(inputPrdUrl) : null;
  const notionPrdId = slack.notionPrdId ?? fromInput?.id;
  const notionPrdUrl = slack.notionPrdUrl ?? fromInput?.url ?? (inputPrdUrl || undefined);
  if (!notionPrdId && !notionPrdUrl) {
    return {
      ok: false,
      error:
        "no Notion PRD found for this component change. A component implement needs its PRD — ask the designer to paste the PRD link before implementing.",
    };
  }
  // The workflow fetches the PRD's content and feeds it to Claude during code
  // generation — same behaviour v1 had via Pipedream.
  return { ok: true, component, payload: { ...base, notion_prd_id: notionPrdId, notion_prd_url: notionPrdUrl } };
}

export async function executeImplement(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const built = implementPayload(input, slack);
  if (!built.ok) return JSON.stringify({ ok: false, error: built.error });

  // Full-thread context for the runner (approved 2026-07-12): the whole
  // triggering thread, names resolved, capped + truncation-noted. Fail-open —
  // a null transcript never blocks the confirmed dispatch.
  const transcript = slack.threadTs ? await fetchThreadTranscript(env, slack.channel, slack.threadTs) : null;

  const result = await repositoryDispatch(
    env,
    "implement-figma-changes",
    withThreadTranscript(built.payload, transcript),
  );

  if (!result.ok) {
    return JSON.stringify({
      ok: false,
      status: "dispatch_failed",
      detail: `GitHub returned ${result.status}`,
    });
  }
  return JSON.stringify({
    ok: true,
    status: "dispatched",
    message: `figma-implement.yml triggered for ${built.component}. The workflow will post the draft PR link in this thread when ready.`,
  });
}
