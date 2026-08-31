const CANVAS_TEXT_CAP = 8000;
const CANVAS_MIMETYPE = "application/vnd.slack-docs";

type RequestFn = (url: string, init?: RequestInit) => Promise<Response>;

export type SlackCanvasRead =
  | { ok: true; canvasId: string; title: string; content: string }
  | { ok: false; error: string };

export function parseSlackCanvasId(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!/(^|\.)slack\.com$/i.test(url.hostname)) return null;
  if (!/^\/(?:docs|canvas|files)\//i.test(url.pathname)) return null;
  return url.pathname.match(/(?:^|\/)(F[A-Z0-9]{8,})(?:\/|$)/i)?.[1]?.toUpperCase() ?? null;
}

function textFromCanvas(body: string, contentType: string): string {
  const text = /html/i.test(contentType)
    ? body
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
    : body;
  return text.replace(/\s+/g, " ").trim().slice(0, CANVAS_TEXT_CAP);
}

export async function readSlackCanvas(
  canvasUrl: string,
  botToken: string,
  request: RequestFn = fetch,
): Promise<SlackCanvasRead> {
  const canvasId = parseSlackCanvasId(canvasUrl);
  if (!canvasId) return { ok: false, error: "couldn't extract a Slack Canvas id from that URL" };
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
      url_private_download?: string;
      url_private?: string;
    };
  };
  if (!infoResponse.ok || !info.ok || !info.file) {
    return { ok: false, error: `Slack files.info failed: ${info.error ?? `HTTP ${infoResponse.status}`}` };
  }
  if (info.file.mimetype !== CANVAS_MIMETYPE && info.file.filetype !== "canvas") {
    return { ok: false, error: `Slack file ${canvasId} is not a Canvas` };
  }

  const downloadUrl = info.file.url_private_download ?? info.file.url_private;
  if (!downloadUrl) return { ok: false, error: `Slack Canvas ${canvasId} has no readable content URL` };
  const contentResponse = await request(downloadUrl, { headers });
  if (!contentResponse.ok) {
    return { ok: false, error: `Slack Canvas download failed: HTTP ${contentResponse.status}` };
  }
  const content = textFromCanvas(
    await contentResponse.text(),
    contentResponse.headers.get("content-type") ?? "",
  );
  return {
    ok: true,
    canvasId,
    title: info.file.title?.trim() || "Untitled Canvas",
    content,
  };
}
