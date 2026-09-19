// roadmap_query executor — READ-ONLY. The precise primitive for Roadmap-card
// questions (status / owner / title lookups), replacing chains of weak
// /v1/search calls that miss existing cards (live failures 2026-07-10) and
// burn the free-tier subrequest budget. Queries the Roadmap database directly
// (server-side filtered for title / card-number asks, so a match is found
// wherever it sits on the board) and ranks fuzzy title matches in the Worker so
// vague descriptions come back as "did you mean" candidates. A partial read is
// reported as partial — never as a complete scan.
//
// A title lookup serves two questions that want different shapes. "Find the
// card about X" wants a short ranked list; "how many cards are titled X" wants
// every card with X in its title. Both used to get the first: asked on
// 2026-09-18 how many cards start with "DS Update", the bot received the six
// newest of nine under a note saying the whole board had been searched, and
// answered "at least 7" with the wrong earliest card. So a card whose title
// contains the asked-for phrase is a HIT — every hit comes back and is counted —
// and the candidate cap applies only to the looser matches after them.

import type { Env } from "../types";
import { queryRoadmapCards, type RoadmapCard } from "../integrations/notion";

const MAX_ENUMERATION_ROWS = 30;
const MAX_TITLE_CANDIDATES = 6;

// Notion rejects an unknown filter property with a 400 validation_error; that —
// not an empty result — is what a property rename looks like.
function isFilterDriftError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /validation_error|Could not find property/i.test(msg);
}

function tokens(text: string): string[] {
  return Array.from(
    new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)),
  );
}

/** Lowercased, every run of punctuation and space collapsed to one space — so
 *  "DS Update:" and "ds update" read as the same words. */
function normalizeTitle(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** True when the title contains the query as a run of whole words. A substring
 *  test is not enough for a short query: "DS" is a word in "DS Update: Tag" and
 *  only a pair of letters in "Cards". */
function containsPhrase(title: string, query: string): boolean {
  const q = normalizeTitle(query);
  return q !== "" && ` ${normalizeTitle(title)} `.includes(` ${q} `);
}

// Fuzzy title score: token overlap (weighted by query coverage) with a bonus
// for a literal substring hit. Good enough for "vague description → card".
// A query made only of short words ("DS", "AI") has no tokens, so it scores on
// the substring bonus alone — it used to score zero against every card.
function scoreTitle(queryToks: string[], rawQuery: string, title: string): number {
  const titleLower = title.toLowerCase();
  const titleToks = new Set(tokens(title));
  let score = queryToks.length
    ? queryToks.filter((t) => titleToks.has(t)).length / queryToks.length
    : 0;
  const q = rawQuery.toLowerCase().trim();
  if (q && titleLower.includes(q)) score += 1;
  return score;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The note on a non-empty title result. Every branch says whether the hits are
 * the whole set, because the failure it exists to prevent is a cut list read as
 * a complete one.
 */
function titleNote(
  title: string,
  r: { hits: number; listedHits: number; similar: number; similarTotal: number; truncated: boolean },
): string {
  const pick =
    "If they want one card and the top hit clearly matches, answer from it and cite its link; if it's ambiguous, offer the top few as 'did you mean' WITH their links — never dead-end asking for a link without suggesting candidates.";
  if (r.hits > 0) {
    const set =
      r.hits > r.listedHits
        ? `${r.truncated ? "At least " : ""}${plural(r.hits, "card")} have "${title}" in their title; only the first ${r.listedHits} are listed, so say the list is partial and give the total.`
        : r.truncated
          ? `Found ${plural(r.hits, "card")} with "${title}" in the title, but the board was too large to read fully, so there may be more — say "at least ${r.hits}".`
          : `Every card with "${title}" in its title is listed first (${r.hits} in all), from a search of the whole board — this is the complete set, and ${r.hits} is the exact count.`;
    const rest =
      r.similar > 0
        ? ` The ${plural(r.similar, "card")} after that only resemble the phrase (title_match "similar") — offer those as 'did you mean', never count them.`
        : "";
    return `${set}${rest} ${pick}`;
  }
  return (
    `No card title contains "${title}" as written; these are the ${r.similar} closest ${r.similarTotal > r.similar ? `of ${r.similarTotal} ` : ""}ranked candidates from the live Roadmap board` +
    (r.truncated
      ? ", from a PARTIAL read (the board was too large to read fully)."
      : " (the whole board was searched for these words, not a keyword sample).") +
    ` ${pick}`
  );
}

export async function executeRoadmapQuery(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const designStatus = typeof input.design_status === "string" ? input.design_status.trim() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const person = typeof input.person === "string" ? input.person.trim() : "";
  const cardNumber = typeof input.card_number === "number" ? input.card_number : null;

  if (!designStatus && !title && !person && cardNumber === null) {
    return JSON.stringify({
      ok: false,
      error: "provide at least one of: design_status, title, person, card_number",
    });
  }

  try {
    // Title + card-number narrowing happens SERVER-side so a match is found
    // wherever it sits on the board (the tail used to be invisible — 2026-07-29).
    const titleTokens = title ? tokens(title) : [];
    let cards: RoadmapCard[];
    let truncated: boolean;
    try {
      ({ rows: cards, truncated } = await queryRoadmapCards(env, {
        designStatus,
        titleTokens,
        titlePhrase: title,
        cardNumber,
      }));
    } catch (err) {
      // A renamed property fails CLOSED — Notion 400s the filter, it does not
      // return zero rows. So the drift fallback has to hang off the error, not
      // off an empty result (an empty filtered result is a true absence: the
      // server's case-insensitive `contains` is a superset of what scoreTitle
      // could rank above zero, so a rescan would only re-find the same nothing).
      if (!isFilterDriftError(err)) throw err;
      console.warn("[roadmap] filter rejected — property names may have drifted; unfiltered rescan");
      ({ rows: cards, truncated } = await queryRoadmapCards(env, { designStatus }));
      if (cardNumber !== null) cards = cards.filter((c) => c.card_number === cardNumber);
    }

    if (person) {
      const p = person.toLowerCase();
      cards = cards.filter((c) =>
        Object.values(c.people).some((names) => names.some((n) => n.toLowerCase().includes(p))),
      );
    }

    let results: (RoadmapCard & { match_score?: number; title_match?: "contains" | "similar" })[];
    let containsCount: number | undefined;
    let note: string;
    if (title) {
      const ranked = cards
        .map((c) => ({
          ...c,
          match_score: Number(scoreTitle(titleTokens, title, c.title).toFixed(2)),
          title_match: containsPhrase(c.title, title) ? ("contains" as const) : ("similar" as const),
        }))
        // An exact card-number hit is authoritative — don't drop it because the
        // user's remembered title shares no word with the real one.
        .filter((c) => c.title_match === "contains" || c.match_score > 0 || c.card_number === cardNumber)
        // Hits first: a card that merely scores as high must never crowd one out.
        .sort(
          (a, b) =>
            Number(b.title_match === "contains") - Number(a.title_match === "contains") ||
            b.match_score - a.match_score,
        );
      const hits = ranked.filter((c) => c.title_match === "contains").length;
      const listedHits = Math.min(hits, MAX_ENUMERATION_ROWS);
      // Every hit, up to the enumeration cap; candidates only fill what is left
      // of the candidate list, so they never pad out a set of hits.
      results = ranked.slice(0, Math.max(listedHits, MAX_TITLE_CANDIDATES));
      containsCount = hits;
      note = results.length
        ? titleNote(title, {
            hits,
            listedHits,
            similar: results.length - listedHits,
            similarTotal: ranked.length - hits,
            truncated,
          })
        : truncated
          ? "No match among the cards read, BUT the board was too large to read fully — do NOT say the card doesn't exist. Say you couldn't find it and ask for the link or a distinctive word from its title."
          : "No Roadmap card resembles that title (the whole board was searched for those words, so this is a real absence, not a search miss). Say so plainly — and if the thing they named might be a doc rather than a card, check the docs before concluding.";
    } else {
      results = cards.slice(0, MAX_ENUMERATION_ROWS);
      note =
        (truncated
          ? "PARTIAL result set — the board has more rows than could be read. Say the list is partial; never present it as the whole board."
          : "Complete result set from the live Roadmap board — safe to enumerate as the full answer.") +
        " Cite the board and link cards you name." +
        (cards.length > MAX_ENUMERATION_ROWS ? ` (${cards.length - MAX_ENUMERATION_ROWS} more rows truncated — say the list is the first ${MAX_ENUMERATION_ROWS}.)` : "");
    }

    return JSON.stringify({
      ok: true,
      filters: {
        ...(designStatus ? { design_status: designStatus } : {}),
        ...(title ? { title } : {}),
        ...(person ? { person } : {}),
        ...(cardNumber !== null ? { card_number: cardNumber } : {}),
      },
      count: results.length,
      ...(containsCount !== undefined ? { contains_count: containsCount } : {}),
      cards: results,
      note,
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      note: "Roadmap query failed — do not fabricate. If the error names valid status options, retry with one of those; otherwise tell the user the board couldn't be read just now.",
    });
  }
}
