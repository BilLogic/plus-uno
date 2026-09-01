import type { SlackEventFile } from "./types";

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
  const figmaUrl = (text.match(/https?:\/\/[^\s<>|]+figma\.com[^\s<>|]*node-id=[^\s<>|]+/i) ?? [])[0];
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
