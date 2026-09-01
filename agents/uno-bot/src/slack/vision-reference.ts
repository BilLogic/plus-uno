import type { SlackEventFile } from "./types";
import { parseFigmaUrl } from "../integrations/figma-reading";

/**
 * The first Figma frame link in a message — Slack wraps links as `<url>` or
 * `<url|label>`, so the candidate pattern stops at those delimiters and
 * `parseFigmaUrl` decides.
 *
 * ONE recognizer, used by the render path and by the reference stored for the
 * follow-up. They had two: vision.ts asked `parseFigmaUrl`, and this module
 * asked a regex for the substrings `figma.com` and `node-id=`. Everything the
 * regex accepted and the parser refused — a `/board/` FigJam link, a `node-id`
 * in the fragment rather than the query, an uppercase `Node-Id` — was stored
 * as a reference the next turn could never render, and made `carriesFiles`
 * true, which costs the turn its trivial-turn shortcut for an image that
 * cannot exist.
 */
export function firstFigmaFrameUrl(text: string): string | undefined {
  return (text.match(/https?:\/\/[^\s<>|]+/g) ?? []).find((u) => parseFigmaUrl(u));
}

export interface VisionReference {
  files?: SlackEventFile[];
  figmaUrl?: string;
}

interface VisionHistoryTurn {
  role: "user" | "assistant";
  content: string;
  ts?: string;
  vision?: VisionReference;
}

export function visionReferenceFor(
  text: string,
  files: SlackEventFile[] | undefined,
): VisionReference | undefined {
  const imageFiles = (files ?? []).filter(
    (file) => file.mimetype?.startsWith("image/") && Boolean(file.url_private),
  );
  const figmaUrl = firstFigmaFrameUrl(text);
  if (!imageFiles.length && !figmaUrl) return undefined;
  return {
    ...(imageFiles.length ? { files: imageFiles } : {}),
    ...(figmaUrl ? { figmaUrl } : {}),
  };
}

export function historyVisionTurn(
  text: string,
  files: SlackEventFile[] | undefined,
): { content: string; vision?: VisionReference } | null {
  const content = text.trim();
  const vision = visionReferenceFor(content, files);
  if (!content && !vision) return null;
  const imageName = vision?.files?.[0]?.name?.trim();
  return {
    content: content || `[image attached${imageName ? `: ${imageName}` : ""}]`,
    ...(vision ? { vision } : {}),
  };
}

export function selectPreviousVisionReference(
  history: VisionHistoryTurn[],
  currentHasImages: boolean,
): { turnTs: string; reference: VisionReference } | null {
  if (currentHasImages) return null;
  const previousUser = [...history].reverse().find((turn) => turn.role === "user");
  if (!previousUser?.vision || !previousUser.ts) return null;
  return { turnTs: previousUser.ts, reference: previousUser.vision };
}
