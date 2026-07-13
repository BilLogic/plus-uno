// Proposal-card presentation: turn a staged side-effect tool call into the
// ⚠️ confirmation card the requester sees. Cards are read by designers, not
// machines — parameters render as labeled `•` bullets, never raw JSON (user
// decision, 2026-07-12). The executable input lives in the DO's pending state;
// this text is display-only. (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import { parseFigmaUrl, fetchFigmaImagePngUrl } from "../integrations/figma";

export function formatProposal(
  toolName: string,
  input: Record<string, unknown>,
  requesterUserId: string,
  previewText: string | undefined,
  // Optional resolved-target line (e.g. "• *Target:* «title» — in «DB»") shown
  // above the raw params, so the approver of a write sees the CONCRETE page it
  // will touch, not just an opaque id. Used for notion_update / notion_archive.
  targetNote?: string,
): string {
  const body = renderParamsForHumans(input);
  const lines: string[] = [];
  if (previewText) {
    lines.push(previewText, "");
  }
  lines.push(`:warning: About to *${proposalVerb(toolName)}*:`);
  if (targetNote) lines.push(targetNote);
  lines.push(
    body,
    `React :white_check_mark: / :x: or just say "go ahead" / "cancel" — only <@${requesterUserId}> can confirm.`,
  );
  return lines.join("\n");
}

function renderParamsForHumans(input: Record<string, unknown>): string {
  const entries = Object.entries(input).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!entries.length) return "• _(no parameters)_";
  return entries.map(([k, v]) => renderParamEntry(k, v, "")).join("\n");
}

function renderParamEntry(key: string, value: unknown, indent: string): string {
  const label = `${indent}• *${humanizeParamKey(key)}:*`;
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return [label, ...value.map((item) => `${indent}    ◦ ${String(item)}`)].join("\n");
    }
    return [
      label,
      ...value.map((item) =>
        typeof item === "object" && item !== null
          ? Object.entries(item as Record<string, unknown>)
              .map(([k, v]) => renderParamEntry(k, v, indent + "    "))
              .join("\n")
          : `${indent}    ◦ ${String(item)}`,
      ),
    ].join("\n");
  }
  if (typeof value === "object" && value !== null) {
    return [
      label,
      ...Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        renderParamEntry(k, v, indent + "    "),
      ),
    ].join("\n");
  }
  return `${label} ${String(value)}`;
}

function humanizeParamKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\burl\b/gi, "link")
    .replace(/\bnotion prd\b/gi, "PRD")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function proposalVerb(toolName: string): string {
  switch (toolName) {
    case "component_implement": return "implement this component";
    case "prototype_scaffold": return "scaffold a new prototype from this Figma design";
    case "notion_create": return "create this card in Notion";
    case "notion_update": return "update this Notion page";
    case "notion_archive": return "archive this Notion card";
    case "shareout_post": return "share this for feedback in #plus-design-feedback";
    case "email_send": return "send an email via Gmail";
    default: return toolName;
  }
}

// Build a richer proposal for implement_design: the same plaintext as
// formatProposal (used as the Slack notification fallback AND stored in
// pending.proposalText), plus Slack blocks that embed a Figma preview
// screenshot when one can be fetched. The image fetch is best-effort — if it
// returns null we omit blocks entirely and the proposal posts as plain text,
// identical to every other tool.
export async function buildImplementDesignProposal(
  env: Env,
  input: Record<string, unknown>,
  requesterUserId: string,
  previewText: string | undefined,
): Promise<{ text: string; blocks?: unknown[] }> {
  const text = formatProposal("prototype_scaffold", input, requesterUserId, previewText);

  const figmaUrl = typeof input.figma_url === "string" ? input.figma_url : "";
  const parts = figmaUrl ? parseFigmaUrl(figmaUrl) : null;
  const imageUrl = parts
    ? await fetchFigmaImagePngUrl(env, parts.fileKey, parts.nodeId, 1)
    : null;
  if (!imageUrl) return { text };

  const params = renderParamsForHumans(input);
  const blocks: unknown[] = [];
  if (previewText) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: previewText } });
  }
  blocks.push({
    type: "image",
    image_url: imageUrl,
    alt_text: "Figma preview of the design to implement",
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `:warning: About to *${proposalVerb("prototype_scaffold")}*:\n${params}`,
    },
  });
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `React :white_check_mark: / :x: or just say "go ahead" / "cancel" — only <@${requesterUserId}> can confirm.`,
    },
  });
  return { text, blocks };
}
