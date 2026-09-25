// Extract a Notion PRD reference from the root message of a Slack thread.
// Mirrors v1 behavior: the polling bot posts a PRD notification (with a
// notion.so link) as the thread root, and designers reply with "implement X"
// in that thread. v2 walks the parent message, finds the Notion URL, and
// forwards the page id + url to the figma-implement workflow as before.

import type { Env } from "../types";
import { canonicalNotionUrl } from "../integrations/notion";
import { conversationsReplies } from "./api";

export interface NotionPrdContext {
  id: string;   // 32-char hex page id, dashes stripped
  url: string;  // full notion.so URL
}

/** Notion page ids are 32-char hex; URLs may include them in UUID format
 *  (8-4-4-4-12) or as a continuous 32-char hex string with no dashes. */
const NOTION_ID_RE = /[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}/i;

/** Slack stores URLs as `<https://...>` or `<https://...|display>`.
 *  This pulls just the URL part, stopping at `>` or `|`. app.notion.com is
 *  the host the API handed out for created PRDs until #729, so poll roots
 *  posted before that fix carry it. */
const NOTION_URL_RE = /<?(https?:\/\/(?:(?:www\.)?notion\.so|app\.notion\.com)\/[^\s>|"]+)/i;

export function extractNotionPrdFromText(text: string | undefined): NotionPrdContext | null {
  if (!text) return null;
  const urlMatch = text.match(NOTION_URL_RE);
  if (!urlMatch) return null;
  const url = urlMatch[1]!;
  const idMatch = url.match(NOTION_ID_RE);
  if (!idMatch) return null;
  const id = idMatch[0].replace(/-/g, "").toLowerCase();
  return { id, url: canonicalNotionUrl(url) };
}

export async function extractPrdFromThreadRoot(
  env: Env,
  channel: string,
  threadTs: string,
): Promise<NotionPrdContext | null> {
  const replies = await conversationsReplies(env, channel, threadTs, 1);
  if (!replies.ok) return null;
  const parent = replies.messages?.[0];
  if (!parent?.text) return null;
  return extractNotionPrdFromText(parent.text);
}
