import { parseSlackCanvasId } from "../slack/canvas-reference";
import { htmlToPlainText } from "./html-to-text";

type RequestFn = (url: string, init?: RequestInit) => Promise<Response>;

const CANVAS_TEXT_CAP = 8000;
const CANVAS_MIMETYPE = "application/vnd.slack-docs";

export type SlackCanvasSourceRead =
  | { ok: true; url: string; title: string; content: string }
  | { ok: false; error: string };

export async function readSlackCanvasSource(
  url: string,
  botToken: string,
  sharedCanvasIds: readonly string[],
  request: RequestFn,
): Promise<SlackCanvasSourceRead> {
  const canvasId = parseSlackCanvasId(url);
  if (!canvasId) return { ok: false, error: "invalid Slack Canvas URL" };
  const allowed = sharedCanvasIds.some((id) => id.toUpperCase() === canvasId);
  if (!allowed) {
    return {
      ok: false,
      error: "Slack Canvas access is limited to canvases shared into this conversation",
    };
  }
  if (!botToken) return { ok: false, error: "SLACK_BOT_TOKEN is not configured" };

  const headers = { authorization: `Bearer ${botToken}` };
  const infoUrl = `https://slack.com/api/files.info?${new URLSearchParams({ file: canvasId })}`;
  const infoResponse = await request(infoUrl, { headers });
  const info = (await infoResponse.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    file?: {
      title?: string;
      mimetype?: string;
      filetype?: string;
      permalink?: string;
      url_private_download?: string;
      url_private?: string;
    };
  };
  if (!infoResponse.ok || !info.ok || !info.file) {
    return {
      ok: false,
      error: `Slack files.info failed: ${info.error ?? `HTTP ${infoResponse.status}`}`,
    };
  }
  if (info.file.mimetype !== CANVAS_MIMETYPE && info.file.filetype !== "canvas") {
    return { ok: false, error: `Slack file ${canvasId} is not a Canvas` };
  }

  const downloadUrl = info.file.url_private_download ?? info.file.url_private;
  if (!downloadUrl) {
    return { ok: false, error: `Slack Canvas ${canvasId} has no readable content URL` };
  }
  const contentResponse = await request(downloadUrl, { headers });
  if (!contentResponse.ok) {
    return { ok: false, error: `Slack Canvas download failed: HTTP ${contentResponse.status}` };
  }
  const raw = await contentResponse.text();
  const contentType = contentResponse.headers.get("content-type") ?? "";
  const plain = /html/i.test(contentType) ? htmlToPlainText(raw) : raw;
  return {
    ok: true,
    url: info.file.permalink ?? url,
    title: info.file.title?.trim() || "Untitled Canvas",
    content: plain.replace(/\s+/g, " ").trim().slice(0, CANVAS_TEXT_CAP),
  };
}
