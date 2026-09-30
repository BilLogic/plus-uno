// Finding a source nobody linked: a message names a thing ("the booking PRD",
// "the tutor help center") without a link, and the sweep searches Notion and
// GitHub for it before judging drift.
//
// WHAT IS SEARCHED FOR. Two kinds of query, each capped per thread:
//   • a NAMED THING — "the <up to four words> PRD / doc / spec / page / guide /
//     help center / …" in any message (`namedThings`);
//   • for a thread that asks a question and gets an answer, the question's own
//     content words, so an undocumented answer can be placed (`questionQuery`).
//
// WHAT IS KEPT. Only the top hit, and only when it clears `MATCH_FLOOR`
// (`bestHit`). The score is the overlap coefficient of the two word sets — the
// share of the SMALLER set found in the other — with stop words and document
// nouns left out, so "booking PRD" matches "Booking Flow PRD" and a question
// about tutor ratios in training sessions matches "Tutor Training PRD". Two
// shared words are needed whenever both sides have two or more, so one common
// word ("tutor") never carries a match on its own. A source found this way is
// marked `foundBy: "search"`, and the card says so, so a confirmer can reject a
// wrong target with one reply.
//
// Notion first: it is the one estate uno-bot writes. GitHub is searched only
// when Notion has no hit above the floor, and a GitHub hit is read-only context.
//
// PURE: the searches are a port (`SourceSearch`), bound in `./env.ts`.

import type { SweepMessage, TargetKind } from "./finding";

/** A hit's score must reach this to be kept. */
export const MATCH_FLOOR = 0.75;

/** Queries run per thread (or per note or card): each costs a search call. */
export const MAX_SEARCHES_PER_UNIT = 2;

/** One search result, before it is read. */
export interface SearchHit {
  url: string;
  title: string;
  kind: TargetKind;
}

/** The searches, with the bot's own credentials. Each call is one
 *  subrequest; a failed search throws. */
export interface SourceSearch {
  notion(query: string): Promise<SearchHit[]>;
  /** Files in the Worker's default repo; absent, GitHub is not searched. */
  github?(query: string): Promise<SearchHit[]>;
}

/** Nouns that name a kind of document rather than which one. */
const DOC_NOUNS = new Set([
  "prd",
  "prds",
  "doc",
  "docs",
  "document",
  "spec",
  "specs",
  "page",
  "pages",
  "guide",
  "playbook",
  "brief",
  "readme",
  "handbook",
  "wiki",
  "notion",
  "md",
]);

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from", "has", "have", "how",
  "i", "in", "is", "it", "its", "of", "on", "or", "our", "should", "so", "that", "the", "their", "this", "to",
  "was", "we", "what", "when", "where", "which", "who", "why", "will", "with", "you", "your", "any", "there",
  "they", "them", "us", "me", "my", "if", "about", "into", "per", "vs", "still", "now", "just", "also", "get",
]);

/** What a name ends with to count as a document's name. */
const NAMED =
  /\bthe\s+((?:[A-Za-z0-9][\w'&-]*\s+){0,4}?(?:PRD|PRDs|doc|docs|spec|page|guide|help\s+center|playbook|brief|README|handbook|wiki))\b/gi;

/**
 * The documents a thread names without linking, each once, in order: "the
 * booking PRD" → `booking PRD`. A name that is only a document noun ("the
 * doc") names nothing.
 *
 * @param texts - The messages' text
 */
export function namedThings(texts: readonly string[]): string[] {
  const out: string[] = [];
  for (const text of texts) {
    // A linked page is followed, not searched for: drop Slack's link markup.
    const bare = text.replace(/<[^>]*>/g, " ");
    for (const m of bare.matchAll(NAMED)) {
      const name = m[1]!.replace(/\s+/g, " ").trim();
      if (!words(name).length) continue;
      if (!out.some((n) => n.toLowerCase() === name.toLowerCase())) out.push(name);
    }
  }
  return out;
}

/**
 * The question a thread asks, as a search query: the content words of the
 * first message holding a `?` — the root, usually — at most five, or null
 * when it holds none.
 *
 * @param messages - The thread, root first
 */
export function questionQuery(messages: readonly SweepMessage[]): string | null {
  const asking = messages.find((m) => m.text.includes("?"));
  if (!asking) return null;
  const content = words(asking.text.replace(/<[^>]*>/g, " ")).slice(0, 5);
  return content.length >= 2 ? content.join(" ") : null;
}

/**
 * Whether a thread reads as a question someone else answered: a message with a
 * `?`, and a later reply by someone other than the asker.
 *
 * @param messages - The thread's human messages, root first
 */
export function looksAnswered(messages: readonly SweepMessage[]): boolean {
  const i = messages.findIndex((m) => m.text.includes("?"));
  if (i < 0) return false;
  const asker = messages[i]!.user;
  return messages.slice(i + 1).some((m) => m.user !== asker && m.text.trim().length > 0);
}

/**
 * How well a title matches a query, 0–1: the overlap coefficient of their
 * content words, or 0 when the overlap is thinner than two words while both
 * sides have two or more.
 *
 * @param query - What was searched for
 * @param title - A hit's title (for a file, its path)
 */
export function matchScore(query: string, title: string): number {
  const q = new Set(words(query));
  const t = new Set(words(title));
  if (!q.size || !t.size) return 0;
  let shared = 0;
  for (const w of q) if (t.has(w)) shared += 1;
  if (shared < Math.min(2, q.size, t.size)) return 0;
  return shared / Math.min(q.size, t.size);
}

/**
 * The top hit, when it clears the floor; null otherwise. Ties keep the
 * search's own order.
 *
 * @param query - What was searched for
 * @param hits - What the search returned, in its order
 */
export function bestHit(query: string, hits: readonly SearchHit[]): SearchHit | null {
  let best: { hit: SearchHit; score: number } | null = null;
  for (const hit of hits) {
    const score = matchScore(query, hit.title);
    if (!best || score > best.score) best = { hit, score };
  }
  return best && best.score >= MATCH_FLOOR ? best.hit : null;
}

/**
 * Search for each query, Notion first and GitHub only when Notion has no hit
 * above the floor; each query's best hit, once per URL, never one already
 * `known` (linked, or found by an earlier query).
 *
 * @param search - The searches
 * @param queries - What to search for, at most `MAX_SEARCHES_PER_UNIT` used
 * @param known - URLs the unit already has
 */
export async function findBySearch(
  search: SourceSearch,
  queries: readonly string[],
  known: ReadonlySet<string> = new Set(),
): Promise<SearchHit[]> {
  const found: SearchHit[] = [];
  const seen = new Set(known);
  for (const query of queries.slice(0, MAX_SEARCHES_PER_UNIT)) {
    let hit = bestHit(query, await search.notion(query));
    if (!hit && search.github) hit = bestHit(query, await search.github(query));
    if (!hit || seen.has(hit.url)) continue;
    seen.add(hit.url);
    found.push(hit);
  }
  return found;
}

/** Content words, lowercased, singular-ish: no stop words, no document nouns. */
function words(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (raw.length < 2 || STOP_WORDS.has(raw) || DOC_NOUNS.has(raw)) continue;
    const w = raw.length > 3 && raw.endsWith("s") && !raw.endsWith("ss") ? raw.slice(0, -1) : raw;
    if (!out.includes(w)) out.push(w);
  }
  return out;
}
