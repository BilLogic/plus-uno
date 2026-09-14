// The one proposal card that needs a network read to render: `prototype_scaffold`
// embeds a Figma preview screenshot.
//
// It lived in `proposal-render.ts` and was the only reason that module imported
// `Env` and the Figma client — which kept every other card body out of the Node
// test build and out of the Turn module. Split out, `proposal-render.ts` is
// import-free and Turn builds the ordinary cards itself; this one arrives as a
// named client on `TurnDeps.cards`.

import type { Env } from "../types";
import { parseFigmaUrl, fetchFigmaImagePngUrl } from "../integrations/figma";
import {
  CONFIRM_FOOTER,
  formatProposal,
  proposalActionBlocks,
  proposalVerb,
  renderParamsForHumans,
} from "./proposal-render";

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
