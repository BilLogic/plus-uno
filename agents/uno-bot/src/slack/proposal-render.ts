// Proposal-card presentation: turn a staged side-effect tool call into the
// ⚠️ confirmation card the requester sees. Cards are read by designers, not
// machines — parameters render as labeled `•` bullets, never raw JSON (user
// decision, 2026-07-12). The executable input lives in the DO's pending state;
// this text is display-only. (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import { parseFigmaUrl, fetchFigmaImagePngUrl } from "../integrations/figma";
import { collectStrings } from "../agent/preflight";
import { textSections } from "./delivery";

// One shared confirmation footer on every card. Anyone in the thread may
// confirm/cancel (the requester lock was removed 2026-07-14), so it names no
// approver. It names the two gestures and nothing else — no "or just say go
// ahead": the buttons and reactions are the clear path, and anything typed
// goes to the model, which reads it in context (2026-08-22).
export const CONFIRM_FOOTER =
  `:white_check_mark: to approve · :no_entry: to cancel (then tell me what to change).`;

/**
 * The Approve / Cancel button row.
 *
 * STYLING, and what Slack actually allows. Block Kit gives a button exactly
 * three looks — `style: "primary"` (filled green), `style: "danger"` (filled
 * red), and no `style` at all (the quiet default outline). There is no tonal
 * variant, no custom colour, no border control. Emoji in the label is the only
 * other dial.
 *
 * The first cut used filled + emoji on BOTH buttons, which read as shouting:
 * colour and glyph each carried the whole message, so the row said everything
 * twice in two saturated blocks side by side.
 *
 * Now: one accent, one quiet. Approve is the filled primary because it is the
 * action being asked for; Cancel is the default outline. Labels are words
 * only — the fill already says which is which.
 *
 * Cancel is deliberately NOT `danger`. Red marks the dangerous choice, and
 * here that is backwards: Cancel is the safe way out, and *Approve* fires the
 * irreversible write. A red Cancel codes the safe action as the risky one.
 *
 * The handler in slack/interactive.ts resolves the card the button sits on, so
 * the buttons carry no payload — the message ts is the identity, as with a
 * reaction.
 */
export function proposalActionBlocks(): unknown[] {
  return [
    {
      type: "actions",
      block_id: "uno_proposal_actions",
      elements: [
        {
          type: "button",
          action_id: "uno_proposal_confirm",
          style: "primary",
          text: { type: "plain_text", text: "Approve" },
          value: "confirm",
        },
        {
          type: "button",
          action_id: "uno_proposal_cancel",
          text: { type: "plain_text", text: "Cancel" },
          value: "cancel",
        },
      ],
    },
  ];
}

/** A text-only card as blocks: the text in ≤3000-char sections, then the
 *  button row. Used at post time and again by the button handler to re-render
 *  the card once it is resolved (buttons off, outcome on). */
export function proposalCardBlocks(text: string, resolvedNote?: string): unknown[] {
  const blocks: unknown[] = [...textSections(text)];
  if (resolvedNote) {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: resolvedNote }] });
  } else {
    blocks.push(...proposalActionBlocks());
  }
  return blocks;
}

export function formatProposal(
  toolName: string,
  input: Record<string, unknown>,
  // Kept in the signature for callers that still pass it (the id is stored on the
  // proposal for the record) — no longer rendered, since anyone can confirm.
  _requesterUserId: string,
  previewText: string | undefined,
  // Optional resolved-target line (e.g. "• *Target:* «title» — in «DB»") shown
  // above the raw params, so the approver of a write sees the CONCRETE page it
  // will touch, not just an opaque id. Used for notion_archive.
  targetNote?: string,
): string {
  const body = renderParamsForHumans(input);
  const lines: string[] = [];
  if (previewText) {
    lines.push(previewText, "");
  }
  lines.push(`:warning: About to *${proposalVerb(toolName)}*:`);
  if (targetNote) lines.push(targetNote);
  lines.push(body);
  if (toolName === "shareout_post") {
    const audit = shareoutBundleNote(input);
    if (audit) lines.push(audit);
  }
  if (toolName === "prototype_scaffold") {
    // Missing-context gate, made visible at confirm time (todo 070): the model
    // is told to name a brief's open questions before staging, but does so
    // inconsistently. If neither the preview nor the notes mention any gap,
    // say so ON the card — the ✅ then knowingly accepts a gap-free reading of
    // the brief instead of silently inheriting one.
    const staged = `${previewText ?? ""} ${typeof input.notes === "string" ? input.notes : ""}`.toLowerCase();
    if (!/(open question|gap|ambiguit|unspecified|undecided|to confirm|tbd)/.test(staged)) {
      lines.push(
        ":mag: *No open questions were named for this brief.* If the PRD leaves anything ambiguous (states, interactions, semantics), cancel and ask — confirming builds it as-is.",
      );
    }
  }
  lines.push(CONFIRM_FOOTER);
  return lines.join("\n");
}

// "Stage, but flag gaps loudly" (Bill, 2026-07-16): a share-out stages
// immediately with whatever is in hand, and the CARD carries the bundle audit —
// so ✅ is informed consent to post without the missing pieces, and a weaker
// model lane can't silently skip the disclosure (renderer-level, not
// prompt-level). Bundle contract for prototype share-outs: Loom walkthrough +
// live preview + Decisions DB link (skills/uno-publish/references/method.md).
function shareoutBundleNote(input: Record<string, unknown>): string | null {
  const summary = typeof input.summary === "string" ? input.summary : "";
  if (!/prototype|prototypes|scaffold/i.test(summary)) return null;
  const haystack = collectStrings(input).join("\n");
  const missing: string[] = [];
  if (!/https?:\/\/[^\s]*loom\.com/i.test(haystack)) missing.push("Loom walkthrough");
  if (!/https?:\/\/[^\s]*(netlify\.app|workers\.dev)/i.test(haystack)) missing.push("live preview");
  if (!/https?:\/\/[^\s]*(notion\.so|notion\.site|app\.notion\.com)/i.test(haystack)) {
    missing.push("Decisions DB link");
  }
  if (missing.length === 0) return null;
  return (
    `:rotating_light: *Bundle incomplete — missing: ${missing.join(" · ")}.*\n` +
    `:white_check_mark: posts *without* them — or drop the links in this thread first and I'll fold them in.`
  );
}

// notion_update gets its OWN conversational card (no ⚠️ preamble): a warm lead,
// a named + linked card line, and a `current → new` diff — all built by the
// caller (events.ts), which has the Notion reads. This just frames the lead +
// body with the shared footer. `body` is the linked-card line + diff bullets.
export function formatNotionUpdateProposal(
  previewText: string | undefined,
  body: string,
): string {
  const lines: string[] = [];
  if (previewText) lines.push(previewText, "");
  if (body) lines.push(body);
  lines.push(CONFIRM_FOOTER);
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
    text: { type: "mrkdwn", text: CONFIRM_FOOTER },
  });
  blocks.push(...proposalActionBlocks());
  return { text, blocks };
}
