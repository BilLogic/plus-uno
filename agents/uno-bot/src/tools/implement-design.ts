// Dispatch the figma-implement-design.yml workflow — scaffolds a NEW playground
// prototype from a Figma frame. Sibling of tools/implement.ts (which updates an
// existing DS-library component).
//
// Runs only at confirm-time via the proposal gate (resolve-proposal.ts), so the
// SlackContext here carries channel/threadTs/userMsgTs. The PRD link travels in
// the tool INPUT (notion_prd_url), not the slack context — so it survives the
// stage→confirm round-trip inside pending.input.
//
// Payload contract — mirrors implement.ts plus the Figma fields. Verified
// against .github/workflows/figma-implement-design.yml (Phase 5):
//   { figma_url, file_key, node_id, slug?, notion_prd_id?, notion_prd_url,
//     notes?, thread_ts, channel, message_ts }

import type { Env } from "../types";
import { repositoryDispatch } from "./github-dispatch";
import type { SlackContext } from "./dispatcher";
import { parseFigmaUrl } from "../integrations/figma";
import { extractNotionPrdFromText } from "../slack/notion-prd";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;

export async function executeImplementDesign(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const figmaUrl = typeof input.figma_url === "string" ? input.figma_url.trim() : "";
  const notionPrdUrl = typeof input.notion_prd_url === "string" ? input.notion_prd_url.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes : undefined;
  const rawSlug = typeof input.slug === "string" ? input.slug.trim() : "";

  if (!figmaUrl) {
    return JSON.stringify({ ok: false, error: "missing 'figma_url' in input" });
  }
  // notion_prd_url is OPTIONAL. The bot asks for a PRD, but if the designer
  // doesn't have one they can skip it and build straight from the Figma frame.
  // When provided, we forward it so the Action gives Claude PRD context.

  const parts = parseFigmaUrl(figmaUrl);
  if (!parts) {
    return JSON.stringify({
      ok: false,
      error: `could not parse Figma URL '${figmaUrl}' — expected a figma.com/design or /file link with a node-id`,
    });
  }

  if (rawSlug && !SLUG_RE.test(rawSlug)) {
    return JSON.stringify({
      ok: false,
      error: `invalid slug '${rawSlug}' — must be kebab-case matching ${SLUG_RE.source}`,
    });
  }

  // Extract the 32-char page id so the Action can fetch the PRD the same way
  // figma-implement.yml does. Falls back to forwarding just the URL if the link
  // shape doesn't expose an id (e.g. a notion.site vanity URL).
  const prd = extractNotionPrdFromText(notionPrdUrl);

  const result = await repositoryDispatch(env, "implement-design-from-figma", {
    figma_url: figmaUrl,
    file_key: parts.fileKey,
    node_id: parts.nodeId,
    slug: rawSlug || undefined,
    notion_prd_id: prd?.id,
    notion_prd_url: prd?.url ?? (notionPrdUrl || undefined),
    notes,
    thread_ts: slack.threadTs,
    channel: slack.channel,
    message_ts: slack.userMsgTs,
  });

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
    message: `figma-implement-design.yml triggered${rawSlug ? ` for playground/${rawSlug}/` : ""}. The workflow will scaffold the prototype and post the draft PR link in this thread when ready.`,
  });
}
