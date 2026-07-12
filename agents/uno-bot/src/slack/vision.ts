// Vision input (2026-07-09): Slack-pasted images + Figma frame screenshots are
// attached to the CURRENT user turn as base64 image blocks so the model can
// actually see them. Everything here is best-effort — any failure degrades to
// text-only and must never break the reply. Base64 is NEVER persisted to the
// Durable Object history; `historyText` carries text markers instead.
// (Extracted from events.ts, 2026-07-12.)

import type { Env } from "../types";
import type { AgentImage } from "../agent/loop-shared";
import type { SlackMessageEvent } from "./types";
import { fetchWithTimeout } from "../http";
import { parseFigmaUrl, fetchFigmaImagePngUrl } from "../integrations/figma";

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
}

export async function collectVisionInputs(
  env: Env,
  event: SlackMessageEvent,
  userText: string,
): Promise<VisionInputs> {
  const images: AgentImage[] = [];
  const modelNotes: string[] = [];
  const historyMarkers: string[] = [];

  try {
    // 1) Slack-pasted images: up to MAX_IMAGE_ATTACHMENTS supported image files.
    const files = Array.isArray(event.files) ? event.files : [];
    const imageFiles = files.filter(
      (f) => typeof f?.mimetype === "string" && f.mimetype.startsWith("image/") && !!f.url_private,
    );
    let omitted = 0;
    for (const f of imageFiles) {
      if (
        images.length >= MAX_IMAGE_ATTACHMENTS ||
        !SUPPORTED_IMAGE_TYPES.has(f.mimetype!) ||
        (typeof f.size === "number" && f.size > MAX_IMAGE_BYTES)
      ) {
        omitted++;
        continue;
      }
      const bytes = await fetchBytes(f.url_private!, {
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      });
      if (!bytes || bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
        omitted++;
        continue;
      }
      images.push({ media_type: f.mimetype!, data: bytesToBase64(bytes) });
      historyMarkers.push(`[user attached image: ${f.name ?? "unnamed"}]`);
    }
    if (omitted > 0) {
      modelNotes.push(`[${omitted} more image(s) omitted — too large or unsupported format]`);
    }

    // 2) Figma frame screenshot: first figma.com URL with a node-id in the text
    // (cap: 1 frame per message). Reuses the same image-render endpoint the
    // proposal cards use, then downloads the short-lived signed PNG.
    const figmaParts = findFigmaFrameUrl(userText);
    if (figmaParts) {
      let attached = false;
      const pngUrl = await fetchFigmaImagePngUrl(env, figmaParts.fileKey, figmaParts.nodeId, 1);
      if (pngUrl) {
        const png = await fetchBytes(pngUrl);
        if (png && png.byteLength > 0 && png.byteLength <= MAX_IMAGE_BYTES) {
          images.push({ media_type: "image/png", data: bytesToBase64(png) });
          historyMarkers.push("[figma frame screenshot attached]");
          attached = true;
        }
      }
      if (!attached) modelNotes.push("[figma screenshot unavailable]");
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
  };
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
    const res = await fetchWithTimeout(url, { headers }, IMAGE_FETCH_TIMEOUT_MS);
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
