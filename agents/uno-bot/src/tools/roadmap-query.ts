// roadmap_query executor — READ-ONLY. The precise primitive for Roadmap-card
// questions (status / owner / title lookups), replacing chains of weak
// /v1/search calls that miss existing cards (live failures 2026-07-10) and
// burn the free-tier subrequest budget. Queries the Roadmap database directly
// (1-2 subrequests, complete result set) and does fuzzy title matching in the
// Worker so vague descriptions come back as ranked "did you mean" candidates.

import type { Env } from "../types";
import { queryRoadmapCards, type RoadmapCard } from "../integrations/notion";

const MAX_ENUMERATION_ROWS = 30;
const MAX_TITLE_CANDIDATES = 6;

function tokens(text: string): string[] {
  return Array.from(
    new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)),
  );
}

// Fuzzy title score: token overlap (weighted by query coverage) with a bonus
// for a literal substring hit. Good enough for "vague description → card".
function scoreTitle(queryToks: string[], rawQuery: string, title: string): number {
  const titleLower = title.toLowerCase();
  const titleToks = new Set(tokens(title));
  if (!queryToks.length) return 0;
  const overlap = queryToks.filter((t) => titleToks.has(t)).length;
  let score = overlap / queryToks.length;
  if (titleLower.includes(rawQuery.toLowerCase().trim())) score += 1;
  return score;
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
    let cards = await queryRoadmapCards(env, designStatus ? { designStatus } : {});

    if (cardNumber !== null) {
      cards = cards.filter((c) => c.card_number === cardNumber);
    }
    if (person) {
      const p = person.toLowerCase();
      cards = cards.filter((c) =>
        Object.values(c.people).some((names) => names.some((n) => n.toLowerCase().includes(p))),
      );
    }

    let results: (RoadmapCard & { match_score?: number })[];
    let note: string;
    if (title) {
      const qToks = tokens(title);
      results = cards
        .map((c) => ({ ...c, match_score: Number(scoreTitle(qToks, title, c.title).toFixed(2)) }))
        .filter((c) => (c.match_score ?? 0) > 0)
        .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
        .slice(0, MAX_TITLE_CANDIDATES);
      note = results.length
        ? "Ranked title candidates from the live Roadmap board (complete scan, not a keyword sample). If the top hit clearly matches, answer from it and cite its link; if it's ambiguous, offer the top few as 'did you mean' WITH their links — never dead-end asking for a link without suggesting candidates."
        : "No Roadmap card resembles that title (this was a complete scan of the board, not a search miss). Say so plainly, and offer the closest-status alternatives only if helpful.";
    } else {
      results = cards.slice(0, MAX_ENUMERATION_ROWS);
      note =
        "Complete result set from the live Roadmap board — safe to enumerate as the full answer. Cite the board and link cards you name." +
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
