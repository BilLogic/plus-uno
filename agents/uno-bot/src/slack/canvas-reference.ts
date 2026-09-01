interface CanvasAttachment {
  id?: string;
  filetype?: string;
  mimetype?: string;
  permalink?: string;
}

interface CanvasHistoryTurn {
  role: "user" | "assistant";
  content: string;
  sharedCanvasIds?: readonly string[];
}

interface SlackHistoryMessage {
  user?: string;
  bot_id?: string;
  text?: string;
  files?: readonly CanvasAttachment[];
}

function canvasIdFromAttachment(file: CanvasAttachment): string | null {
  const id = file.id?.toUpperCase();
  const isCanvas = file.filetype === "canvas" || file.mimetype === "application/vnd.slack-docs";
  return isCanvas && id && /^F[A-Z0-9]{8,}$/.test(id) ? id : null;
}

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

export function canvasIdsSharedByMessage(
  text: string,
  files: readonly CanvasAttachment[] | undefined,
): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(/https?:\/\/[^\s<>|)"']+/gi)) {
    const id = parseSlackCanvasId(match[0]);
    if (id) ids.add(id);
  }
  for (const file of files ?? []) {
    const id = canvasIdFromAttachment(file);
    if (id) ids.add(id);
  }
  return [...ids];
}

export function canvasIdsSharedBySlackHistoryMessage(
  message: SlackHistoryMessage,
): string[] {
  if (!message.user || message.bot_id) return [];
  return canvasIdsSharedByMessage(message.text ?? "", message.files);
}

export function messageTextWithCanvasAttachments(
  text: string,
  files: readonly CanvasAttachment[] | undefined,
): string {
  const references: string[] = [];
  for (const file of files ?? []) {
    const id = canvasIdFromAttachment(file);
    if (!id) continue;
    const permalinkId = file.permalink ? parseSlackCanvasId(file.permalink) : null;
    const url = permalinkId === id ? file.permalink! : `https://slack.com/files/${id}`;
    references.push(`[Slack Canvas shared in this conversation: ${url}]`);
  }
  return [text.trim(), ...references].filter(Boolean).join("\n\n");
}

export function canvasIdsSharedIntoConversation(
  currentText: string,
  currentFiles: readonly CanvasAttachment[] | undefined,
  history: readonly CanvasHistoryTurn[],
): string[] {
  const ids = new Set<string>();
  for (const turn of history) {
    if (turn.role !== "user") continue;
    for (const id of turn.sharedCanvasIds ?? []) ids.add(id.toUpperCase());
  }
  for (const id of canvasIdsSharedByMessage(currentText, currentFiles)) ids.add(id);
  return [...ids];
}
