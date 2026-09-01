// Vision input (2026-07-09): Slack-pasted images + Figma frame screenshots are
// attached as base64 image blocks so the model can actually see them. The
// immediately previous user image is re-fetched for one follow-up and remains
// anchored to its original turn. Everything here is best-effort — any failure
// degrades to text-only and must never break the reply. Base64 is NEVER
// persisted to Durable Object history; only re-fetchable pointers are stored.
// (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import type { AgentImage } from "../agent/loop-shared";
import type { SlackEventFile, SlackMessageEvent } from "./types";
import type { HistoryTurn } from "../thread-state-client";
import type { HistoricalImages } from "../agent/provider-conversation";
import { parseFigmaUrl, fetchFigmaImagePngUrl } from "../integrations/figma";
import { countedFetch } from "../net";
import {
  selectPreviousVisionReference,
  visionReferenceFor,
  type VisionReference,
} from "./vision-reference";

const MAX_IMAGE_ATTACHMENTS = 3;
const MAX_IMAGE_BYTES = Math.floor(3.5 * 1024 * 1024); // Anthropic per-image limit is ~5MB; stay well under
const IMAGE_FETCH_TIMEOUT_MS = 10_000;
// The Anthropic API only accepts these four image media types — anything else
// (svg, tiff, heic…) would 400 the whole request, so it's skipped like oversize.
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export interface VisionInputs {
  /** Base64 image blocks for the current turn (Slack files first, then the Figma frame). */
  images: AgentImage[];
  /** userText + model-visible notes (omitted files, figma fetch failure). */
  modelText: string;
  /** userText + plain-text markers for the stored history (no base64 ever). */
  historyText: string;
  /** Rehydrated image blocks anchored to the immediately previous user turn. */
  historicalImages?: HistoricalImages;
  /** Small pointers persisted for the next turn; never base64. */
  reference?: VisionReference;
}

export async function collectVisionInputs(
  env: Env,
  event: SlackMessageEvent,
  userText: string,
  history: HistoryTurn[] = [],
): Promise<VisionInputs> {
  const images: AgentImage[] = [];
  const modelNotes: string[] = [];
  const historyMarkers: string[] = [];
  const reference = visionReferenceFor(userText, event.files);
  let historicalImages: HistoricalImages | undefined;

  try {
    // 1) Slack-pasted images: up to MAX_IMAGE_ATTACHMENTS supported image files.
    const currentSlack = await loadSlackImages(env, event.files);
    images.push(...currentSlack.loaded.map(({ image }) => image));
    historyMarkers.push(
      ...currentSlack.loaded.map(({ file }) => `[user attached image: ${file.name ?? "unnamed"}]`),
    );
    const omitted = currentSlack.omitted;
    if (omitted > 0) {
      modelNotes.push(`[${omitted} more image(s) omitted — too large or unsupported format]`);
    }

    // 2) Figma frame screenshot: first figma.com URL with a node-id in the text
    // (cap: 1 frame per message). Reuses the same image-render endpoint the
    // proposal cards use, then downloads the short-lived signed PNG.
    const figmaParts = findFigmaFrameUrl(userText);
    if (figmaParts) {
      const figmaImage = await loadFigmaImage(env, figmaParts);
      if (figmaImage) {
        images.push(figmaImage);
        historyMarkers.push("[figma frame screenshot attached]");
      } else modelNotes.push("[figma screenshot unavailable]");
    }

    // One-follow-up lifetime. Only rehydrate the immediately previous user
    // turn, and only when this turn did not introduce a new image of its own.
    const previous = selectPreviousVisionReference(history, Boolean(reference));
    if (previous) {
      const priorSlack = await loadSlackImages(env, previous.reference.files);
      const priorImages = priorSlack.loaded.map(({ image }) => image);
      if (previous.reference.figmaUrl) {
        const parts = parseFigmaUrl(previous.reference.figmaUrl);
        if (parts) {
          const figmaImage = await loadFigmaImage(env, parts);
          if (figmaImage) priorImages.push(figmaImage);
        }
      }
      if (priorImages.length) {
        historicalImages = { turnTs: previous.turnTs, images: priorImages };
      }
    }
  } catch (err) {
    // Vision is additive — never let it break the reply. Keep whatever was
    // collected before the failure and continue text-first.
    console.warn(
      `[vision] collection failed, degrading: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return {
    images,
    modelText: [userText, ...modelNotes].join("\n"),
    historyText: [userText, ...historyMarkers].join("\n"),
    ...(historicalImages ? { historicalImages } : {}),
    ...(reference ? { reference } : {}),
  };
}

async function loadSlackImages(
  env: Env,
  files: SlackEventFile[] | undefined,
): Promise<{ loaded: Array<{ file: SlackEventFile; image: AgentImage }>; omitted: number }> {
  const loaded: Array<{ file: SlackEventFile; image: AgentImage }> = [];
  let omitted = 0;
  const imageFiles = (files ?? []).filter(
    (file) => file.mimetype?.startsWith("image/") && Boolean(file.url_private),
  );
  for (const file of imageFiles) {
    if (
      loaded.length >= MAX_IMAGE_ATTACHMENTS ||
      !file.mimetype ||
      !SUPPORTED_IMAGE_TYPES.has(file.mimetype) ||
      !file.url_private ||
      (typeof file.size === "number" && file.size > MAX_IMAGE_BYTES)
    ) {
      omitted++;
      continue;
    }
    const bytes = await fetchBytes(file.url_private, {
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
    });
    if (!bytes || bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
      omitted++;
      continue;
    }
    loaded.push({ file, image: { media_type: file.mimetype, data: bytesToBase64(bytes) } });
  }
  return { loaded, omitted };
}

async function loadFigmaImage(
  env: Env,
  parts: NonNullable<ReturnType<typeof parseFigmaUrl>>,
): Promise<AgentImage | null> {
  const pngUrl = await fetchFigmaImagePngUrl(env, parts.fileKey, parts.nodeId, 1);
  if (!pngUrl) return null;
  const png = await fetchBytes(pngUrl);
  if (!png || png.byteLength === 0 || png.byteLength > MAX_IMAGE_BYTES) return null;
  return { media_type: "image/png", data: bytesToBase64(png) };
}

/** First figma.com URL in the message that carries a node-id (Slack wraps links
 *  as `<url>` or `<url|label>` — strip that before parsing). */
function findFigmaFrameUrl(text: string): ReturnType<typeof parseFigmaUrl> {
  const matches = text.match(/https?:\/\/[^\s<>|]+/g) ?? [];
  for (const candidate of matches) {
    const parts = parseFigmaUrl(candidate);
    if (parts) return parts;
  }
  return null;
}

/** Timeout-guarded byte fetch; null on any failure. Slack serves an HTML login
 *  page with a 200 when the token can't read the file — treat that as failure. */
async function fetchBytes(
  url: string,
  headers?: Record<string, string>,
): Promise<ArrayBuffer | null> {
  try {
    const res = await countedFetch(url, { headers }, IMAGE_FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** ArrayBuffer -> base64, chunked so String.fromCharCode never overflows the
 *  argument limit on multi-MB images. */
function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
